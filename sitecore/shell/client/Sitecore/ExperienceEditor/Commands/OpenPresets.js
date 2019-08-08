define(["sitecore", "/-/speak/v1/ExperienceEditor/ExperienceEditor.js"], function (Sitecore, ExperienceEditor) {
  Sitecore.Commands.OpenPresets =
  {
    canExecute: function (context) {
      if (!ExperienceEditor.isInMode("edit")) {
        return false;
      }

      return context.app.canExecute("ExperienceEditor.LayoutPresets.CanOpen", context.currentContext);
    },
    execute: function (context) {
      context.app.disableButtonClickEvents();
      ExperienceEditor.PipelinesUtil.initAndExecutePipeline(context.app.LayoutPresetsPipeline, context);
      context.app.enableButtonClickEvents();
    }
  };
});