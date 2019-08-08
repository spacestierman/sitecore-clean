(function (speak) {
    speak.pageCode([], function () {
        return {
            initialized: function () {
                this.on({
                    "editaction:Submit": this.submit,
                    "editaction:Cancel": this.cancel
                }, this);
            },

            show: function (sourceUrl, actionDefinition, callbackFn) {
                if (actionDefinition) {
                    this.actionDefinition = actionDefinition;
                    this.callbackFn = callbackFn;
                    this.setDialogTitles();
                    this.EditActionOKButton.IsEnabled = false;
                    this.EditActionDialogWindow.show();
                    this.EditActionFrame.SourceUrl = sourceUrl;
                }
            },

            loadDone: function (subApp, headerTitle, headerSubtitle) {
                this.EditActionDialogContent = subApp;
                this.setDialogTitles(headerTitle, headerSubtitle);

                var parameters = this.actionDefinition.parameters;
                if (typeof (this.actionDefinition.parameters) == "string") {
                    try {
                        parameters = JSON.parse(this.actionDefinition.parameters);
                    } catch (e) {
                        parameters = {}
                    }
                }
                this.EditActionDialogContent.trigger("loaded", parameters);
            },

            setSelectability: function (subApp, isSelectable, selectedItemId) {
                this.EditActionOKButton.IsEnabled = isSelectable;
            },

            hide: function () {
                this.EditActionDialogWindow.hide();
            },

            submit: function () {
                if (this.EditActionDialogContent) {
                    var data = this.EditActionDialogContent.getData();
                    this.actionDefinition.parameters = JSON.stringify(data);
                    this.callbackFn(this.actionDefinition);
                }
                this.hide();
            },

            cancel: function () {
                this.hide();
            },

            setDialogTitles: function (titleText, subtitleText) {
                this.EditActionDialogWindow.HeaderText = titleText || "";
                this.EditActionDialogWindow.HeaderSubtext = subtitleText || "";
            }
        };
    }, "EditActionSubAppRenderer");
})(Sitecore.Speak);