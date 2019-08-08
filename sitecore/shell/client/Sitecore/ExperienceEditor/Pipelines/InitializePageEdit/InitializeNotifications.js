define(
  [
    "sitecore",
    "/-/speak/v1/ExperienceEditor/ExperienceEditor.js",
    "/-/speak/v1/ExperienceEditor/DOMHelper.js",
  ],
  function (Sitecore, ExperienceEditor, DOMHelper) {
    return {
      priority: 1,
      execute: function (context) {
        var isPreviewMode = ExperienceEditor.isInMode("preview");
        var isEditMode = ExperienceEditor.isInMode("edit");
        if (!isPreviewMode
          && !isEditMode) {
          return;
        }

        context.app.NotificationBar.notificationTypes = ["error", "notification", "warning"];
        this.registerPageEditorNotificationHandler();
        context.app.NotificationBar.viewModel.$el.click(function () { context.app.setToggleShow(); });
        if (isEditMode) {
          context.app.NotificationBar.viewModel.$el.on("click", "button.close", function (e) {
            ExperienceEditor.getPageEditingWindow().Sitecore.PageModes.DesignManager.sortingEnd();
          });
        }

        if (isPreviewMode) {
          var self = this;
          require(["/-/speak/v1/ExperienceEditor/TranslationUtil.js"], function (translationUtil) {
            self.showPreviewModeNotifications(context, translationUtil);
          });
        }

        if (isEditMode) {
          this.showEditModeNotifications(context);
        }
      },

      showEditModeNotifications: function (context) {
        var notifications = context.currentContext.itemNotifications;
        for (var i = 0; i < notifications.length; i++) {
          var notification = notifications[i];
          var notificationElement = context.app.showNotification(context.app.NotificationBar.notificationTypes[notification.Type], notification.Description, true);
          if (notificationElement && notification.Options.length > 0) {
            for (var j = 0; j < notification.Options.length; j++) {
              jQuery(notificationElement).append(DOMHelper.getNotificationOption(notification.Options[j].Title, notification.Options[j].Command));
            }
          }
        }
      },

      showPreviewModeNotifications: function (context, translationUtil) {
        ExperienceEditor.areItemsInFinalWorkflowState(context, null, function (result) {
          if (result.notInFinalStateCount == 0) {
            return;
          }

          var notificationTitle = translationUtil.translateTextByServer(translationUtil.keys.This_page_contains_associated_content_that_has_not_been_approved_for_publishing_To_make_sure_the_associated_content_on_the_page_can_also_be_published_move_the_relevant_items_to_the_final_workflow_state, ExperienceEditor);
          context.app.NotificationBar.removeMessages("");
          context.app.showNotification("notification", notificationTitle, true);
        });
      },

      registerPageEditorNotificationHandler: function () {
        ExperienceEditor.Common.addOneTimeEvent(function () {
          return ExperienceEditor.getPageEditingWindow().Sitecore.PageModes.PageEditor;
        }, function (that) {
          ExperienceEditor.getPageEditingWindow().Sitecore.PageModes.PageEditor.notificationBar.addNotification = that.handleNotifications;
        }, 50, this);
      },

      handleNotifications: function (notification) {
        var notificationElement = context.app.showNotification(notification.type, notification.text, true);
        if (!notificationElement
          || !notification.onActionClick
          || !notification.actionText) {
          return;
        }

        var actionLink = $(notificationElement).append(DOMHelper.getNotificationOption(notification.actionText));
        $(actionLink).click(function () { notification.onActionClick(); });
      }
    };
  });