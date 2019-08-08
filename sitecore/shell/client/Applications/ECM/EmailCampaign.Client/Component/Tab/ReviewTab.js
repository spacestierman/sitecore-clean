define([
    "sitecore",
    "/-/speak/v1/ecm/ServerRequest.js",
    "/-/speak/v1/ecm/constants.js",
    "/-/speak/v1/ecm/MessageValidationService.js",
    "/-/speak/v1/ecm/Validation.js"
], function(
    sitecore,
    ServerRequest,
    Constants,
    MessageValidationService,
    Validation
) {
    function initVariantsSelectors(sitecore, contextApp) {
        // update on change in messageContext
        sitecore.on("change:messageContext", function() {
            var variants = $.map(contextApp.MessageContext.get("variants"), function(m, v) {
                return v;
            });
            contextApp.SendQuickTestVariantsSelector.viewModel.showVariants(variants);

            if (variants.length > 1) {
                $('div[data-sc-id="SendQuickTestButtonsToTheLeft"]').removeClass("col-md-8").addClass("col-md-6");
            }
            var selectedVariantsSendQuickTest = contextApp.SendQuickTestVariantsSelector.viewModel.getSelectedVariants();

            contextApp.SendQuickTestVariantsPresenter.viewModel.showVariants(selectedVariantsSendQuickTest);
        });

        // bind to change in variants in order to display them
        contextApp.SendQuickTestVariantsSelector.on("change:variants", function() {
            contextApp.SendQuickTestVariantsPresenter.viewModel.showVariants(contextApp.SendQuickTestVariantsSelector.viewModel.getSelectedVariants());
        });
    }

    function initQuickTestEmail(contextApp) {
        var emailTextBox = contextApp.SendQuickTestEmailTextBox,
            button = contextApp.SendQuickTestButton;

        button.set('isEnabled', !!$.trim(emailTextBox.get('text')));
        emailTextBox.on('change:text', function() {
            button.set('isEnabled', !!$.trim(emailTextBox.get('text')));
        });

        /*
         * The correct way is to listen only on "change:text" event of SPEAK input component
         *  but it appears only after input will loose a focus and this is not suitable for current situation
         *  that is why on("cut input paste keydown") events are also used here.
         */
        emailTextBox.viewModel.$el.on('cut input paste keydown', function() {
            button.set('isEnabled', !!$.trim(emailTextBox.viewModel.$el.val()));
        });

        contextApp.TabControl.on('change:selectedTab', function() {
            contextApp.SendQuickTestEmailTextBox.viewModel.focus();
        });

        contextApp.QuickTestValidation = Validation.create({
            id: 'SendQuickTest',
            highlightInput: false,
            inputs: [
                {
                    input: contextApp.SendQuickTestVariantsSelector,
                    validators: {
                        variantSelected: {
                            method: _.bind(function () {
                                if (contextApp.MessageContext.get('variants').length > 1) {
                                    return !!contextApp.SendQuickTestVariantsSelector.viewModel.getSelectedVariants().length;
                                } else {
                                    return true;
                                }
                            }),
                            message: sitecore.Resources.Dictionary.translate('ECM.Message.PleaseChooseVariantForTesting')
                        }
                    },
                    validateEvent: 'change:variants'
                }
            ]
        })
        .on({
            'validation:input:error': function (message) {
                contextApp.MessageBar.removeMessage(function (mess) {
                    return mess.id ? mess.id === message.id : false;
                });
                contextApp.MessageBar.addMessage("error", _.extend({ actions: [], closable: true }, message));
            },
            'validation:input:success': function (message) {
                contextApp.MessageBar.removeMessage(function (mess) {
                    return mess.id ? mess.id.indexOf(message.id) > -1 : false;
                });
            },
            'change:valid': function () {
                contextApp.SendQuickTestButton.set('isEnabled', contextApp.QuickTestValidation.get('valid'));
            }
        }, this);
    }

    function autoSaveCampaign() {
        var args = { Verified: false, Saved: false };
        sitecore.trigger("message:save", args);
        if (!args.Verified || !args.Saved) {
            $('html, body').animate({ scrollTop: contextApp.MessageBar.viewModel.$el.position().top }, 300, "linear");
            return;
        }
    }

    return {
        initReviewTab: function(contextApp, messageContext, messageBar) {
            if (!contextApp || !messageContext || !messageBar) {
                return;
            }

            initVariantsSelectors(sitecore, contextApp);

            contextApp.on("action:sendquicktest", function () {
                if (
                    !MessageValidationService.validateMessageVariantsSubject(this.MessageContext.get("variants")) ||
                    !this.QuickTestValidation.validateAll()) {
                    return;
                }

                autoSaveCampaign();

                contextApp.SendQuickTestButton.viewModel.disable();
                contextApp.SendQuickTestBusyImage.viewModel.show();

                var selectedVariantIds = [];
                var variants = messageContext.get("variants");
                $.each(contextApp.SendQuickTestVariantsSelector.viewModel.getSelectedVariants(), function(k, v) {
                    selectedVariantIds.push(variants[v].id);
                });

                // only one variant exists, select it
                if (selectedVariantIds.length === 0 && variants.length === 1) {
                    selectedVariantIds.push(variants[0].id);
                }

                setTimeout(function() {
                    contextApp.currentContext = {
                        messageId: messageContext.get("messageId"),
                        variantIds: selectedVariantIds,
                        language: messageContext.get("language"),
                        messageBar: messageBar,
                        messageContext: messageContext,
                        testEmails: contextApp.SendQuickTestEmailTextBox.viewModel.text()
                    };
                    var context = _.clone(contextApp.currentContext);
                    sitecore.Pipelines.SendQuickTest.execute({ app: contextApp, currentContext: context });
                    contextApp.SendQuickTestButton.viewModel.enable();
                    contextApp.SendQuickTestBusyImage.viewModel.hide();
                }, 100);

            }, contextApp);

            function setSelectedVariants(report, variantSelector) {
                if (!report) {
                    return;
                }
                var variants = contextApp.MessageContext.get("variants");
                var selectedVariants = [];
                for (var i = 0; i < variants.length; i++) {
                    for (var ii = 0; ii < report.variantIds.length; ii++) {
                        if (variants[i].id === report.variantIds[ii]) {
                            selectedVariants.push(i);
                        }
                    }
                }
                if (variantSelector.viewModel.isDisabled) {
                    variantSelector.viewModel.enable();
                }
                variantSelector.viewModel.setSelectedVariants(selectedVariants, true);
            }

            sitecore.on("change:messageContext", function() {
                // hide the variants if there is only one
                var sendQuickTestVariantsColumn = $("div[data-sc-id='SendQuickTestVariantsColumn']");

                if (messageContext.get("variants").length < 2) {
                    sendQuickTestVariantsColumn.hide();
                } else {
                    sendQuickTestVariantsColumn.show();
                }

	            contextApp.SendQuickTestButton.set('isEnabled', !messageContext.get("isReadOnly"));
            });

            initQuickTestEmail(contextApp);
        }
    }

});