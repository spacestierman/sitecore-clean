(function (speak) {
    speak.pageCode([], function () {
        var defaults = {
            proceedText: "",
            warningTextCssClassList: ""
        }
        return {
            initialized: function () {
                this.on({
                    "deleteforms:Submit": this.submit,
                    "deleteforms:Cancel": this.cancel
                }, this);

                defaults.proceedText = this.DeleteFormsProceedText.Text;
                defaults.abortText = this.DeleteFormsAbortText.Text;
            },

            show: function (options) {
                if (!options || !Array.isArray(options.items) || !options.items.length) {
                    return;
                }

                this.allocateItems(options.items, options.itemsStatus);

                this.DeleteFormsWarningsListControl.reset(this.warningItems);

                this.updateControlsState();

                this.DeleteFormsDialogWindow.show();
            },

            hide: function () {
                this.DeleteFormsDialogWindow.hide();
            },

            allocateItems: function (items, itemsStatus) {
                this.warningItems = [];
                this.notificationItems = [];

                items.forEach(this.allocateItem.bind(this, itemsStatus));
            },

            allocateItem: function (itemsStatus, item) {
                var statusText = itemsStatus[item.$itemId];
                switch (statusText) {
                    case "candelete":
                        this.notificationItems.push(item);
                        break;

                    case "deleted":
                        break;

                    case "noaccess":
                        item.$statusMessage = this.NoAccessWarningText.Text;
                        this.warningItems.push((item));
                        break;

                    case "locked":
                        item.$statusMessage = this.LockedWarningText.Text;
                        this.warningItems.push(item);
                        break;

                    case "inuse":
                        item.$statusMessage = this.InUseWarningText.Text;
                        this.warningItems.push(item);
                        break;

                    default:
                        if (statusText && statusText.trim()) {
                            item.$statusMessage = statusText;
                            this.warningItems.push((item));
                        }
                        break;
                }
            },

            updateControlsState: function () {
                var hasDeletableForms = this.notificationItems.length > 0;
                var isSingleFormWarning = this.warningItems.length === 1;

                this.DeleteFormsProceedText.Text = speak.Helpers.string.format(
                    defaults.proceedText,
                    this.notificationItems.length,
                    this.notificationItems.length + this.warningItems.length);

                this.DeleteFormsProceedText.IsVisible = hasDeletableForms;
                this.DeleteFormsAbortText.IsVisible = !hasDeletableForms;
                this.DeleteFormsAbortText.Text = isSingleFormWarning ? this.DeleteSingleFormWarningText.Text : defaults.abortText;
                
                this.DeleteSingleFormWarningText.IsVisible = hasDeletableForms && isSingleFormWarning;
                this.DeleteFormsWarningText.IsVisible = hasDeletableForms && !isSingleFormWarning;

                this.DeleteFormsOKButton.IsVisible = hasDeletableForms;
                this.DeleteFormsCancelButton.IsVisible = hasDeletableForms;
                this.DeleteFormsCloseButton.IsVisible = !hasDeletableForms;
            },

            submit: function () {
                this.trigger("deleteforms:ProceedDelete", this.notificationItems);
                this.hide();
            },

            cancel: function () {
                this.hide();
            }
        };
    }, "DeleteFormsSubAppRenderer");
})(Sitecore.Speak);