define(["sitecore","/-/speak/v1/ExperienceEditor/ExperienceEditor.js"], function (Sitecore, ExperienceEditor) {
  Sitecore.Commands.ShowDeviceSimulators =
  {
    canExecute: function (context) {
      return ExperienceEditor.isInMode("preview");
    },

    execute: function (context) {
    }
  };
});
