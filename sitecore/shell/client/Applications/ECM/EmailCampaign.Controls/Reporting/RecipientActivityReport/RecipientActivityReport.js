define([
    'sitecore',
    '/-/speak/v1/ecm/CompositeComponentBase.js',
    '/-/speak/v1/ecm/ReportDataService.js'
],
function (sitecore, CompositeComponentBase, ReportDataService) {
    var model = sitecore.Definitions.Models.ControlModel.extend({});
    var view = CompositeComponentBase.view.extend({
        childComponents: [
            'SentVolumeRateScoreCard'
        ],
        initialize: function () {
            this._super();
            this.attachHandlers();
            this.update();
        },
        attachHandlers: function () {
            ReportDataService.on('change:totals', this.update, this);
        },
        update: function () {
            var totals = ReportDataService.get('totals');
            this.children.SentVolumeRateScoreCard.set('value', totals.sent);
            this.children.SentVolumeRateScoreCard.set('description', '-');
        }
    });
    sitecore.Factories.createComponent('RecipientActivityReport', model, view, '.sc-RecipientActivityReport');
})
 