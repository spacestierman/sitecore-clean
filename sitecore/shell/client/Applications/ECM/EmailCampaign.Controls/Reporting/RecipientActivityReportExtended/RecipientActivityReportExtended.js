define([
    "sitecore",
    "/-/speak/v1/ecm/CompositeComponentBase.js",
    "/-/speak/v1/ecm/ReportDataService.js"
],
function (sitecore, CompositeComponentBase, ReportDataService) {
    var model = sitecore.Definitions.Models.ControlModel.extend({});
    var view = CompositeComponentBase.view.extend({
        childComponents: [
            'TotalSent'
        ],
        initialize: function () {
            this._super();
            this.attachHandlers();
            this.update();
        },
        attachHandlers: function() {
            ReportDataService.on('change:totals', this.update, this);
        },
        update: function () {
            var totals = ReportDataService.get('totals');
            this.children.TotalSent.set('value', totals.sent);
        }
    });
    sitecore.Factories.createComponent("RecipientActivityReportExtended", model, view, ".sc-RecipientActivityReportExtended");
})