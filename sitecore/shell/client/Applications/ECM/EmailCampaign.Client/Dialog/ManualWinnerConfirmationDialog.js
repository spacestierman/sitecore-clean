define([
  "sitecore",
  "/-/speak/v1/ecm/DialogBase.js",
  "/-/speak/v1/ecm/constants.js"
], function (sitecore, DialogBase, Constants) {
  return DialogBase.extend({
    showDialog: function (options) {
      this._super(options);
      var isAutomated = options.data.messageType === Constants.MessageTypes.AUTOMATED;
      this.WhenYouSelectAWinnerTextTriggered.set("isVisible", isAutomated);
      this.WhenYouSelectAWinnerTextUsual.set("isVisible", !isAutomated);
    }
  });
});
