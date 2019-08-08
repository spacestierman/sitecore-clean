define([
    'sitecore',
    '/-/speak/v1/ecm/CompositeComponentBase.js',
    '/-/speak/v1/ecm/ReportDataService.js'
], function (sitecore, CompositeComponentBase, ReportDataService) {
    var model = CompositeComponentBase.model.extend({});

    var view = CompositeComponentBase.view.extend({
        childComponents: [
            'BarChart'
        ],
        initialize: function() {
            this._super();
            this.attachHandlers();
        },
        attachHandlers: function() {
            ReportDataService.on('change:totals', this.update, this);
        },
        refresh: function() {
            this.children.BarChart.viewModel.refresh();
        },
        update: function() {
            var totals = ReportDataService.get('totals'),
                overTimeChartData = [
                {
                    "key": "Visits",
                    "values": [
                        { "x": sitecore.Resources.Dictionary.translate("ECM.Reporting.TotalSent"), "y": totals.sent },
                        { "x": sitecore.Resources.Dictionary.translate("ECM.Reporting.Delivered"), "y": totals.sent - totals.bounce },
                        { "x": sitecore.Resources.Dictionary.translate("ECM.Reporting.Visits"), "y": totals.click },
                        { "x": sitecore.Resources.Dictionary.translate("ECM.Reporting.Browsed"), "y": totals.browsed },
						{ "x": sitecore.Resources.Dictionary.translate("ECM.Reporting.Productive"), "y": totals.productive }
                    ]
                }
                ];

            this.children.BarChart.set("dynamicData", overTimeChartData);
        }
    });

    sitecore.Factories.createComponent("EngagementChart", model, view, ".sc-EngagementChart");

    return { view: view, model: model };
});