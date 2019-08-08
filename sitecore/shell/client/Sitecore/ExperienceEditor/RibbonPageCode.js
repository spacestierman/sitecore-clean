define(
    [
        "sitecore",
        "/-/speak/v1/ExperienceEditor/ExperienceEditor.js",
        "/-/speak/v1/ExperienceEditor/ExperienceEditor.Context.js",
        "/-/speak/v1/ExperienceEditor/DOMHelper.js",
        "/-/speak/v1/ExperienceEditor/TranslationUtil.js"
    ],
    function(Sitecore, ExperienceEditor, ExperienceEditorContext, DOMHelper, TranslationUtil) {
        var RibbonPageCode = Sitecore.Definitions.App.extend({
            initialized: function() {
                Sitecore.ExperienceEditor = Sitecore.ExperienceEditor || {};
                this.currentContext = {
                    language: this.PageEditBar.get("language"),
                    version: this.PageEditBar.get("version"),
                    isFallback: this.PageEditBar.get("isFallback"),
                    isHome: this.PageEditBar.get("isHome"),
                    itemId: this.PageEditBar.get("itemId"),
                    database: this.PageEditBar.get("database"),
                    deviceId: this.PageEditBar.get("deviceId"),
                    isLocked: this.PageEditBar.get("isLocked"),
                    isLockedByCurrentUser: this.PageEditBar.get("isLockedByCurrentUser"),
                    canLock: this.PageEditBar.get("canLock"),
                    canUnlock: this.PageEditBar.get("canUnlock"),
                    ribbonUrl: decodeURIComponent(this.PageEditBar.get("url")),
                    siteName: this.PageEditBar.get("siteName"),
                    isReadOnly: this.PageEditBar.get("isReadOnly"),
                    trackingEnabled: this.PageEditBar.get("trackingEnabled"),
                    analyticsEnabled: "analyticsEnabled is obsolete, use trackingEnabled instead",
                    webEditMode: ExperienceEditor.Web.getUrlQueryStringValue("mode"),
                    requireLockBeforeEdit: this.PageEditBar.get("requireLockBeforeEdit"),
                    virtualFolder: this.PageEditBar.get("virtualFolder"),
                    isInFinalWorkFlow: this.PageEditBar.get("isInFinalWorkflow"),
                    canEdit: this.PageEditBar.get("canEdit"),
                    canReadLanguage: this.PageEditBar.get("canReadLanguage"),
                    canWriteLanguage: this.PageEditBar.get("canWriteLanguage"),
                    isEditAllVersionsAllowed: this.PageEditBar.get("isEditAllVersionsAllowed"),
                    isEditAllVersionsTicked: this.PageEditBar.get("isEditAllVersionsTicked"),
                    canSelectVersion: this.PageEditBar.get("canSelectVersion"),
                    latestVersionResponse: this.PageEditBar.get("latestVersionResponse"),
                    itemNotifications: this.PageEditBar.get("itemNotifications"),
                    argument: ""
                };

                var self = this;

                this.shown = ExperienceEditor.Common.getCookieValue("sitecore_webedit_ribbon") == "1";
                Object.defineProperty(this.currentContext,
                    'lockedItemsCount',
                    {
                        get: function() {
                            return ExperienceEditor.RibbonApp.getApp()
                                .canExecute("ExperienceEditor.MyItems.Count", self.currentContext);
                        }
                    });
                this.focused = false;
                this.setToggleShow();

                ExperienceEditorContext.instance = this;

                // Support old approach to load script resources. Should be removed in the next product version.
                if (Sitecore.ExperienceEditor.instance) {
                    Sitecore.ExperienceEditor.instance = this;
                }

                window.RibbonApp = this;

                window.top.ExperienceEditor = ExperienceEditor;

                this.initializeExperienceEditorObject(this); //Deprecated

                DOMHelper.divideButtons("sc-chunk-button-small", "sc-chunk-button-small-list");
                DOMHelper.divideButtons("sc-chunk-check-small", "sc-chunk-check-list");

                this.initializeRibbon();

                $(window).bind("click resize",
                    function() {
                        self.setHeight();
                    });

                DOMHelper.prepareHeaderButtons();
                this.enableButtonClickEvents();

                ExperienceEditor.Common.addOneTimeEvent(function() {
                        return ExperienceEditor.getPageEditingWindow().Sitecore.PageModes.PageEditor;
                    },
                    function(that) {
                        ExperienceEditor.getPageEditingWindow().Sitecore.PageModes.PageEditor.save = function() {
                            that.save();
                        };
                    },
                    50,
                    this);

                if (ExperienceEditor.getPageEditingWindow().NotifcationMessages != undefined) {
                    ExperienceEditor.getPageEditingWindow().NotifcationMessages.forEach(function(entry) {
                        self.showNotification(entry.type, entry.text, true, false);
                    });
                }

                ExperienceEditor.getPageEditingWindow().onbeforeunload = ExperienceEditor.handleIsModified;
            },

            initializeRibbon: function() {
                var self = this;

                var ribbonModules = [];
                // Get defined scripts via require
                var requireJsModules = _.keys(require.s.contexts['_'].registry);
                // Filter defined and not loaded scripts
                for (var i = 0; i < requireJsModules.length; i++) {
                    var requireJsModule = requireJsModules[i];
                    if (requireJsModule.startsWith('sc_ee_bundle_') &&
                        requirejs.specified(requireJsModule) &&
                        !requirejs.defined(requireJsModule)) {
                        ribbonModules.push(requireJsModule);
                    }
                }

                // Load defined scripts
                require(ribbonModules,
                    function() {
                        var pipelineContext = ExperienceEditor.Common.cloneObject(self.currentContext);
                        ExperienceEditor.PipelinesUtil.initPipeline(self.InitializePageEditPipeline,
                            function() {
                                Sitecore.Pipelines.InitializePageEdit.execute({
                                    app: self,
                                    currentContext: pipelineContext
                                });
                                self.setHeight();
                                self.trigger("button:toggleshow", true);
                            });
                    });
            },

            save: function() {
                if (!ExperienceEditor.CommandsUtil.getCommand("Save")) {
                    return;
                }

                if (ExperienceEditor.getPageEditingWindow() &&
                    ExperienceEditor.getPageEditingWindow().document &&
                    ExperienceEditor.getPageEditingWindow().document.activeElement &&
                    ExperienceEditor.getPageEditingWindow().document.activeElement.blur) {
                    ExperienceEditor.getPageEditingWindow().document.activeElement.blur();
                }

                ExperienceEditor.CommandsUtil.executeCommand("Save", null);
            },

            // [Obsolete]
            initializeFieldsValidation: function(context) {
                console.warn("This function is obsolete and will be deleted in the next product version.");
                ExperienceEditor.PipelinesUtil.generateRequestProcessor("ExperienceEditor.ToggleRegistryKey.Get",
                    function(response) {
                        if (!response.responseValue.value) {
                            return;
                        }

                        ValidationUtil.validateFields(context);
                    },
                    { value: "/Current_User/Page Editor/Capability/FieldsValidation" }).execute(context);
            },

            //[Obsolete]
            initializeNotifications: function(context) {
                console.warn("This function is obsolete and will be deleted in the next product version.");
                var webEditMode = context.currentContext.webEditMode;
                if (webEditMode) {
                    webEditMode = webEditMode.toLowerCase();
                }

                var isPreviewMode = webEditMode === "preview";
                var isEditMode = webEditMode === "edit";
                if (!isPreviewMode && !isEditMode) {
                    return;
                }

                this.registerPageEditorNotificationHandler();
                this.NotificationBar.viewModel.$el.click(function() { this.setToggleShow(); });
                if (isEditMode) {
                    this.NotificationBar.viewModel.$el.on("click",
                        "button.close",
                        function(e) {
                            ExperienceEditor.getPageEditingWindow().Sitecore.PageModes.DesignManager.sortingEnd();
                        });
                }

                if (isPreviewMode) {
                    this.showPreviewModeNotifications(context);
                }

                if (isEditMode) {
                    this.showEditModeNotifications(context);
                }

            },

            //[Obsolete]
            showEditModeNotifications: function(context) {
                console.warn("This function is obsolete and will be deleted in the next product version.");
                ExperienceEditor.PipelinesUtil.generateRequestProcessor("ExperienceEditor.Item.Notifications",
                    function(response) {
                        var notificationTypes = ["error", "notification", "warning"];
                        var notifications = response.responseValue.value;
                        response.context.NotificationBar.removeMessages("");
                        for (var i = 0; i < notifications.length; i++) {
                            var notification = notifications[i];
                            var notificationElement = this.showNotification(notificationTypes[notification.Type],
                                notification.Description,
                                true);
                            if (notificationElement && notification.Options.length > 0) {
                                for (var j = 0; j < notification.Options.length; j++) {
                                    $(notificationElement)
                                        .append(DOMHelper.getNotificationOption(notification.Options[j].Title,
                                            notification.Options[j].Command));
                                }
                            }
                        }
                    }).execute(context);
            },

            //[Obsolete]
            showPreviewModeNotifications: function(context) {
                console.warn("This function is obsolete and will be deleted in the next product version.");
                ExperienceEditor.areItemsInFinalWorkflowState(context,
                    null,
                    function(result) {
                        if (result.notInFinalStateCount == 0) {
                            return;
                        }

                        var notificationTitle = TranslationUtil.translateTextByServer(TranslationUtil.keys
                            .This_page_contains_associated_content_that_has_not_been_approved_for_publishing_To_make_sure_the_associated_content_on_the_page_can_also_be_published_move_the_relevant_items_to_the_final_workflow_state,
                            ExperienceEditor);
                        context.NotificationBar.removeMessages("");
                        this.showNotification("notification", notificationTitle, true);
                    });
            },

            //[Obsolete]
            publishAffectedPagesNotification: function(context) {
                console.warn(
                    "Obsolete. This function is no longer supported use ShowDataSources.publishAffectedPagesNotification(context) instead");
                Sitecore.Commands.ShowDataSources.publishAffectedPagesNotification(context);
            },

            //[Obsolete]
            showPublishAffectedPagesNotification: function() {
                console.warn(
                    "Obsolete. This function is no longer supported use ShowDataSources.showPublishAffectedPagesNotification() instead");
                Sitecore.Commands.ShowDataSources.showPublishAffectedPagesNotification();
            },

            //[Obsolete]
            registerPageEditorNotificationHandler: function() {
                console.warn(
                    "Obsolete. This function is no longer supported and will be deleted in the next product version.");
                ExperienceEditor.Common.addOneTimeEvent(function() {
                        return ExperienceEditor.getPageEditingWindow().Sitecore.PageModes.PageEditor;
                    },
                    function(that) {
                        ExperienceEditor.getPageEditingWindow().Sitecore.PageModes.PageEditor.notificationBar
                            .addNotification = that.handleNotifications;
                    },
                    50,
                    this);
            },

            //[Obsolete]
            handleNotifications: function(notification) {
                console.warn(
                    "Obsolete. This function is no longer supported and will be deleted in the next product version.");
                var notificationElement = this.showNotification(notification.type, notification.text, true);
                if (!notificationElement || !notification.onActionClick || !notification.actionText) {
                    return;
                }

                var actionLink = $(notificationElement)
                    .append(DOMHelper.getNotificationOption(notification.actionText));
                $(actionLink).click(function() { notification.onActionClick(); });
            },

            showNotification: function(type, text, isClosable, clearMessages) {
                var notificationsArray = this.NotificationBar.attributes[type + "s"];
                if (notificationsArray) {
                    for (var i = 0; i < notificationsArray.length; i++) {
                        if (notificationsArray[i].text === text) {
                            return ExperienceEditor.Common.searchElementWithText(text);
                        }
                    }
                }

                if (clearMessages) {
                    this.NotificationBar.removeMessages("");
                }

                this.NotificationBar.addMessage(type,
                    {
                        text: text,
                        actions: [],
                        closable: isClosable,
                    });
                if (ExperienceEditor.Web.getUrlQueryStringValue("mode") === "edit") {
                    ExperienceEditor.getPageEditingWindow().Sitecore.PageModes.DesignManager.sortingEnd();
                }

                this.setHeight();
                return ExperienceEditor.Common.searchElementWithText(text);
            },

            //[Obsolete]
            initializeExperienceEditorObject: function(context) {
                // Execute hooks
                var hooks = Sitecore.ExperienceEditor.Hooks || [];
                if (hooks.length > 0) {
                    console.warn(
                        "Sitecore.ExperienceEditor.Hooks is no longer supported, please register your own client processor (under core/sitecore/client/Applications/ExperienceEditor/Pipelines/InitializePageEdit pipeline) instead");
                }

                $.each(hooks,
                    function() {
                        this.execute(context);
                    });
            },

            setToggleShow: function() {

                ExperienceEditor.Common.addOneTimeEvent(function(that) {
                        ExperienceEditorContext.isFrameLoaded =
                            window.frameElement.contentWindow.document.readyState === "complete";
                        var ribbonHeight = that.ScopedEl.height();
                        return ExperienceEditorContext.isRibbonRendered &&
                            ExperienceEditorContext.isFrameLoaded &&
                            ribbonHeight > 0 &&
                            ribbonHeight < 500;
                    },
                    function(that) {
                        that.setHeight(that.ScopedEl.height());
                    },
                    50,
                    this);

                if (!this.QuickRibbon || this.QuickRibbon.viewModel.$el.attr("style")) {
                    return;
                }

                this.QuickRibbon.viewModel.$el.attr("style", "float:right");
                this.QuickRibbon.viewModel.$el.find("div")
                    .attr("class", "sprite-speak-ribbon-clean-ee small navigate_down");

                this.on("button:toggleshow",
                    function(denyCollapse) {
                        this.toggleCollapse(denyCollapse);
                        //if ribbon was shown or hidden by button:toggleshow make focused = false
                        this.focused = false;
                    },
                    this);

                //register for click on document body - to hide focused ribbon
                var self = this;
                ExperienceEditor.getPageEditingWindow().document.body.addEventListener("click",
                    function(sender) {
                        self.setFocused(false);
                    },
                    false);
            },

            toggleCollapse: function(denyCollapse, ignoreCookies) {
                if (denyCollapse != true) {
                    this.shown = !this.shown;
                }

                if (this.shown) {
                    this.QuickRibbon.viewModel.$el.find("div")
                        .attr("class", "sprite-speak-ribbon-clean-ee small navigate_up");
                    this.Ribbon.viewModel.$el.show();
                    this.setHeight(this.ScopedEl.height());
                } else {
                    this.QuickRibbon.viewModel.$el.find("div")
                        .attr("class", "sprite-speak-ribbon-clean-ee small navigate_down");
                    this.Ribbon.viewModel.$el.hide();
                    this.setHeight(this.ScopedEl.height());
                }

                if (denyCollapse == true) {
                    return;
                }

                if (!ignoreCookies) {
                    ExperienceEditor.Common.setCookie("sitecore_webedit_ribbon", this.shown ? "1" : "0");
                }

                if (!this.shown) {
                    return;
                }

                this.executeCachedCommands();
            },

            executeCachedCommands: function() {
                var activeTabId = ExperienceEditor.getCurrentTabId();
                if (this.cachedCommands) {
                    ExperienceEditor.CommandsUtil.runCommandsCollectionCanExecute(this.cachedCommands,
                        function(stripId) {
                            return stripId && stripId + "_ribbon_tab" !== activeTabId;
                        },
                        true);
                }
            },

            setFocused: function(focused) {
                //make ribbon focused, only if it's shown right now
                if (focused) {
                    if (!this.shown) {
                        this.focused = true;
                        this.toggleCollapse(false, true);
                    }
                } else {
                    //hide ribbon by defocusing, only when it's focused (because it can be shown by button:toggleshow: and !focused)
                    if (this.focused) {
                        this.focused = false;
                        this.toggleCollapse(false, true);
                    }
                }
            },


            setHeight: function(height) {
                DOMHelper.setRibbonHeight(height, this);
            },

            //[Obsolete]
            findId: function(target) {
                console.warn("Obsolete. This method is no longer supported use  DOMHelper.findId(target) instead");
                return DOMHelper.findId(target);
            },

            canExecute: function(commandQuery, commandContext, asyncHandler) {
                var result = false;
                var that = this;

                ExperienceEditor.Web.postServerRequest(commandQuery,
                    commandContext,
                    function(response) {
                        if (!response.isUserTokenValid) {
                            ExperienceEditor.reloadPageEditingWindow();
                            return;
                        }
                        if (!response.errorMessage) {
                            result = response.value || response.responseValue.value;
                        } else {
                            that.handleResponseErrorMessage(response);
                        }
                        if (asyncHandler) {
                            asyncHandler(result);
                        }
                    },
                    asyncHandler);

                return result;
            },

            //[Obsolete]
            postServerRequest: function(requestType, commandContext, handler, async) {
                console.warn(
                    "Obsolete. This method is no longer supported use   ExperienceEditor.Web.postServerRequest(requestType, commandContext, handler, async) instead");
                ExperienceEditor.Web.postServerRequest(requestType, commandContext, handler, async);
            },

            handleResponseErrorMessage: function(responseData, decodeMessage) {
                var errorMessage = TranslationUtil.translateText(TranslationUtil.keys.An_error_occured);
                var message = responseData.errorMessage !== undefined && responseData.errorMessage !== ""
                    ? responseData.errorMessage
                    : errorMessage;
                var element = this.showNotification("error", message, true, true);
                if (element && decodeMessage) {
                    element.innerHTML = message;
                }

                var postScriptFunc = responseData.postScriptFunc;
                if (postScriptFunc) {
                    try {
                        eval(postScriptFunc);
                    } catch (error) {
                        console.warn("An '" + error + "' error occured during executing: \n" + postScriptFunc);
                    }
                }

                return element;
            },

            //[Obsolete]
            refreshOnItem: function(context, allowParameterRedirection, keepVersion, keepSite) {
                console.warn(
                    "Obsolete. This method is no longer supported use ExperienceEditor.CommandsUtil.executeButtonCommand(button) instead");
                ExperienceEditor.refreshOnItem(context, allowParameterRedirection, keepVersion, keepSite);
            },

            enableButtonClickEvents: function() {
                this.on("button:click",
                    function(event) {
                        var button = DOMHelper.getButton(event.sender.el, this);
                        top.initModalDialog(function() {
                            ExperienceEditor.CommandsUtil.executeCommandFromButton(button);
                        });
                    },
                    this);
                this.on("button:pressed",
                    function(event) {
                        var button = DOMHelper.getButton(event.sender.el, this);
                        DOMHelper.setButtonPressed(button, this);
                    },
                    this);
                this.on("button:check",
                    function(event) {
                        var button = DOMHelper.getButton(event.sender.el, this);
                        button.set({ isChecked: !button.get("isChecked") });
                        ExperienceEditor.CommandsUtil.executeCommandFromButton(button);
                    },
                    this);
            },

            //[Obsolete]
            getPageCodeScriptFileUrl: function(button) {
                console.warn("This method is obsolete and will be removed in the next product version.");
                return button.viewModel.$el.attr('data-sc-PageCodeScriptFileName');
            },

            disableButtonClickEvents: function() {
                this.off("button:click");
                this.off("button:check");
            },

            //[Obsolete]
            clone: function(obj) {
                console.warn(
                    "This method is obsolete and will be removed in the next product version, please use ExperienceEditor.Common.cloneObject instead.");
                return ExperienceEditor.Common.cloneObject(obj);
            },

            //[Obsolete]
            getButton: function(eventTarget) {
                console.warn(
                    "Obsolete. This method is no longer supported use DOMHelper.getButton(eventTarget) instead");
                return DOMHelper.getButton(eventTarget, this);
            },

            //[Obsolete]
            setButtonPressed: function(button) {
                console.warn(
                    "Obsolete. This method is no longer supported use DOMHelper.setButtonPressed(button) instead");
                DOMHelper.setButtonPressed(button, this);
            },

            //[Obsolete]
            executeButtonCommand: function(button) {
                console.warn(
                    "Obsolete. This method is no longer supported use ExperienceEditor.CommandsUtil.executeButtonCommand(button) instead");
                ExperienceEditor.CommandsUtil.executeButtonCommand(button);
            },

            //[Obsolete]
            executeCommand: function(commandName, commandArgument, button) {
                console.log(
                    "Obsolete. This method is no longer supported use ExperienceEditor.CommandsUtil.executeCommand(commandName, commandArgument, button) instead");
                ExperienceEditor.CommandsUtil.executeCommand(commandName, commandArgument, button);
            },

            //[Obsolete]
            getCommand: function(commandName) {
                console.warn(
                    "Obsolete. This method is no longer supported use ExperienceEditor.CommandsUtil.getCommand(commandName) instead");
                return ExperienceEditor.CommandsUtil.getCommand(commandName);
            },

            //[Obsolete]
            formCommandName: function(commandName) {
                console.warn(
                    "Obsolete. This method is no longer supported use ExperienceEditor.CommandsUtil.formCommandName(commandName) instead");
                return ExperienceEditor.CommandsUtil.formCommandName(commandName);
            },

            //[Obsolete]
            getContext: function(button) {
                console.warn(
                    "Obsolete. This method is no longer supported use ExperienceEditor.RibbonApp.getAppContext(button) instead");
                return ExperienceEditor.RibbonApp.getAppContext(button);
            }
        });

        return RibbonPageCode;
    });