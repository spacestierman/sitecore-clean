(function(speak) {
  var wrapperSelector1 = ".sc-navigation-wrapper";
  var wrapperSelector2 = ".sc-flx-navigation-wrapper";
  var wrapperSelector = wrapperSelector1;
  var activeClass = "active";

  var resetNavigation = function() {
    var wrapper = $(wrapperSelector);
    if (wrapper && !wrapper.hasClass(activeClass)) {
      wrapper.addClass(activeClass);
    }
  };

  speak.component({
    name: "NavigationToggle",

    initialized: function () {
      if ($(wrapperSelector2).length > 0) {
        wrapperSelector = wrapperSelector2;
      }
      speak.on("resetNavigation", resetNavigation);
    },

    togglePanel: function() {
      var wrapper = $(wrapperSelector);
      if (wrapper) {
        wrapper.toggleClass(activeClass);
      }
    }
  });
})(Sitecore.Speak);