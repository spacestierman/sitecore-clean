require.config({
  paths: {
    loadingImage: "/sitecore/shell/client/Sitecore/ContentTesting/LoadingImage"
  }
});

define(["sitecore", "loadingImage", "/-/speak/v1/ExperienceEditor/ExperienceEditor.js"], function (Sitecore, loadingImage, ExperienceEditor) {
  Sitecore.Commands.ActiveTests =
    {
      canExecute: function (context) {
        var self = this;
        self.setLoadingAnimation(true);
        context.app.canExecute("Optimization.ActiveTests.Count", context.currentContext, function (testCount) {
          self.setLoadingAnimation(false);
          self.fillupActiveTestsCount(testCount);
        });
        return true;
      },

      execute: function (context) {
        var dialogPath = "/sitecore/client/Applications/ContentTesting/Pages/ActiveTests";
        var dialogFeatures = "dialogHeight: 600px;dialogWidth: 500px;";
        ExperienceEditor.Dialogs.showModalDialog(dialogPath, '', dialogFeatures, null, function (result) {
          if (!result) {
            return;
          }
        });

        // Show the loading image until dialog doesn't appeared
        loadingImage.showElement();
        loadingImage.waitLoadingDialog("jqueryModalDialogsFrame");

      },
      setLoadingAnimation: function (show) {
        var myItemsButton = $("a[data-sc-id='Active-Tests']");
        myItemsButton.children("img[id='activeTestsLoadingIndicator']:first").remove();
        if (show) {
          var gif = '<img id="activeTestsLoadingIndicator" src="/sitecore/shell/client/Speak/Assets/img/Speak/ProgressIndicator/sc-spinner16.gif" style="margin-left: 5px;">';
          myItemsButton.append(gif);
        }
      },
      fillupActiveTestsCount(testCount) {
        var outputEl = $("a[data-sc-id='Active-Tests'] span");
        var counterSpan = "<span> (" + testCount + ")</span>";
        if (testCount === 0) {
          outputEl.children().remove();
        } else {
          if (outputEl.children().length === 0)
            outputEl.append(counterSpan);
          else
            outputEl.children().html(counterSpan);
        }
      }

    };
});