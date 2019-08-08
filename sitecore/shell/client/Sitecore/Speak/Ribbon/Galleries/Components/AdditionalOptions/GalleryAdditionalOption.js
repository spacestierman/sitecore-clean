define(["sitecore", "/-/speak/v1/Ribbon/GalleryUtil.js", "/-/speak/v1/ExperienceEditor/ExperienceEditor.js"],
 function (Sitecore, GalleryUtil, ExperienceEditor) {
  Sitecore.Factories.createBaseComponent({
    name: "GalleryAdditionalOption",
    base: "ButtonBase",
    selector: ".sc-gallery-additionaloption",
    attributes: [
        { name: "command", value: "$el.data:sc-command" },
        { name: "isPressed", value: "$el.data:sc-ispressed" },
        { name: "controlStateResult", value: "$el.data:sc-controlstateresult" },
        { name: "pageCodeScriptFileName", value: "$el.data:sc-pagecodescriptfilename" }
    ],

    initialize: function () {
      this._super();
      this.model.on("change:isEnabled", this.toggleEnable, this);
      this.model.on("change:isVisible", this.toggleVisible, this);
      this.model.on("click", function() {

        var command = this.model.get("command");
        if (!command || command == '') {
          return;
        }

        ExperienceEditor.CommandsUtil.runCommandExecute(command, ExperienceEditor.RibbonApp.getAppContext(), ExperienceEditor.Common.closeFullContentIframe, this.model.get("pageCodeScriptFileName"));
      }, this);
      this.checkCommandCanExecute();
    },

    checkCommandCanExecute: function() {
      var controlStateResult = this.model.get("controlStateResult");
      if (controlStateResult) {
        this.model.set({ isEnabled: controlStateResult.toLowerCase() == "true" });
        return;
      }

      var command = this.model.get("command");
      if (!command || command == "") {
        return;
      }

      var context = ExperienceEditor.RibbonApp.getAppContext();
      var commandInstance = ExperienceEditor.CommandsUtil.getCommand(command);
      if (!commandInstance) {
        var commandControlStateResult = ExperienceEditor.CommandsUtil.getControlStateResultByCommandName(context.app, command);
        if (commandControlStateResult) {
          this.model.set({ isEnabled: commandControlStateResult });
        }
        return;
      }

      var canExecute = commandInstance.canExecute(context, this);

      this.model.set({ isEnabled: canExecute });
    },

    toggleEnable: function () {
      if (!this.model.get("isEnabled")) {
        this.$el.addClass("disabled");
      } else {
        this.$el.removeClass("disabled");
      }
    },

    toggleVisible: function () {
      if (!this.model.get("isVisible")) {
        this.$el.hide();
      } else {
        this.$el.show();
      }
    }
  });
});