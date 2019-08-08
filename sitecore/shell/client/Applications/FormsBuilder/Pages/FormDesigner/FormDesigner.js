(function(speak) {
    speak.pageCode([],
        function() {
            var formsPageAppUrl = "/Applications/FormsBuilder/Pages/Forms",
                referrerUrl,
                settingsTabGuid = "{BFDB6A60-43FA-408F-A373-2564F57A51F4}",
                performanceTabGuid = "{68B38865-A723-4631-9BFA-432F17CC2F79}",
                deleteConfirmationMessage = "",
                messageTypes = {
                    loadForm: "LoadForm",
                    renderField: "RenderField",
                    reloadField: "ReloadField"
                },
                delayedActionCallback;

            var debouncedLoadForm = _.debounce(function(language) {
                if (this.FormDesignBoard) {
                    this.FormDesignBoard.loadForm(language);
                }
            }, 10);

            return {
                initialized: function() {
                    this.SelectedItem = null;
                    referrerUrl = document.referrer;

                    this.on({
                            "form:BackButtonClick": this.goBack,
                            "form:SaveAs": this.saveFormAs,
                            "form:SaveAsTemplateOrForm": this.saveFormAsTemplateOrForm,
                            "form:Save": this.saveForm,
                            "form:Preview": this.previewForm,
                            "form:Delete": this.deleteClick,
                            "DeleteConfirmationDialog:ButtonClick": this.confirmDeleteClicked,
                            "form:Share": this.shareForm,
                            "form:Reports": this.reportForm,
                            "form:EditConditions": this.editConditions
                        },
                        this);

                    deleteConfirmationMessage = this.DeleteConfirmationDialog.Message;

                    window.addEventListener("beforeunload", this.onBeforeUnload.bind(this));
                    $(this.AccountInformation.el)
                        .find("a")
                        .on("click",
                            function() {
                                this.skipChangeCheck = true;
                            }.bind(this));

                    this.FormDesignBoard.on({
                            "change:SelectedItem": this.selectedItemChanged,
                            "change:FormModel": this.formModelChanged,
                            "loadFormCompleted": this.loadFormCompleted,
                            "loadFormError": this.showErrorMessage.bind(this, messageTypes.loadForm),
                            "renderFieldError": this.showErrorMessage.bind(this, messageTypes.renderField),
                            "reloadFieldError": this.showErrorMessage.bind(this, messageTypes.reloadField),
                            "reloadFieldSuccess": this.reloadFieldSuccess,
                            "selectElement": this.selectElement
                        },
                        this);

                    this.FormDesignBoard.$el.on("keydown", this.trackDeleteClick.bind(this));

                    this.FormDesignBoard.loadForm();

                    this.LanguageListControl.on("BeforeSelectedItem", this.selectLanguageBeforeChanged, this);
                    this.LanguageListControl.on("change:SelectedValue", this.selectedLanguageChanged, this);
                    this.LanguageDropDownButton.on("change:IsOpen", this.languageDropDownIsOpenChanged, this);

                    this.InfoTabControl.on({
                            "loaded:Settings": function() {
                                this.SettingsApp.FormSettingsPropertyGrid.ContextItem = this.FormDesignBoard.FormModel;
                            },
                            "loaded:Performance": function() {
                                this.PerformanceApp.FormPerformance
                                    .FormId = this.FormDesignBoard.FormModel
                                    ? this.FormDesignBoard.FormModel.itemId
                                    : "";
                                this.updatePerformanceAppIsActive();
                            },
                            "change:SelectedValue": this.tabsSwitched
                        },
                        this);
                    this.tabsSwitched();
                    this.ContextToggle.on("change:IsOpen", this.updatePerformanceAppIsActive, this);
                    this.ContextForInfoTab.on("change:IsVisible", this.updatePerformanceAppIsActive, this);

                    this.SaveFormSubAppRenderer.on("saveform:NameChanged", this.saveFormNameChanged, this);

                    speak.on({
                            "propertyGrid:Close": this.closePropertyGrid
                        },
                        this);

                    var dropdownEl = this.ActionControl.el.querySelector('.dropdown-menu');
                    dropdownEl.classList.toggle("sc-placement-top", true);
                },

                onBeforeUnload: function(event) {
                    if (!this.skipChangeCheck && (this.FormDesignBoard.HasChanged || this.PropertyGrid.hasChanged())) {
                        event.returnValue = this.UnsavedChangesMessage.Text;
                        return this.UnsavedChangesMessage.Text;
                    }
                    this.skipChangeCheck = false;
                    return undefined;
                },

                proceedUnsavedChanges: function (skipApplyCheck, callbackFn, buttonControlId) {
                    switch (buttonControlId) {
                        case "yes":
                            this.skipApplyCheck = skipApplyCheck;
                            this.saveForm();
                            delayedActionCallback = callbackFn;
                            break;
                        case "cancel":
                            break;
                        case "no":
                        default:
                            callbackFn.call(this);
                            break;
                    }
                },

                confirmUnsavedChanges: function(skipApplyCheck, callbackFn) {
                    if (this.FormDesignBoard.HasChanged) {
                        this.UnsavedChangesConfirmationDialog
                            .once("close", this.proceedUnsavedChanges.bind(this, skipApplyCheck, callbackFn));
                        this.UnsavedChangesConfirmationDialog.show();
                    } else {
                        callbackFn.call(this);
                    }

                    return this.FormDesignBoard.HasChanged;
                },

                proceedUnappliedFieldChanges: function (callbackFn, buttonControlId) {
                    switch (buttonControlId) {
                        case "yes":
                            this.PropertyGrid.trigger("properties:ApplyChanges");
                            delayedActionCallback = callbackFn;
                            break;
                        case "cancel":
                            break;
                        case "no":
                        default:
                            callbackFn.call(this);
                            break;
                    }
                },

                confirmUnappliedFieldChanges: function(callbackFn) {
                    var hasChanged = this.PropertyGrid.hasChanged();
                    if (!this.skipApplyCheck && hasChanged) {
                        this.UnappliedFieldChangesConfirmationDialog
                            .once("close", this.proceedUnappliedFieldChanges.bind(this, callbackFn));
                        this.UnappliedFieldChangesConfirmationDialog.show();
                    } else {
                        this.skipApplyCheck = false;
                        callbackFn.call(this);
                    }

                    return hasChanged;
                },

                confirmUnappliedThenUnsavedChanges: function (callbackFn) {
                    this.confirmUnappliedFieldChanges(this.confirmUnsavedChanges.bind(this, true, callbackFn));
                },

                updatePerformanceAppIsActive: function() {
                    if (this.PerformanceApp) {
                        this.PerformanceApp.FormPerformance
                            .IsActive = this.ContextForInfoTab.IsVisible &&
                            this.ContextToggle.IsOpen &&
                            this.InfoTabControl.SelectedValue === performanceTabGuid;
                    }
                },

                tabsSwitched: function() {
                    this.ContextForInfoTab.IsFooterHidden = this.InfoTabControl.SelectedValue !== settingsTabGuid;
                    this.updatePerformanceAppIsActive();
                },

                languageDropDownIsOpenChanged: function() {
                    if (this.LanguageDropDownButton.IsOpen) {
                        this.LanguageListControl.trigger("change:MaxRows");
                    }
                },

                proceedSelectLanguage: function (value) {
                    this.LanguageListControl.SelectedValue = value;
                },

                selectLanguageBeforeChanged: function (obj) {
                    var value = obj.item[this.LanguageListControl.ValueFieldName];
                    if (this.FormDesignBoard.CurrentLanguage !== value && (this.FormDesignBoard.HasChanged || this.PropertyGrid.hasChanged())) {
                        obj.isSelectionAborted = true;
                        this.confirmUnappliedThenUnsavedChanges(this.proceedSelectLanguage.bind(this, obj.item[this.LanguageListControl.ValueFieldName]));
                    }
                },

                selectedLanguageChanged: function() {
                    if (this.LanguageListControl.SelectedItem) {
                        this.LanguageDropDownButton.Text = this.LanguageListControl.SelectedItem.displayName;
                        this.LanguageDropDownButton.Tooltip = this.LanguageListControl.SelectedItem.text;

                        if (this.FormDesignBoard.CurrentLanguage !== this.LanguageListControl.SelectedValue) {
                            debouncedLoadForm.call(this, this.LanguageListControl.SelectedValue);
                        }
                    }

                    this.LanguageDropDownButton.IsOpen = false;
                },

                selectedItemChanged: function(selectedItem) {
                    this.SelectedItem = selectedItem;

                    this.ActionControl.getAction("Delete").IsDisabled = !selectedItem;

                    this.togglePropertyGrid(this.SelectedItem);
                },

                proceedSelectElement: function(model, element) {
                   this.FormDesignBoard.selectItem(model, element);
                },

                selectElement: function(model, element) {
                    this.confirmUnappliedFieldChanges(this.proceedSelectElement.bind(this, model, element));
                },

                formModelChanged: function(formModel) {
                    var hasForm = formModel && formModel.model;
                    var formId = hasForm ? formModel.itemId : "";

                    var languages = hasForm && formModel.languages ? formModel.languages : [];
                    this.LanguageListControl.DynamicData = languages;
                    this.LanguageListControl.IsSelectionRequired = languages.length > 0;

                    var languageModel = this.LanguageListControl
                        .findWhere({ name: this.FormDesignBoard.CurrentLanguage });
                    this.LanguageListControl.select(languageModel);

                    if (this.SettingsApp) {
                        this.SettingsApp.FormSettingsPropertyGrid.ContextItem = formModel;
                    }

                    if (this.PerformanceApp) {
                        this.PerformanceApp.FormPerformance.FormId = "";
                        this.PerformanceApp.FormPerformance.FormId = formId;
                        this.updatePerformanceAppIsActive();
                    }

                    this.PropertyGrid.FormId = formId;
                    this.HeaderTitle.Text = "";
                    if (hasForm) {
                        if (this.FormDesignBoard.FormMode === "new") {
                            formModel.model.name = "";
                            this.HeaderTitle.Text = this.NewFormName.Text;
                        } else {
                            this.HeaderTitle.Text = formModel.model.name;
                        }

                        if (formModel.model.isTemplate) {
                            if (this.FormDesignBoard.FormMode === "copy") {
                                formModel.model.isTemplate = false;
                            } else {
                                this.HeaderTitle.Text += " (" + this.Template.Text + ")";
                            }
                        }
                    }
                },

                loadFormCompleted: function(formModel) {
                    var hasForm = formModel && formModel.model;
                    var isTemplate = hasForm && formModel.model.isTemplate;
                    var saveAsTemplateOrForm = this.ActionControl.getAction("SaveAsTemplateOrForm");
                    
                    saveAsTemplateOrForm.Text = isTemplate ? this.SaveAsForm.Text : this.SaveAsTemplate.Text;
                    saveAsTemplateOrForm.Tooltip = isTemplate ? this.SaveAsForm.Tooltip : this.SaveAsTemplate.Tooltip;

                    this.ActionControl.getAction("SaveAs").IsDisabled = this.FormDesignBoard.FormMode !== "edit";
                    this.ActionControl.IsEnabled = hasForm;
                    this.SaveButton.IsEnabled = hasForm;
                    this.ContextToggle.IsEnabled = hasForm;
                    if (!hasForm) {
                        this.ContextToggle.IsOpen = false;
                    }

                    this.ProgressIndicatorPanel.IsBusy = false;
                },

                reloadFieldSuccess: function(fieldModel) {
                    this.removeOldMessage(messageTypes.reloadField + fieldModel.itemId);
                    this.closePropertyGrid();

                    if (delayedActionCallback) {
                        delayedActionCallback.call(this);
                        delayedActionCallback = null;
                    }
                },

                togglePropertyGrid: function(contextItem) {
                    var hasContextItem = speak.utils.is.a.object(contextItem);

                    this.PropertyGrid.ContextItem = contextItem;
                    this.ContextForPropertyGrid.IsVisible = hasContextItem;
                    this.ContextForInfoTab.IsVisible = !hasContextItem;
                },

                closePropertyGrid: function() {
                    this.FormDesignBoard.selectItem(null);
                },

                saveFormSuccess: function(saveOptions, data) {
                    this.removeOldMessage("SaveForm");
                    
                    if (saveOptions.editExisting) {
                        debouncedLoadForm.call(this);

                        this.MessageBar.add({
                            MessageId: "SaveForm",
                            Type: "notification",
                            Text: this.SaveExistingSuccessMessage.Text,
                            IsClosable: true,
                            IsTemporary: true
                        });
                    } else {
                        var dialogOptions = {
                            success: true
                        };
                        this.SaveFormSubAppRenderer.actionCompleted(dialogOptions);

                        var isTemplate = saveOptions.hasOwnProperty("isTemplate")
                            ? saveOptions.isTemplate
                            : this.FormDesignBoard.FormModel.model.isTemplate;

                        var messageText = isTemplate
                            ? this.SaveAsTemplateSuccessMessage.Text
                            : this.SaveAsFormSuccessMessage.Text;
                        this.MessageBar.add({
                            MessageId: "SaveForm",
                            Type: "notification",
                            Text: messageText,
                            IsClosable: true,
                            IsTemporary: true
                        });

                        var formId = speak.utils.is.a.guid(data) ? data : this.FormDesignBoard.FormModel.itemId;
                        if (formId) {
                            var options = {
                                formId: formId,
                                sc_formmode: "edit"
                            };

                            var urlQuery = speak.Helpers.url.addQueryParameters(window.location.search, options);
                            history.replaceState("", "", urlQuery);

                            this.FormDesignBoard.FormId = formId;
                            this.FormDesignBoard.FormMode = "edit";
                            debouncedLoadForm.call(this);
                        }
                    }
                    
                    if (delayedActionCallback) {
                        delayedActionCallback.call(this);
                        delayedActionCallback = null;
                    }
                },

                saveFormError: function(saveOptions, response) {
                    this.removeOldMessage("SaveForm");
                    delayedActionCallback = null;
                    var messageText = response && response.responseJSON && response.responseJSON.message
                        ? response.responseJSON.message
                        : response.statusText;

                    if (saveOptions.editExisting) {
                        this.ProgressIndicatorPanel.IsBusy = false;
                        this.MessageBar.add({ MessageId: "SaveForm", Type: "error", Text: messageText });
                    } else {
                        var options = {
                            success: false,
                            message: messageText
                        };
                        this.SaveFormSubAppRenderer.actionCompleted(options);
                    }
                },

                proceedSaveForm: function(setBusy) {
                    if (setBusy) {
                        this.ProgressIndicatorPanel.IsBusy = true;
                    }

                    var formMode = this.FormDesignBoard.FormMode;
                    if (!this.saveOptions.editExisting && formMode === "edit") {
                        formMode = "copy";
                    }
                    this.saveOptions.formMode = formMode;

                    this.FormDesignBoard.saveForm(this.saveOptions)
                        .then(this.saveFormSuccess.bind(this, this.saveOptions))
                        .fail(this.saveFormError.bind(this, this.saveOptions));
                },

                saveFormNameChanged: function(formName) {
                    this.saveOptions.formName = formName;

                    this.proceedSaveForm();
                },

                showSaveDialog: function(name, dialogText) {
                    this.SaveFormSubAppRenderer.show(name, dialogText);
                },

                saveFormAs: function() {
                    this.saveOptions = {
                        editExisting: false
                    };
                    this.confirmUnappliedFieldChanges(this.showSaveDialog.bind(this, this.FormDesignBoard.FormModel.model.name));
                },

                saveFormAsTemplateOrForm: function() {
                    var isTemplate = this.FormDesignBoard.FormModel.model.isTemplate;

                    // save as opposite type
                    this.saveOptions = {
                        editExisting: false,
                        isTemplate: !isTemplate
                    };

                    var dialogText = isTemplate ? this.SaveAsForm.Text : this.SaveAsTemplate.Text;
                    this.confirmUnappliedFieldChanges(this.showSaveDialog.bind(this, this.FormDesignBoard.FormModel.model.name, dialogText));
                },

                saveForm: function() {
                    var isEditMode = this.FormDesignBoard.FormMode === "edit";
                    if (isEditMode) {
                        this.saveOptions = {
                            editExisting: true
                        };
                        
                        this.confirmUnappliedFieldChanges(this.proceedSaveForm.bind(this, true));
                    } else {
                        this.saveFormAs();
                    }
                },

                previewForm: function() {

                },

                trackDeleteClick: function(event) {
                    if (event.altKey || event.shiftKey || event.ctrlKey) {
                        return;
                    }

                    if (event.keyCode === 46 && this.SelectedItem) {
                        var activeEl = document.activeElement;
                        if (!activeEl || this.FormDesignBoard.el.contains(activeEl)) {
                            this.deleteClick();
                        }
                    }
                },

                deleteClick: function() {
                    if (!this.SelectedItem)
                        return;

                    var shouldShowConfirm = this.FormDesignBoard.isContainerWithFieldsSelected();
                    if (shouldShowConfirm) {
                        var dialogText = deleteConfirmationMessage;
                        dialogText = speak.Helpers.string.format(dialogText, this.SelectedItem.model.name);

                        this.DeleteConfirmationDialog.Message = dialogText;
                        this.DeleteConfirmationDialog.show();
                    } else {
                        this.FormDesignBoard.removeItem(this.SelectedItem);
                    }
                },

                confirmDeleteClicked: function(buttonControlId) {
                    if (buttonControlId[0] !== "ok")
                        return;

                    this.FormDesignBoard.removeItem(this.SelectedItem);
                },

                shareForm: function() {

                },

                reportForm: function() {

                },

                editConditions: function() {

                },

                proceedGoBack: function() {
                    this.skipChangeCheck = true;

                    var prevPage = referrerUrl.indexOf(formsPageAppUrl) >= 0
                        ? referrerUrl
                        : "/sitecore/client" + formsPageAppUrl;
                    window.location.href = prevPage;
                },

                goBack: function () {
                    this.confirmUnappliedThenUnsavedChanges(this.proceedGoBack);
                },

                showErrorMessage: function(errorType, xhr, textStatus, errorThrown, relatedItem) {
                    if (xhr && xhr.status === 401) {
                        speak.module("bclSession").unauthorized();
                        return;
                    }

                    delayedActionCallback = null;

                    var message = {
                        MessageId: errorType,
                        Type: "error",
                        Text: "",
                        Actions: [],
                        IsClosable: true
                    };

                    switch (errorType) {
                    case messageTypes.loadForm:
                        message.Text = this.LoadFormErrorMessage.Text;
                        message.IsClosable = false;
                        break;
                    case messageTypes.renderField:
                        message.Text = this.RenderFieldErrorMessage.Text;
                        break;
                    case messageTypes.reloadField:
                        message.Text = this.ReloadFieldErrorMessage.Text;

                        if (relatedItem && relatedItem.itemId) {
                            message.MessageId += relatedItem.itemId;
                            this.removeOldMessage(message.MessageId);
                        }
                        break;
                    default:
                        message.Text = xhr && xhr.responseJSON && xhr.responseJSON.message
                            ? xhr.responseJSON.message
                            : xhr.statusText;
                        break;
                    }

                    this.MessageBar.add(message);
                },

                removeOldMessage: function(messageId) {
                    var oldMessages = this.MessageBar.where({ MessageId: messageId });
                    oldMessages.forEach(function(message) {
                            this.MessageBar.remove(message);
                        },
                        this);
                }
            };
        });
})(Sitecore.Speak);