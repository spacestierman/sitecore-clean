define(["sitecore", "/-/speak/v1/ExperienceEditor/ExperienceEditor.js"], function (Sitecore, ExperienceEditor) {
  return ExperienceEditor.PipelinesUtil.generateRequestProcessor("ExperienceEditor.Save.CallServerSavePipeline", function (response) {
    ExperienceEditor.getContext().isModified = false;
    ExperienceEditor.getContext().isContentSaved = true;
    if (!response.context.app.disableRedirection) {
      ExperienceEditor.getPageEditingWindow().location.reload();
    }

    response.context.app.disableRedirection = false;
  });
});