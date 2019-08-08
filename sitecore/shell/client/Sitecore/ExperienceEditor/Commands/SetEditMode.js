define(["sitecore", "/-/speak/v1/ExperienceEditor/ExperienceEditor.js"], function (Sitecore, ExperienceEditor) {
  Sitecore.Commands.SetEditMode =
  {
    canExecute: function (context) {
      context.button.set({ isPressed: ExperienceEditor.isInMode("edit") });

      return context.currentContext.canEdit;
    },
    execute: function (context) {
      context.currentContext.value = encodeURIComponent(ExperienceEditor.getPageEditingWindow().location);
      ExperienceEditor.PipelinesUtil.generateRequestProcessor("ExperienceEditor.EditMode.SelectEdit", function (response) {
        ExperienceEditor.getPageEditingWindow().location = response.responseValue.value;
      }).execute(context);
    }
  };
});