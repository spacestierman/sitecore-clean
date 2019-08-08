define([
    "sitecore",
    "/-/speak/v1/ecm/CompositeComponentBase.js",
    "/-/speak/v1/ecm/MathHelper.js",
    "/-/speak/v1/ecm/ReportDataService.js",
    "/-/speak/v1/ecm/constants.js",
    "/-/speak/v1/ecm/ChartDataConversionService.js"
], function (sitecore, CompositeComponentBase, MathHelper, ReportDataService, Constants, ChartDataConversionService) {
    var model = CompositeComponentBase.model.extend({
        initialize: function (){
            this.dataSource = ReportDataService.getDataSource('byMessage');
	        this.attachHandlers();
        },

        reCalculate: function () {
            this.monthGroup = this.getMonthGroup();
	        this.set('monthActivity', this.fillInEmptyMonths(this.getMonthActivity()));
        },

        getMonthActivity: function () {
            var monthActivity = this.monthGroup.orderBy('month').top(Infinity).reverse();

            _.each(monthActivity, function (item) {
                var d = new Date();
                d.setTime(item.key);
                item.key = d;
                // "new Number" used to automatically convert null into 0, in case when denominator(click) equals 0 
                item.value.valuePerVisit = new Number(MathHelper.divide(item.value.value, item.value.click));
            });

            return monthActivity;
        },

        fillInEmptyMonths: function(data) {
            var minimumVisibleMonths = this.get('minimumVisibleMonths');

            if (data.length && data.length < minimumVisibleMonths) {
                var earliestDate = new Date(),
                    earliestDateTime = data[0].key,
                    monthActivityLength = data.length;
                earliestDate.setTime(earliestDateTime);

                for (var i = 0; i < minimumVisibleMonths - monthActivityLength; i++) {
                    earliestDate.setMonth(earliestDate.getMonth() - 1);
                    var date = new Date();
                    date.setTime(earliestDate.getTime());
                    data.unshift({
                        key: date,
                        value: {
                            click: 0,
                            itemsCount: 0,
                            value: 0,
                            valuePerVisit: 0,
                            month: earliestDate.getTime()
                        }
                    });
                }
            }
            return data;
        },

        getMonthGroup: function () {
            return this.dataSource.dimension('month').group({
                click: { $sum: 'visits', condition: { event: Constants.Reporting.Events.CLICK } },
                value: '$sum',
                month: '$any'
            });
        },
        
        attachHandlers: function() {
	        this.dataSource.on('filter:updated filtered', this.reCalculate, this);
        }
    });

    var view = CompositeComponentBase.view.extend({
        childComponents: [
            'CombinationChart'
        ],

        initialize: function () {
            this._super();
            this.model.set('minimumVisibleMonths', this.$el.data('sc-minimumvisiblemonths'));
	        this.attachHandlers();
        },

        refresh: function () {
            this.children.CombinationChart.viewModel.refresh();
        },

        attachHandlers: function() {
	        this.model.on('change:monthActivity', this.updateValueOverTimeChart, this);
        },

        updateValueOverTimeChart: function() {
            var monthActivity = this.model.get('monthActivity'),
                valueOverTimeChartData = [];

            if (monthActivity.length) {
                valueOverTimeChartData = ChartDataConversionService.convert(
                    this.model.get('monthActivity'),
                    {
                        keys: [
                            { key: 'click', title: sitecore.Resources.Dictionary.translate("ECM.Reporting.Visits") },
                            { key: 'value', title: sitecore.Resources.Dictionary.translate("ECM.Reporting.Value") },
                            { key: 'valuePerVisit', title: sitecore.Resources.Dictionary.translate("ECM.Reporting.ValuePerVisit") }
                        ]
                    }
                );
                valueOverTimeChartData[0].bar = true;
            }

            this.children.CombinationChart.set("dynamicData", valueOverTimeChartData);
        }
    });

    sitecore.Factories.createComponent("ValueAndVisitsChart", model, view, ".sc-ValueAndVisitsChart");
    return { view: view, model: model };
});