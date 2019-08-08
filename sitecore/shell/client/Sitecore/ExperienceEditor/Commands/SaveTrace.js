define(["sitecore", "/-/speak/v1/ExperienceEditor/ExperienceEditor.js"], function (Sitecore, ExperienceEditor) {
  Sitecore.Commands.SaveTrace =
  {
    canExecute: function (context) {
      var isTracing = ExperienceEditor.isDebugging() && ExperienceEditor.Web.getUrlQueryStringValue("sc_trace") == "1";
      return ExperienceEditor.canToggleDebug() && isTracing;
    },
    execute: function (context) {
      context.currentContext.value = ExperienceEditor.Web.getUrlQueryStringValue("sc_trf");
      context.app.disableButtonClickEvents();
      ExperienceEditor.PipelinesUtil.initAndExecutePipeline(context.app.SaveDebugTrace, context);
      context.app.enableButtonClickEvents();
    }
  };
});