require.config({
  paths: {
    "loadingImage": "/sitecore/shell/client/Sitecore/ContentTesting/LoadingImage"
  }
});

define(["sitecore", "loadingImage", "/-/speak/v1/ExperienceEditor/ExperienceEditor.js"], function (Sitecore, loadingImage, ExperienceEditor) {
  Sitecore.Commands.SuggestedTests =
    {
      canExecute: function (context) {
        var self = this;
        self.setLoadingAnimation(true);
        context.app.canExecute("Optimization.SuggestedTests.Count", context.currentContext, function (testCount) {
          self.setLoadingAnimation(false);
          self.fillupSuggestedTestsCount(testCount);
        });

        return true;
      },

      execute: function (context) {
        var dialogPath = "/sitecore/client/Applications/ContentTesting/Pages/SuggestedTests";
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
        var myItemsButton = $("a[data-sc-id='Suggested-Tests']");
        myItemsButton.children("img[id='suggestedTestsLoadingIndicator']:first").remove();
        if (show) {
          var gif = '<img id="suggestedTestsLoadingIndicator" src="/sitecore/shell/client/Speak/Assets/img/Speak/ProgressIndicator/sc-spinner16.gif" style="margin-left: 5px;">';
          myItemsButton.append(gif);
        }
      },
      fillupSuggestedTestsCount(testCount) {
        var outputEl = $("a[data-sc-id='Suggested-Tests'] span");
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