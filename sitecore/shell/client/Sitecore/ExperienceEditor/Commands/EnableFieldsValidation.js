define([ "sitecore", "/-/speak/v1/ExperienceEditor/ExperienceEditor.js" ], function (Sitecore, ExperienceEditor) {
  Sitecore.Commands.EnableFieldsValidation =
  {
    contextButton: null,

    isEnabled: false,

    reEvaluate: function(context) {
      var clonedContext = ExperienceEditor.Common.cloneObject(context);
      clonedContext.button = this.contextButton ? this.contextButton : null;

      var canValidate = this.canExecute(clonedContext);

      if (!this.contextButton) {
        return;
      }

      this.contextButton.set("isEnabled", canValidate);

      if (!Sitecore.Commands.EnableEditing.isEnabled) {
        require(["/-/speak/v1/ExperienceEditor/ValidateFieldsUtil.js"], function (ValidationUtil) {
          ValidationUtil.deactivateValidation(ValidationUtil.validationErrors);
        });
        if (!canValidate) {
          this.contextButton.set("isChecked", "0");
        }
      }
    },

    canExecute: function (context) {
      this.contextButton = context.button;

      if (!ExperienceEditor.isInMode("edit") || context.currentContext.isFallback || !context.currentContext.canReadLanguage || !context.currentContext.canWriteLanguage) {
        return false;
      }

      if (context.currentContext.isReadOnly) {
        return false;
      }

      var isEditingEnabled = Sitecore.Commands.EnableEditing && Sitecore.Commands.EnableEditing.isEnabled;
      if (isEditingEnabled) {
        return true;
      }

      var editingCheckControl = ExperienceEditor.CommandsUtil.getControlsByCommand(context.app.Controls, "EnableEditing")[0];
      if (!editingCheckControl) {
        return false;
      }

      return editingCheckControl.model.get("isChecked") == "1";
    },

    execute: function (context) {
      ExperienceEditor.PipelinesUtil.generateRequestProcessor("ExperienceEditor.ToggleRegistryKey.Toggle", function (response) {
        var result = response.responseValue.value;
        response.context.button.set("isChecked", response.responseValue.value ? "1" : "0");
        Sitecore.Commands.EnableFieldsValidation.isEnabled = result;
        require(["/-/speak/v1/ExperienceEditor/ValidateFieldsUtil.js"], function (ValidationUtil) {
          if (result) {
            ValidationUtil.validateFields(context);
          } else {
            ValidationUtil.deactivateValidation(ValidationUtil.validationErrors);
          }
        });
      }, { value: context.button.get("registryKey") }).execute(context);
    }
  };
});