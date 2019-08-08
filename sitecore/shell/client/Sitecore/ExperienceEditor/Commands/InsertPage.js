define(["sitecore", "/-/speak/v1/ExperienceEditor/ExperienceEditor.js"], function (Sitecore, ExperienceEditor) {
  Sitecore.Commands.InsertPage =
  {
    canExecute: function (context) {
      if (!ExperienceEditor.isInMode("edit")) {
        return false;
      }

      return context.app.canExecute("ExperienceEditor.Insert.CanInsert", context.currentContext);
    },
    execute: function (context) {
      context.app.disableButtonClickEvents();
      ExperienceEditor.PipelinesUtil.initAndExecutePipeline(context.app.InsertItemPipeline, context);
      context.app.enableButtonClickEvents();
    }
  };
});