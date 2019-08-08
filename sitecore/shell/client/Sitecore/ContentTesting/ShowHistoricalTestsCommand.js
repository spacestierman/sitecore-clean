require.config({
  paths: {
    "loadingImage": "/sitecore/shell/client/Sitecore/ContentTesting/LoadingImage"
  }
});

define(["sitecore", "loadingImage", "/-/speak/v1/ExperienceEditor/ExperienceEditor.js"], function (Sitecore, loadingImage, ExperienceEditor) {
  Sitecore.Commands.HistoricalTests =
    {
      canExecute: function (context) {
        var self = this;
        self.setLoadingAnimation(true);
        var testCount = context.app.canExecute("Optimization.HistoricalTests.Count", context.currentContext, function (testCount) {
          self.setLoadingAnimation(false);
          self.fillupHistoricalTestsCount(testCount);
        });

        return true;
      },

      execute: function (context) {
        var dialogPath = "/sitecore/client/Applications/ContentTesting/Pages/HistoricalTests";
        dialogPath = Sitecore.Helpers.url.addQueryParameters(dialogPath, {
          id: context.currentContext.itemId,
          vs: context.currentContext.version,
          la: context.currentContext.language
        });

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
        var myItemsButton = $("a[data-sc-id='Historical-Tests']");
        myItemsButton.children("img[id='historicalTestsLoadingIndicator']:first").remove();
        if (show) {
          var gif = '<img id="historicalTestsLoadingIndicator" src="/sitecore/shell/client/Speak/Assets/img/Speak/ProgressIndicator/sc-spinner16.gif" style="margin-left: 5px;">';
          myItemsButton.append(gif);
        }
      },
      fillupHistoricalTestsCount(testCount) {
        var outputEl = $("a[data-sc-id='Historical-Tests'] span");
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