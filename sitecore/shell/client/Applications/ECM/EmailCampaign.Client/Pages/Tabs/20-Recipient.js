define([
    'sitecore',
    '/-/speak/v1/ecm/ServerRequest.js',
    '/-/speak/v1/ecm/constants.js',
    '/-/speak/v1/ecm/MessageValidationService.js',
    '/-/speak/v1/ecm/GlobalValidationService.js'
],
function (sitecore, ServerRequest, Constants, MessageValidationService, GlobalValidationService) {
    var recipientTab = sitecore.Definitions.App.extend({
        initialized: function() {
            sitecore.trigger("mainApp", this);
            this.showPopover();
            this.attachEventHandlers();
            MessageValidationService.includedList = this.IncludeRecipientListSelectorListControl;
            this.updateRecipientListStatus();
            this.setFocusOrderOnRecipientListSelector();
            this.setFocusIncludedListSelector();
        },

        updateRecipientListStatus: function () {
            this.IncludeRecipientListSelector.set('isEnabled', !this.MessageContext.get('isReadOnly'));
            this.ExcludeRecipientListSelector.set('isEnabled', !this.MessageContext.get('isReadOnly'));
        },

        attachEventHandlers: function() {
            this.IncludeRecipientListSelectorListControl.on('change:items', function() {
                MessageValidationService.validateRecipients();
            }, this);

            GlobalValidationService.on({
                    'validation:input:success': function(options) {
                        if (options.id === 'includedRecipientsRequired') {
                            this.IncludeRecipientListSelectorAdvancedComboBox.viewModel.$el.removeClass('has-error');
                        }
                    },
                    'validation:input:error': function(options) {
                        if (options.id === 'includedRecipientsRequired') {
                            this.IncludeRecipientListSelectorAdvancedComboBox.viewModel.$el.addClass('has-error');
                        }
                    }
                },
                this);
            this.MessageContext.on('change:isReadOnly', this.updateRecipientListStatus, this);
            this.MessageTabs.on('change:selectedTab',
                function () {
                    var recipientTabId = '{DEC97E19-EED3-43D4-858E-36DD5DC63BCB}';
                    if (this.MessageTabs.get('selectedTab') === recipientTabId) {
                        this.setFocusIncludedListSelector();
                    }
                }, this);
        },

        showPopover: function() {
            if (this.isFirstTimeUser()) {
                var targetControlName = this.FirstTimeUserPopover.get('targetControl'),
                    targetControlEl = this[targetControlName].viewModel.$el,
                    showPopover = setInterval(_.bind(function() {
                        // Prevent showing Popover in case if user swithed to another tab and didn't wait it.
                        if (targetControlEl.is(':visible')) {
                            targetControlEl.popover('show');
                            clearInterval(showPopover);
                        }
                    }, this), 2000);
            }
        },

        stopShowHint: function() {
            var targetControl = this.FirstTimeUserPopover.get('targetControl');

            this[targetControl].viewModel.$el.popover('hide');
            window.localStorage.setItem('stopShowHint', true);
        },

        isFirstTimeUser: function() {
            return !window.localStorage.getItem('stopShowHint');
        },

        setFocusOrderOnRecipientListSelector: function() {
            this.IncludeRecipientListSelectorAdvancedComboBox.viewModel.$el.find('.select2-focusser').attr('tabindex', 1);
            this.ExcludeRecipientListSelectorAdvancedComboBox.viewModel.$el.find('.select2-focusser').attr('tabindex', 2);
        },

        /*
         * Need to add small delay, when elements will be rendered, only then set focus.
         *  Because focus will not work if elemen is hidden.
         */
        setFocusIncludedListSelector: _.debounce(function() {
            this.IncludeRecipientListSelectorAdvancedComboBox.viewModel.$el.find('.select2-focusser').trigger('focus');
        }, 50)
    });

    return recipientTab;
});