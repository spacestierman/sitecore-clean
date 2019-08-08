define(
  [
    "sitecore",
    "/-/speak/v1/ExperienceEditor/ExperienceEditor.js",
    "/-/speak/v1/ExperienceEditor/ExperienceEditorProxy.js"
  ],
  function (Sitecore, ExperienceEditor, ExperienceEditorProxy) {
    return {
      priority: 1,
      execute: function (context) {
        context.controlCommandHandlers = context.controlCommandHandlers || {};
        context.controlCommandHandlers["EnableEditing"] = function (isChecked) {
          ExperienceEditorProxy.changeCapability("edit", isChecked);
        };

        context.controlCommandHandlers["EnableDesigning"] = function (isChecked) {
          ExperienceEditorProxy.changeCapability("design", isChecked);
        };

        context.controlCommandHandlers["EnableFieldsValidation"] = function(isChecked) {
          if (!isChecked) {
            return;
          }

          require(["/-/speak/v1/ExperienceEditor/ValidateFieldsUtil.js"], function(ValidateFieldsUtil) {
            ValidateFieldsUtil.validateFields(context);
          });
        }
      }
   };
});