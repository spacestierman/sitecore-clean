define(["sitecore", "/-/speak/v1/ExperienceEditor/ExperienceEditor.js"], function (Sitecore, ExperienceEditor) {
  Sitecore.Commands.Delete =
  {
    canExecute: function (context) {
      if (context.currentContext.isHome || !ExperienceEditor.isInMode("edit") || context.currentContext.isFallback) {
        return false;
      }
      return context.app.canExecute("ExperienceEditor.Delete.CanDelete", context.currentContext);
    },
    execute: function (context) {
      context.app.disableButtonClickEvents();
      ExperienceEditor.PipelinesUtil.initAndExecutePipeline(context.app.DeleteItemPipeline, context);
      context.app.enableButtonClickEvents();
    }
  };
});

