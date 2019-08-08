define(
    [
        "sitecore",
        "/-/speak/v1/ExperienceEditor/ExperienceEditor.js",
        "/-/speak/v1/ExperienceEditor/ExperienceEditorProxy.js",
        "/-/speak/v1/ExperienceEditor/TranslationUtil.js"
    ],
 function (Sitecore, ExperienceEditor, ExperienceEditorProxy, TranslationUtil) {
  Sitecore.Commands.ShowDataSources =
  {
    commandContext: null,

    reEvaluate: function () {
      return this.canExecute(this.commandContext);
    },

    canExecute: function (context) {
      var that = this;

      if (!ExperienceEditor.isInMode("edit")
        || !context
        || !context.button
        || context.currentContext.isFallback) {
        return false;
      }

      var isAllowed = ExperienceEditor.isEditingAndDesigningAllowed();
      ExperienceEditor.on("onChromeUpdated", function () {
        that.setHighlightState(context);
      });

      context.button.set("isEnabled", isAllowed);
      this.setHighlightState(context);
      if (!this.commandContext) {
        this.commandContext = ExperienceEditor.Common.cloneObject(context);
      }

      if (context.app
        && isAllowed
        && context.button.get("isChecked") === "1") {
        this.publishAffectedPagesNotification(context);
      }

      return isAllowed;
    },

    publishAffectedPagesNotification: function (context) {
        if (!context.currentContext.isInFinalWorkFlow) {
            return;
        }

        var that = this;
        ExperienceEditor.getPageDatasourcesItemIDs(context, function (itemIDs) {
            if (itemIDs.length > 0) {
                ExperienceEditor.areItemsInFinalWorkflowState(context, itemIDs, function (result) {
                    if (result.inFinalStateCountAndNotPublished > 0) {
                        that.showPublishAffectedPagesNotification();
                        return;
                    }
                });
            }

            ExperienceEditor.getDatasourceUsagesWithFinalWorkflowStep(context, function (context, isInFinalStep) {
                if (isInFinalStep == true) {
                    that.showPublishAffectedPagesNotification();
                    return;
                }
            });
        });
    },

    showPublishAffectedPagesNotification: function () {
      var notificationTitle = TranslationUtil.translateTextByServer(TranslationUtil.keys.This_component_contains_associated_content_If_you_publish_this_component_the_associated_content_is_also_published_to_a_number_of_other_pages_that_use_the_same_associated_content, ExperienceEditor);
        // notificationTitle = notificationTitle.replace("{0}", result.inFinalStateCountAndNotPublished);
      this.command.context.app.showNotification("notification", notificationTitle, true);
    },

    execute: function (context) {
      var that = this;
      ExperienceEditor.PipelinesUtil.generateRequestProcessor("ExperienceEditor.ToggleRegistryKey.Toggle", function (response) {
        response.context.button.set("isChecked", response.responseValue.value ? "1" : "0");
        that.setHighlightState(response.context);
      }, { value: context.button.get("registryKey") }).execute(context);
    },

    setHighlightState: function (context) {
      var className = "chromeWithDatasource";
      ExperienceEditor.ShowDataSources = ExperienceEditor.ShowDataSources || {};
      var isChecked = context.button.get("isChecked") !== "0" && context.button.get("isChecked") && context.button.get("isEnabled");
      isChecked = isChecked == null ? ExperienceEditor.ShowDataSources.isChecked : isChecked;
      ExperienceEditor.ShowDataSources.isChecked = isChecked || ExperienceEditor.ShowDataSources.isChecked;
      if (isChecked === "1" || isChecked === true) {
        var renderingsWithDatasources = ExperienceEditor.getPageEditingWindow().Sitecore.LayoutDefinition.getRenderingsWithDatasources();
        ExperienceEditor.getPageEditingWindow().Sitecore.PageModes.ChromeManager.setClass(renderingsWithDatasources, className);
      } else {
        ExperienceEditor.getPageEditingWindow().Sitecore.PageModes.ChromeManager.removeClass(className);
      }
    }
  };
});