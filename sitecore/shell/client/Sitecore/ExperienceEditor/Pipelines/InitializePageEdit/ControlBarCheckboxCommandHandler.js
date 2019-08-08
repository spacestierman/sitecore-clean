define(["sitecore", "/-/speak/v1/ExperienceEditor/ExperienceEditor.js", "/-/speak/v1/ExperienceEditor/ExperienceEditorProxy.js"], function (Sitecore, ExperienceEditor, ExperienceEditorProxy) {
  return {
    priority: 1,
    execute: function (context) {
      context.controlCommandHandlers = context.controlCommandHandlers || {};
      context.controlCommandHandlers["ShowControlBar"] = function (isChecked) {
        scControlBar = isChecked;
        ExperienceEditorProxy.controlBarStateChange();
      };
    }
  };
});