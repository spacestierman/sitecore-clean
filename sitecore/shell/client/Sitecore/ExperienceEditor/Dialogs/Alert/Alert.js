define(["sitecore", "/-/speak/v1/ExperienceEditor/ExperienceEditor.js"], function (Sitecore, ExperienceEditor) {
  var alertDialog = Sitecore.Definitions.App.extend({
    initialized: function () {
      this.setOkButtonClick();
      var messageBody = $(this.MessageBody.viewModel.$el[0]);
      messageBody.html(ExperienceEditor.Web.getUrlQueryStringValue("message"));
    },
    setOkButtonClick: function () {
      this.on("button:ok", function () {
        this.closeDialog(null);
      }, this);
    },
  });
  return alertDialog;
});