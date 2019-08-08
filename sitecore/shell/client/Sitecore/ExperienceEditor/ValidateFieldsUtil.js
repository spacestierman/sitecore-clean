define(
  [
    "sitecore",
    "/-/speak/v1/ExperienceEditor/ExperienceEditor.js",
    "/-/speak/v1/ExperienceEditor/DOMHelper.js"
  ], function (Sitecore, ExperienceEditor, DOMHelper) {
    var validateFieldsUtil = {
      pageModes: function () {
        return ExperienceEditor.getPageEditingWindow().Sitecore.PageModes;
      },

      validateFields: function (context) {
        ExperienceEditor.PipelinesUtil.generateRequestProcessor("ExperienceEditor.FieldsValidation.ValidateFields", function (response) {
          validateFieldsUtil.validationErrors = response.responseValue.value;
          validateFieldsUtil.showNotificationErrors(validateFieldsUtil.validationErrors);
        }).execute(ExperienceEditor.generatePageContext(context, ExperienceEditor.getPageEditingWindow().document));
      },

      showNotificationErrors: function (errors) {
        if (!errors || errors.length == 0) {
          return;
        }

        //clear all chromes from invalid status
        jQuery.each(validateFieldsUtil.pageModes().ChromeManager.getChromesByType(validateFieldsUtil.pageModes().ChromeTypes.Field), function () { this.setValidStatus(true) });

        for (var i = 0; i < errors.length; i++) {
          var error = errors[i];
          // set errors chrome to a property, so we will be able get chrome by error
          error.Chrome = validateFieldsUtil.pageModes().ChromeManager.getChromeByFieldId(error.FieldId);
          validateFieldsUtil.pageModes().ChromeManager.setChromesNotValid(error.FieldId, error.DataSourceId, error, true);
          var notificationId = validateFieldsUtil.formNotificationId(error.FieldId, error.DataSourceId) + "_" + i.toString();
          var contextApp = ExperienceEditor.RibbonApp.getApp();
          var notification = contextApp.showNotification(contextApp.NotificationBar.notificationTypes[error.Priority], error.Text, true);
          validateFieldsUtil.addChomeLinkToNotification(notification, notificationId);
        }
      },

      addChomeLinkToNotification: function (notification, notificationId) {
        var showErrorText = validateFieldsUtil.pageModes().Texts.ShowError;
        $(notification).append(DOMHelper.getNotificationOption(showErrorText, null, notificationId));
        jQuery("#" + notificationId).click(function (e) {
          var id = jQuery(e.target).attr("id");
          var fieldId = "{" + id.split("_")[0] + "}";
          var dataSource = "{" + id.split("_")[1] + "}";
          validateFieldsUtil.pageModes().ChromeManager.setChromeFocused(fieldId, dataSource);
          if (ExperienceEditor.getPageEditingWindow().Menu) {
            ExperienceEditor.getPageEditingWindow().Menu.close();
          }
        });
      },

      // [Obsolete], use the Sitecore.PageModes.ChromeManager.setChromesNotValid instead.
      setChromesNotValid: function (fieldId, dataSourceId, error) {
        console.warn("This function is obsolete and will be removed in the next product version.");
        if (!fieldId || !dataSourceId) {
          return;
        }

        var chromes = validateFieldsUtil.pageModes().ChromeManager.getChromesByFieldIdAndDataSource(fieldId, dataSourceId);
        for (var c = 0; c < chromes.length; c++) {
          var chrome = chromes[c];
          if (!chrome) {
            continue;
          }

          chrome.setValidStatus(false, error);
        }
      },

      // [Obsolete], use the Sitecore.PageModes.ChromeManager.setChromeFocused
      selectChrome: function (fieldId, dataSourceId) {
        console.warn("This function is obsolete and will be removed in the next product version.");
        var chromes = validateFieldsUtil.pageModes().ChromeManager.getChromesByFieldIdAndDataSource(fieldId, dataSourceId);

        var chrome = chromes[0];
        validateFieldsUtil.pageModes().ChromeManager.scrollChromeIntoView(chrome);
        validateFieldsUtil.pageModes().ChromeManager.select(chrome);
      },

      deactivateValidation: function (validationErrors) {
        //if validationErrors passed - deactivate only them
        if (validationErrors) {
          $.each(validationErrors, function () {
            ExperienceEditor.Common.removeNotificationMessage(this.Text);
            this.Chrome.setValidStatus(true);
          });
        } else {
          //else - deactivate errors for all chromes
          var chromes = validateFieldsUtil.pageModes().ChromeManager.chromes();
          for (var c = 0; c < chromes.length; c++) {
            var chrome = chromes[c];
            if (chrome.data.errors) {
              for (var e = 0; e < chrome.data.errors.length; e++) {
                var error = chrome.data.errors[e];
                ExperienceEditor.Common.removeNotificationMessage(error.Text);
              }
            }

            chrome.setValidStatus(true);
          }
        }
        ExperienceEditor.RibbonApp.getApp().setHeight();
      },

      formNotificationId: function (fieldId, dataSourceId) {
        var value = fieldId + "_" + dataSourceId;
        return value.replace(/(\{|\})/g, "");
      }
    };

    return validateFieldsUtil;
  });