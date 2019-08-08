define([
    "sitecore",
    "/-/speak/v1/ecm/CompositeComponentBase.js",
    "/-/speak/v1/ecm/MathHelper.js",
    "/-/speak/v1/ecm/ReportDataService.js",
    "/-/speak/v1/ecm/constants.js"
], function (sitecore, CompositeComponentBase, MathHelper, ReportDataService, Constants) {
    var model = CompositeComponentBase.model.extend({
        initialize: function (){
            this.dataSource = ReportDataService.getDataSource('byMessage');
	        this.attachHandlers();
        },

        reCalculate: function () {
	        this.set('totals', this.getTotals());
        },

        getTotals: function () {
            return {
                open: this.getOpens(),
                click: this.getClicks()
            }
        },

        getOpens: function () {
            return this.dataSource.total(function (fact) {
                return fact.event === Constants.Reporting.Events.OPEN ? fact.visits : 0;
            });
        },

        getClicks: function () {
            return this.dataSource.total(function (fact) {
                return fact.event === Constants.Reporting.Events.CLICK ? fact.visits : 0;
            });
        },

        attachHandlers: function() {
	        this.dataSource.on('filter:updated filtered', this.reCalculate, this);
        }
    });

    var view = CompositeComponentBase.view.extend({
        childComponents: [
            'PieChart'
        ],

        initialize: function () {
            this._super();

	        this.attachHandlers();
        },

        attachHandlers: function() {
	        this.model.on('change:totals', this.updateClicksToOpens, this);
        },

        updateClicksToOpens: function() {
	        var totals = this.model.get('totals'),
                recipientActivityChartData = [];

            if (totals.click && totals.open) {
                recipientActivityChartData = [
                    {
                        "key": sitecore.Resources.Dictionary.translate("ECM.Reporting.Opens"),
                        "values": [
                            {
                                "x": sitecore.Resources.Dictionary.translate("ECM.Reporting.Clicks"),
                                "y": totals.click
                            },
                            {
                                "x": sitecore.Resources.Dictionary.translate("ECM.Reporting.Opens"),
                                "y": totals.open
                            }
                        ]
                    }
                ];
            }

            this.children.PieChart.set("dynamicData", recipientActivityChartData);
        }
    });

    sitecore.Factories.createComponent("ClickToOpensChart", model, view, ".sc-ClickToOpensChart");
    return { view: view, model: model };
});