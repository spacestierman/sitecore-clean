define(
  [
    "sitecore",
    "/-/speak/v1/ExperienceEditor/ExperienceEditor.js"
  ], function (Sitecore, ExperienceEditor) {
  return ExperienceEditor.PipelinesUtil.generateRequestProcessor("ExperienceEditor.Insert", function (response) {
    var itemId = !response.responseValue.value ? null : response.responseValue.value.itemId;
    if (itemId == null || itemId.length <= 0) {
      return;
    }

    response.context.currentContext.itemId = itemId;
    ExperienceEditor.refreshOnItem(response.context.currentContext, true, false, true);
  });
});