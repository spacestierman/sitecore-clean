define([
        "sitecore",
        "/-/speak/v1/ecm/constants.js",
        "/-/speak/v1/ecm/MessageBase.js",
        "/-/speak/v1/ecm/MessageTabsHelper.js",
        "/-/speak/v1/ecm/GlobalValidationService.js",
        "/-/speak/v1/ecm/DialogService.js",
        "/-/speak/v1/ecm/ServerRequest.js",
        "/-/speak/v1/ecm/MessageValidationService.js",
        "/-/speak/v1/ecm/MessageService.js",
        "/-/speak/v1/ecm/Notifications.js",
        "/-/speak/v1/ecm/RecipientsService.js",
        "/-/speak/v1/ecm/constants.js"
    ],
    function(
        sitecore,
        Constants,
        messageBase,
        MessageTabsHelper,
        GlobalValidationService,
        DialogService,
        ServerRequest,
        MessageValidationService,
        MessageService,
        notifications,
        RecipientsService,
        Constants
    ) {
        var messageCreation = messageBase.extend({
            initialized: function() {
                this._super();
                this.initUnload();
                this.initTabs();
                MessageService.messageContext = this.MessageContext;
                if (this.MessageContext.get("messageType") === "") {
                    this.MessageContext
                        .on("change:messageType", _.once(this.bindProgressIndicatorToLoadOnDemand), this);
                } else {
                    this.bindProgressIndicatorToLoadOnDemand();
                }
                sitecore.on("change:messageContext", this.updateLanguageSwitcher, this);
                RecipientsService.load();
	            this.setLinkToReport();
            },

            initUnload: function() {
                window.onbeforeunload = _.bind(function() {
                        if (this.MessageContext.get("isModified")) {
                            return sitecore.Resources.Dictionary.translate("ECM.MessagePage.SaveBeforeLeaving");
                        }
                    },
                    this);
            },

            attachEventHandlers: function() {
                this._super();
                this.on({
				    "message:save": function(args) {
						GlobalValidationService.validateAll();
						if (GlobalValidationService.get('valid')) {
							var verified = this.verifyMessage("save", this.addCreatedEmptyList);
							args.Verified = verified;
							args.Saved = this.MessageContext.saveMessage();
						}
					},
                    'switch:to:eds:domains': function() {
						window.parent.location.replace(Constants.URLs.EdsDomains);
					},
                    'switch:to:report': function (){
                        var urlParams = this.getMessageUrlParams(),
                            reportPath = sitecore.Helpers.url.addQueryParameters(Constants.URLs['MessageReport'], urlParams);
                        location.href = reportPath;
                    }
			    }, this);
                sitecore.on({
                        "message:delivery:verifyMessage": function(actionName, isSchedule) {
                            if (this.verifyMessage("send", this.addCreatedEmptyList)) {
                                sitecore.trigger("message:delivery:dispatch", actionName, isSchedule);
                            } else {
                                sitecore.trigger("message:delivery:verification:failed");
                            }
                        },
                        "mainApp": function(subapp) {
                            this.extendSubapp(subapp);
                            sitecore.trigger("change:messageContext");
                            this.trigger("change:messageContext");
                            subapp.trigger("change:messageContext");
                        },
                        "notify:recipientList:locked": function() {
                            notifications.recipientListLocked(this.MessageBar);
                        },
                        "action:previewrecipients": function() {
                            DialogService.show("previewRecipients",
                            {
                                data: {
                                    contextApp: this,
                                    messageContext: this.MessageContext
                                }
                            });
                        },
                        "language:switch:start": function() {
                            this.PageProgressIndicator.set('isBusy', true);
                        },
                        "language:switch:success language:switch:error": function() {
                            this.PageProgressIndicator.set('isBusy', false);
                        }
                    },
                    this);

                document.onkeydown = document.onkeypress = _.bind(function(e) {
                        if (e.keyCode === 83 && e.ctrlKey) {
                            e.preventDefault();
                            if (this.MessageContext.get('isModified')) {
                                this.trigger('message:save', {});
                            }
                        }
                    },
                    this);
            },

            extendSubapp: function(subapp) {
                _.extend(subapp,
                {
                    MessageContext: this.MessageContext,
                    MessageBar: this.MessageBar,
                    AddVariant: this.AddVariant,
                    DuplicateVariant: this.DuplicateVariant,
                    RemoveVariant: this.RemoveVariant,
                    AccountInformationExt: this.AccountInformationExt,
                    LanguageSwitcher: this.LanguageSwitcher,
                    SaveButton: this.SaveButton,
                    MessageTabs: this.TabControl
                });
            },

            updateLanguageSwitcher: function() {
                var activeLanguages = this.LanguageSwitcher.viewModel.getActiveLanguages();
                if (this.MessageContext
                    .get("messageState") !==
                    Constants.MessageStates.DRAFT &&
                    activeLanguages.length > 1) {
                    this.LanguageSwitcher.viewModel.hideAllLanguagesItem();
                }
            },

            bindProgressIndicatorToLoadOnDemand: function() {
                var loadOnDemandPanels = MessageTabsHelper.GetLoadOnDemandPanels(this);
                sitecore.on('ajax:error',
                    function() {
                        this.PageProgressIndicator.set("isBusy", false);
                    },
                    this);

                /*
                 * Since LoadOnDemandPanel component doesn't trigger any "before load" events,
                 *  the only workaround is listen for switching between tabs
                 */
                this.TabControl.on("change:selectedTab",
                    function() {
                        var tabIndex = _.indexOf(this.TabControl.get("tabs"), this.TabControl.get("selectedTab"));
                        var currentLoadOnDemandPanel = loadOnDemandPanels[tabIndex];
                        if (!currentLoadOnDemandPanel.get("isLoaded")) {
                            this.PageProgressIndicator.set("isBusy", true);
                        }
                    },
                    this);

                _.each(loadOnDemandPanels,
                    _.bind(function(panel) {
                            if (panel) {
                                panel.on("change:isLoaded",
                                    function() {
                                        if (this.PageProgressIndicator) {
                                            this.PageProgressIndicator.set("isBusy", !panel.get("isLoaded"));
                                        }
                                    },
                                    this);
                            }
                        },
                        this));
            },

            initTabs: function() {
                MessageTabsHelper.tabOnClick(sitecore, this);
                MessageTabsHelper.setPreselectedTab(this, sitecore);
                sitecore.on({ "action:switchtab": this.onSwitchTab }, this);
            },

            // allows for tab switching, taking the state of a LoadOnDemandPanel into consideration
            onSwitchTab: function(args) {
                var tab = this.TabControl.viewModel.$el.children("ul.sc-tabcontrol-navigation")
                    .find("a:eq(" + args.tab + ")");
                tab.click();

                if (args.subtab != "undefined") {
                    var panels = MessageTabsHelper.GetLoadOnDemandPanels(this);
                    var panel = panels[args.tab];
                    if (!panel) {
                        return;
                    }

                    if (panel.get("isLoaded")) {
                        panel.viewModel.$el.find("ul.sc-tabcontrol-navigation")
                            .find("li:eq(" + args.subtab + ")")
                            .click();
                    } else {
                        panel.on("change:isLoaded",
                            function() {
                                panel.viewModel.$el.find("ul.sc-tabcontrol-navigation")
                                    .find("li:eq(" + args.subtab + ")")
                                    .click();
                            });
                    }
                }
            },

            setLinkToReport: function() {
                var urlParams = this.getMessageUrlParams(),
                    reportPath = sitecore.Helpers.url.addQueryParameters(Constants.URLs['MessageReport'], urlParams);

                this.ViewReportLink.set('navigateUrl', reportPath);
            },

            verifyMessage: function(actionName) {
                if (RecipientsService.lists.include) {
                    if (actionName === "send" && this.hasNoIncludedRecipients()) {
                        DialogService.show('alert',
                        { text: this.StringDictionary.get("ECM.Pages.Message.ThereIsNoRecipient") });
                        return false;
                    }
                }

                if (actionName === "send" &&
                    !MessageValidationService.validateMessageVariantsSubject(this.MessageContext.get("variants"))) {
                    return false;
                }

                return true;
            },

            hasNoIncludedRecipients: function() {
                if (this.MessageContext.get('messageType') === Constants.MessageTypes.AUTOMATED) {
                    return false;
                }

                if (!RecipientsService.lists.include) {
                    return true;
                }

                var result = true;
                if (MessageService.messageContext.get('totalRecipients') > 0) {
                    result = false;
                }

                return result;
            },

            hasNoAnyRecipients: function () {
                if (!RecipientsService.lists.include && !RecipientsService.lists.exclude) {
                    return true;
                }

                return !RecipientsService.lists.include.length > 0 &&
                    !RecipientsService.lists.exclude.length > 0;
            },

            addCreatedEmptyList: function(messageId, listId, listType) {
                ServerRequest(Constants.ServerRequests.ADD_RECIPIENT_LIST,
                {
                    data: { messageId: messageId, recipientListId: listId, type: listType },
                    success: function(response) {
                        if (response.error) {
                            return;
                        }
                        sitecore.trigger("add:list", messageId, listId, listType, response);
                    },
                    async: false
                });
            }
        });

        return messageCreation;
    });