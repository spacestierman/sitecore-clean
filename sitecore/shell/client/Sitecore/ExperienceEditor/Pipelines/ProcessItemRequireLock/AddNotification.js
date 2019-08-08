define(
  [
    "sitecore",
    "/-/speak/v1/ExperienceEditor/ExperienceEditor.js",
    "/-/speak/v1/ExperienceEditor/TranslationUtil.js",
    "/-/speak/v1/ExperienceEditor/DOMHelper.js"
  ],
  function (Sitecore, ExperienceEditor, TranslationUtil, DOMHelper) {
  return {
    execute: function (context) {
      var notificationTitle = TranslationUtil.translateText(TranslationUtil.keys.You_must_lock_this_item_before_you_can_edit_it);
      var notification = context.app.showNotification("warning", notificationTitle, true);
      var notificationOption = $(DOMHelper.getNotificationOption(TranslationUtil.translateText(TranslationUtil.keys.Lock_and_edit)));
      notificationOption.click(function (e) {
        ExperienceEditor.CommandsUtil.executeCommand("Lock");
      });

      $(notification).append(notificationOption);
    }
  };
});