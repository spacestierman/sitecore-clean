define(["sitecore", "/-/speak/v1/ExperienceEditor/ExperienceEditor.js"], function (Sitecore, ExperienceEditor) {
  Sitecore.Commands.MyItems =
    {
      reEvaluate: function (context) {
        if (!ExperienceEditor.getPageEditingWindow().Sitecore.WebEditSettings.showNumberOfLockedItemsOnButton) {
            return;
        }
        var self = this;
        var timeout = 3000;
        self.updateItemsCountLabel(0);
        self.setLoadingAnimation(true);
        clearTimeout(this.timer);
        this.timer = setTimeout(function () {
          context.app.canExecute("ExperienceEditor.MyItems.Count", context.currentContext, function (result) {
            self.setLoadingAnimation(false);
            self.updateItemsCountLabel(result);
          });
        }, timeout);
      },

      canExecute: function (context) {
        this.reEvaluate(context);
        return true;
      },

      updateItemsCountLabel: function (itemsCount) {
        var amountOfLockedItems = itemsCount;
        var myItemsButton = $("a[data-sc-id='MyItemsRibbonButton'] span");
        var counterSpan = "<span> (" + amountOfLockedItems + ")</span>";

        if (amountOfLockedItems == 0) {
          myItemsButton.children().remove();
        } else {
          if (myItemsButton.children().length == 0)
            myItemsButton.append(counterSpan);
          else
            myItemsButton.children().html(counterSpan);
        }
      },

      setLoadingAnimation: function (show) {
        var myItemsButton = $("a[data-sc-id='MyItemsRibbonButton']");
        myItemsButton.children("img[id='myItemsLoadingIndicator']:first").remove();
        if (show) {
          var gif = '<img id="myItemsLoadingIndicator" src="/sitecore/shell/client/Speak/Assets/img/Speak/ProgressIndicator/sc-spinner16.gif" style="margin-left: 5px;">';
          myItemsButton.append(gif);
        }          
      },

      execute: function (context) {
        var dialogPath = "/sitecore/shell/~/xaml/Sitecore.Shell.Applications.WebEdit.Dialogs.LockedItems.aspx";
        var dialogFeatures = "dialogHeight: 600px;dialogWidth: 800px;";
        ExperienceEditor.Dialogs.showModalDialog(dialogPath, '', dialogFeatures, null, function () {
          Sitecore.Commands.MyItems.canExecute(context);
          context.currentContext.isLocked = context.app.canExecute("ExperienceEditor.LockItem.IsLocked", context.currentContext);
          if (Sitecore.Commands.Lock) {
            Sitecore.Commands.Lock.canExecute(context);
          }
        });
      }
    };
});