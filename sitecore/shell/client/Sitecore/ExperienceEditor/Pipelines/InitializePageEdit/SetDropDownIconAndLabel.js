define(["sitecore", "/-/speak/v1/ExperienceEditor/ExperienceEditor.js"], function (Sitecore, ExperienceEditor) {
  var viewData = [];
  return {
    priority: 1,
    execute: function (context) {
      $.each(context.app, function () {
        if (this.attributes === undefined || this.componentName !== "LargeDropDownButton" || this.get("iconLabelRequest") === null || this.get("iconLabelRequest") === "") {
          return;
        }

        var button = this;
        var label, icon;
        var command = button.viewModel.$el.attr("data-sc-command");
        var view = viewData[command];
        if (view != undefined) {
          button.viewModel.setIcon(view.icon);
          button.viewModel.setLabel(view.label);
          return;
        }

        context.currentContext.value = button.viewModel.$el.attr("data-sc-listdatasourceid");
        var iconLabelRequest = this.get("iconLabelRequest");
        if (iconLabelRequest == "") {
          return;
        }

        var iconPath = this.get("iconPath");
        var labelText = this.get("labelText");
        if (iconPath != null && labelText != null) {
          button.viewModel.setIcon(iconPath);         
          button.viewModel.setLabel(labelText);
          return;
        }

        ExperienceEditor.Web.postServerRequest(iconLabelRequest, context.currentContext, function (response) {
          if (response.errorMessage) {
            context.app.handleResponseErrorMessage(response);
            return;
          }

          var responseObject = !response.value ? response.responseValue.value : response.value;
          if (responseObject.icon !== "") {
            icon = responseObject.icon;
            button.viewModel.setIcon(icon);
          }

          if (responseObject.label !== "") {
            label = responseObject.label;
            button.viewModel.setLabel(label);
          }

          viewData[command] = { icon: icon, label: label };
        });
      });
    }
  };
});