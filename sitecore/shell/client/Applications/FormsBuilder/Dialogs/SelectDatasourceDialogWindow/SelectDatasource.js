(function (speak) {
    speak.pageCode([], function () {
        return {
            initialized: function () {
                this.on({
                    "selectdatasource:Submit": this.submit,
                    "selectdatasource:Cancel": this.cancel
                }, this);
            },

            show: function (currentSelectionId) {
                this.SelectDatasourceItemTreeView.SelectedItemId = currentSelectionId;
                this.SelectDatasourceDialogWindow.show();
            },

            hide: function () {
                this.SelectDatasourceDialogWindow.hide();
            },

            submit: function () {
                this.trigger("selectdatasource:ItemSelected", this.SelectDatasourceItemTreeView.SelectedItemId);
                this.hide();
            },

            cancel: function () {
                this.hide();
            }
        };
    }, "SelectDatasourceSubAppRenderer");
})(Sitecore.Speak);