define(
  [
    "sitecore",
    "/-/speak/v1/ExperienceEditor/ExperienceEditor.js",
    "/-/speak/v1/ExperienceEditor/ExperienceEditor.Context.js",
    "/-/speak/v1/ExperienceEditor/TranslationUtil.js"
  ],
  function (Sitecore, ExperienceEditor, ExperienceEditorContext, TranslationUtil) {
    Sitecore.Commands.Lock =
    {
      button: null,
      canExecute: function (context) {
        if (!ExperienceEditor.isInMode("edit") || !context.currentContext.canReadLanguage || !context.currentContext.canWriteLanguage) {
          return false;
        }

        this.setButtonTitle(context, context.currentContext.isLocked);

        return context.currentContext.isLocked ? context.currentContext.canUnlock : context.currentContext.canLock;
      },

      allowLock: function (context) {
        return context.app.canExecute("ExperienceEditor.LockItem.CanToggleLock", context.currentContext);
      },

      execute: function (context) {
        if (!context.currentContext.requireLockBeforeEdit) {
          this.lockItem(context);
          return;
        }

        var that = this;
        ExperienceEditor.modifiedHandling(true, function (isOk) {
          that.lockItem(context);
        });
      },

      lockItem: function (context) {
        context.app.disableButtonClickEvents();

        ExperienceEditor.PipelinesUtil.initAndExecutePipeline(context.app.LockItemPipeline, context, function() {
            ExperienceEditor.PipelinesUtil.generateRequestProcessor("ExperienceEditor.Datasources.GetDatasourceUsagesWithLockedStatus", function (response) {

              if (context.currentContext.isLocked) {
                var associatedContentItems = response.responseValue.value;
                var errorMessage = "";

                jQuery.each(associatedContentItems, function () {

                  var clonedContext = ExperienceEditor.Common.cloneObject(context);

                  if (this.WarningMessage) {
                    errorMessage += "<br> - " + this.WarningMessage;
                    return;
                  }

                  //do not call LockItem processor on itself again
                  if (decodeURI(context.currentContext.itemId).replace(/{|}/gi, "").toUpperCase() === this.ItemId.toUpperCase()) {
                    return;
                  }

                  clonedContext.currentContext.itemId = this.ItemId;
                  clonedContext.currentContext.version = this.VersionNumber;
                  ExperienceEditor.PipelinesUtil.executeProcessors(Sitecore.Pipelines.LockItem, clonedContext);
                });

                if (errorMessage !== "") {
                  errorMessage = TranslationUtil.translateTextByServer(TranslationUtil.keys.Unfortunately_some_items_cannot_be_unlocked_because_they_are_locked_by_another_user, ExperienceEditor) + errorMessage;
                  ExperienceEditor.Dialogs.alert(encodeURI(errorMessage));
                }
              }

            if (Sitecore.Commands.MyItems && Sitecore.Commands.MyItems.reEvaluate) {
              context.currentContext.refreshIndex = true;
              Sitecore.Commands.MyItems.reEvaluate(context);
            }

            }).execute(context);
        });

        context.app.enableButtonClickEvents();

        if (!context.currentContext.requireLockBeforeEdit) {
          return;
        }

        if (ExperienceEditorContext.isModified && !context.app.isLocked) {
          ExperienceEditorContext.isModified = false;
          ExperienceEditor.refreshOnItem(context.currentContext);
        }
      },

      setButtonTitle: function (context, isLocked) {
        if (!Sitecore.Commands.Lock.button) {
          Sitecore.Commands.Lock.button = context.button;
        }

        var lockButton = Sitecore.Commands.Lock.button;
        if (!lockButton) {
          return;
        }

        lockButton.viewModel.setTitle(TranslationUtil.translateText(isLocked ? TranslationUtil.keys.Unlock : TranslationUtil.keys.Lock));
      }
    };
  });