define(["sitecore", "/-/speak/v1/listmanager/commonPagesDefinition.js"],
    function (sitecore, commonPagesDefinition) {
        var self;

        return sitecore.Definitions.App.extend({
            initialized: function () {
                self = this;
                this.on("app:loaded",
                    function () {
                        sitecore.trigger("dialog:loaded", self);
                    });

                this.on("lm:dialog:confirmation:ok:clicked", this.onOkClicked);
                this.on("lm:dialog:confirmation:cancel:clicked", this.onCancelClicked);
            },
            showDialog: function (parameters) {
                this.success = parameters.success;
                this.cancel = parameters.cancel;
                this.entityId = parameters.entityId;

                if (parameters.cancelButtonText != undefined) {
                    self.ConfirmationDialogCancelButton.set("text", parameters.cancelButtonText);
                }
                if (parameters.okButtonText != undefined) {
                    self.ConfirmationDialogOkButton.set("text", parameters.okButtonText);
                }

                self.ConfirmationDialogText.set("text", parameters.message);
                self.ConfirmationDialog.show();
            },
            onCancelClicked: function () {
                if (this.cancel != undefined) {
                    this.cancel();
                }
                this.hideDialog();
            },
            hideDialog: function () {
                this.ConfirmationDialog.hide();
            },
            onOkClicked: function () {
                this.success();
                this.hideDialog();
            }
        });
    });