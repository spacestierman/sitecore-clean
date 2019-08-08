(function (speak) {

    speak.pageCode(["/-/speak/v1/formsbuilder/assets/formeditorutils.js"], function (formEditorUtils) {
        var defaultOptions = {
            immutableFieldProperties: ["itemId"]
        },
        mediaLibraryItemId = "{3D6658D8-A0BF-4E75-B3E2-D050FABCF4E1}",
        selectImageBaseUrl = "/sitecore/client/Applications/Dialogs/SelectMediaDialog";

        return {
            initialize: function () {
                this.defineProperty("ContextItem", null);

                this.on({
                    "change:ContextItem": this.initProperties,
                    "imageselector:Select": this.selectImage,
                    "formproperties:ApplyChanges": this.applyChanges,
                    "formproperties:Cancel": this.cancelChanges
                }, this);


                this.parent.parent.ApplyChangesButton.IsEnabled = false;

                if (window.top.dialogClose === undefined) {
                    window.top.dialogClose = function (value) {
                        speak.trigger("sc-frame-message", value);
                    }
                }
                speak.on("sc-frame-message", this.selectImageSelected, this);
            },

            initialized: function () {
                this.SettingsForm.children.forEach(function (child) {
                    if (child.deps && child.deps.indexOf("bclSelection") !== -1) {
                        child.IsSelectionRequired = false;
                    }
                });

                this.initialFormData = formEditorUtils.getFormData(this.SettingsForm);
                this.options = $.extend(true, {}, defaultOptions);
            },

            initProperties: function () {
                var hasContextItem = speak.utils.is.a.object(this.ContextItem) && speak.utils.is.a.object(this.ContextItem.model);

                this.parent.parent.ApplyChangesButton.IsEnabled = hasContextItem;

                if (!hasContextItem) {
                    // todo
                    return;
                }

                this.options = $.extend(true, {}, defaultOptions);

                var bindingTarget = formEditorUtils.getFormBindingTarget(this.initialFormData, this.ContextItem.model);
                this.SettingsForm.BindingTarget = bindingTarget;
                this.SettingsForm.setErrors({});
            },
            
            getItemUri: function (itemId) {
                return "sitecore://" + speak.Context.current().contentDatabase + "/" + itemId + "?lang=" + this.ContextItem.currentLanguage + "&ver=";
            },

            selectImage: function (args) {
                this.imageSelectorControl = args.sender;

                this.parent.parent.SelectMediaDialogWindow.show();
                this.parent.parent.SelectMediaDialogFrame.SourceUrl = speak.Helpers.url.addQueryParameters(selectImageBaseUrl,
                {
                    "ro": this.getItemUri(mediaLibraryItemId),
                    "fo": this.getItemUri(this.imageSelectorControl.ImageGuid)
                });
            },

            selectImageSelected: function (value) {
                var modal = this.parent.parent.SelectMediaDialogWindow.$el.data("modal");
                if (modal && modal.isShown) {
                    if (value) {
                        this.imageSelectorControl.ImageGuid = value;
                    }
                    this.parent.parent.SelectMediaDialogWindow.hide();
                }
            },

            applyChanges: function () {
                var flatFormData = formEditorUtils.getFormData(this.SettingsForm);

                var errors = formEditorUtils.getFormErrors(this.SettingsForm, flatFormData, this.RequiredFieldErrorText.Text);
                if (errors) {
                    this.SettingsForm.setErrors(errors);
                    return;
                }

                formEditorUtils.updateProperties(this.ContextItem.model, flatFormData, this.options.immutableFieldProperties);

                speak.trigger("formPropertyGrid:Apply", this.ContextItem);
            },

            cancelChanges: function () {
                this.initProperties();
            }
        };
    }, "FormSettingsPropertyGrid");
})(Sitecore.Speak);
