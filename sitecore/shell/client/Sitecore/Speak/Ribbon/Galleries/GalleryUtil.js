define(["sitecore", "/-/speak/v1/ExperienceEditor/ExperienceEditor.js"], function (Sitecore, ExperienceEditor) {
  var galleryUtil = {
    executeCommand: function (commandName, commandArgument) {
      ExperienceEditor.CommandsUtil.executeCommand(commandName, commandArgument);
    },

    scrollToActive: function (component) {
      var isActive = component.model.get("active");
      if (isActive) {
        var element = component.$el;
        $(".sc-gallery-content").animate({
          scrollTop: element.offset().top
        }, 500);
      }
    }
  };

  return galleryUtil;
});