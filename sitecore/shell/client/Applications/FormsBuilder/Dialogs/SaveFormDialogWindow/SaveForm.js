(function (speak) {
    speak.pageCode([], function () {
        var defaultOptions = {
            headerText: ""
        };

        return {
            initialized: function () {
                this.on({
                    "saveform:Submit": this.submit,
                    "saveform:Cancel": this.cancel
                }, this);

                this.SaveFormDialogWindow.FocusOn = "[data-sc-id='NameTextBox']";

                this.SaveFormDialogWindow.viewModel.$el().on('hidden', _.bind(this.cleanUp, this));
                this.SaveFormDialogWindow.viewModel.$el().on('shown', _.bind(this.focusInput, this, this.SaveFormNameForm.NameTextBox.el));

                this.trackChanges();

                defaultOptions.headerText = this.SaveFormDialogWindow.HeaderText;
            },

            show: function (itemName, dialogHeaderText) {
                this.SaveFormNameForm.FormData.NameTextBox = itemName;
                this.SaveFormOKButton.IsEnabled = this.valueIsValid();

                this.setDialogTitle(dialogHeaderText);

                this.SaveFormDialogWindow.show();
            },

            hide: function () {
                this.SaveFormDialogWindow.hide();
            },

            actionCompleted: function (options) {
                this.updateControlsState(false);

                if (options.success === true) {
                    this.hide();
                    return;
                }

                if (options.message && options.message.length > 0) {
                    this.SaveFormMessageBar.add({ Type: "error", Text: options.message });
                }
            },

            submit: function () {
                // todo check valid name, save
                var formName = this.SaveFormNameForm.NameTextBox.el.value;

                this.SaveFormMessageBar.reset();
                this.updateControlsState(true);

                this.trigger("saveform:NameChanged", formName);
            },

            cancel: function () {

                this.hide();
            },

            setDialogTitle: function (titleText) {
                this.SaveFormDialogWindow.HeaderText = titleText || defaultOptions.headerText;

                var titleEl = this.SaveFormDialogWindow.$el.find('.sc-dialogWindow-header-title');
                if (titleEl.length) {
                    titleEl.text(this.SaveFormDialogWindow.HeaderText);
                }
            },

            trackChanges: function () {
                var textboxEl = $(this.SaveFormNameForm.NameTextBox.el);
                textboxEl.on("cut input paste keyup", _.bind(function (event) {
                    this.updateSaveButtonState(event);
                }, this));
            },

            valueIsValid: function () {
                var nameValue = this.SaveFormNameForm.NameTextBox.el.value;

                var isEnabled = nameValue.length > 0;
                return isEnabled;
            },

            updateSaveButtonState: function (event) {
                var isEnabled = this.valueIsValid();
                this.SaveFormOKButton.IsEnabled = isEnabled;

                if (event && event.keyCode === 13 && isEnabled) {
                    this.SaveFormOKButton.el.click();
                }
            },

            updateControlsState: function (isActionInProgress) {
                this.SaveProgressIndicatorPanel.IsBusy = isActionInProgress;
                this.SaveFormOKButton.IsEnabled = !isActionInProgress && this.valueIsValid();

                this.SaveFormCancelButton.IsEnabled = !isActionInProgress;
            },

            cleanUp: function () {
                this.SaveFormNameForm.FormData.NameTextBox = "";
                this.SaveFormMessageBar.reset();
                this.updateControlsState(false);
            },

            focusInput: function (el) {
                el.focus();

                if (el.setSelectionRange) {
                    el.setSelectionRange(el.value.length, el.value.length);
                }
                else {
                    var value = el.value;
                    $(el).val('').val(value);
                }
            }
        };
    }, "SaveFormSubAppRenderer");
})(Sitecore.Speak);