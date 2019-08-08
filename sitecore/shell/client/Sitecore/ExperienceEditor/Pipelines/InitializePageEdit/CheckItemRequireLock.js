define(["sitecore", "/-/speak/v1/ExperienceEditor/ExperienceEditor.js"], function (Sitecore, ExperienceEditor) {
  return {
    priority: 1,
    execute: function (context) {
      if (!context.app.ProcessItemRequireLockPipeline) {
        return;
      }

      ExperienceEditor.PipelinesUtil.initAndExecutePipeline(context.app.ProcessItemRequireLockPipeline, ExperienceEditor.RibbonApp.getAppContext(null, context.app));
    }
  };
});