define(["sitecore", "/-/speak/v1/ExperienceEditor/ExperienceEditor.js"], function (Sitecore, ExperienceEditor) {
  return {
    priority: 1,
    execute: function (context) {
      var buttons = [];
      var registryKeys = "";
      var self = this;
      $.each(context.app, function () {
        if (this.attributes === undefined
            || this.componentName !== "SmallCheckButton"
            || this.get("registryKey") === null
            || this.get("registryKey") === "")
          return;

        var registryKeyValue = this.get("registryKeyValue");
        if (registryKeyValue != null
          && registryKeyValue !== "") {
          self.setButtonState(context, this, registryKeyValue === "True");
          return;
        }

        // TODO: Probably nobody will use code below because registryKey value already retrieved
        buttons.push(this);
        registryKeys += this.get("registryKey") + ",";
      });

      if (registryKeys == ""
        || buttons.length == 0) {
        return;
      }

      ExperienceEditor.PipelinesUtil.generateRequestProcessor("ExperienceEditor.ToggleRegistryKeys.Get", function (response) {
        var results = response.responseValue.value.split(",");
        for (var i = 0; i < results.length; i++) {
          if (!buttons[i]) continue;
          self.setButtonState(response.context, buttons[i], results[i] === "True");
        }
      }, { value: registryKeys.substring(0, registryKeys.length - 1) }).execute(context);
    },

    setButtonState: function (context, button, isChecked) {
      var isEnabled = isChecked;
      button.set("isChecked", isEnabled ? "1" : "0");
      var controlCommandHandler = context.controlCommandHandlers[button.get("command")];
      if (controlCommandHandler) {
        var controlStateResult = ExperienceEditor.Controls.getControlStateResult(button);
        if (controlStateResult != null) {
          isEnabled = isEnabled && controlStateResult;
        }

        controlCommandHandler(isEnabled);
      }
    }
  };
});