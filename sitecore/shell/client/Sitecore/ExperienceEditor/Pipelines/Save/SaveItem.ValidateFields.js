define(
  [
    "sitecore",
    "/-/speak/v1/ExperienceEditor/ExperienceEditor.js",
    "/-/speak/v1/ExperienceEditor/ValidateFieldsUtil.js"
  ], function (Sitecore, ExperienceEditor, ValidationUtil) {
    return ExperienceEditor.PipelinesUtil.generateRequestProcessor("ExperienceEditor.Save.ValidateFields", function (response) {
      var errors = response.responseValue.value;
      if (!errors || errors.length == 0) {
        return;
      }

      response.context.abort();
      //clear "error" type messages to clear all Field validation messages before showing these
      ExperienceEditor.RibbonApp.getApp().NotificationBar.removeMessages("error");
      ValidationUtil.showNotificationErrors(errors);
    });
  });