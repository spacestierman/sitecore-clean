define(["sitecore", "/-/speak/v1/ExperienceEditor/ExperienceEditor.js"], function (Sitecore, ExperienceEditor) {
  return {
    execute: function (context) {
      ExperienceEditor.getPageEditingWindow().Sitecore.PageModes.ChromeManager.hoverFrame().deactivate();
    }
  };
});