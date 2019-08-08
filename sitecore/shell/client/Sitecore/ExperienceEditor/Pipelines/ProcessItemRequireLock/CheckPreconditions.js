define(["sitecore", "/-/speak/v1/ExperienceEditor/ExperienceEditor.js"], function (Sitecore, ExperienceEditor) {
  return {
    execute: function (context) {
      if (context.app.currentContext.webEditMode.toLowerCase() != "edit") {
        context.aborted = true;
        return;
      }

      if (context.app.currentContext.isLocked) {
        context.aborted = true;
        return;
      }

      if (!context.app.currentContext.requireLockBeforeEdit) {
        context.aborted = true;
        return;
      }

      if (!Sitecore.Commands.Lock || !Sitecore.Commands.Lock.allowLock(context)) {
        context.aborted = true;
        return;
      }
    }
  };
});