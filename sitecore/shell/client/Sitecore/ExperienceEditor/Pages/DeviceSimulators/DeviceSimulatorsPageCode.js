define(["sitecore", "/-/speak/v1/ExperienceEditor/DOMHelper.js", "/-/speak/v1/ExperienceEditor/ExperienceEditor.js", "/-/speak/v1/ExperienceEditor/SetDeviceSimulator.js"], function (Sitecore, DOMHelper, ExperienceEditor) {
  var deviceSimulatorsPageCode = Sitecore.Definitions.App.extend({

    initialized: function () {
      var that = this;

      this.on("devicesimulator:select", function (event) {
        var selectedItem = this.getSelectedItem(event.sender.el);
        var selectedItemId = selectedItem.get("itemId");

        ExperienceEditor.CommandsUtil.executeCommand("SetDeviceSimulator", selectedItemId);
      }, this);

      this.setSelectedItem();
    },

    getSelectedItem: function (eventTarget) {
      var id = DOMHelper.findId(eventTarget);
      if (id === undefined)
        return undefined;
      return this[id];
    },

    //[Obsolete]
    findId: function (target) {
        console.log("Obsolete. This method is no longer supported use  DOMHelper.findId(target) instead");
        return DOMHelper.findId(target);
    },

    setSelectedItem: function () {
      var selectedSimulatorId = this.getSelectedDeviceSimulator();

      $.each(this, function () {
        if (this.attributes === undefined || this.componentName !== "SelectOptionsItem") {
          return;
        }

        this.set("isPressed", this.get("itemId") === selectedSimulatorId);
      });
    },

    getSelectedDeviceSimulator: function () {
        return ExperienceEditor.Common.getCookieValue("sc_simulator_id");
    }
  });

  return deviceSimulatorsPageCode;
});