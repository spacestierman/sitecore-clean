define([
    'sitecore',
    '/-/speak/v1/ecm/CompositeComponentBase.js',
    '/-/speak/v1/ecm/MathHelper.js',
    '/-/speak/v1/ecm/ReportDataService.js',
    '/-/speak/v1/ecm/ChartDataConversionService.js'
], function (sitecore, CompositeComponentBase, MathHelper, ReportDataService, ChartDataConversionService) {
    var model = CompositeComponentBase.model.extend({
        initialize: function (){
            this.dataSource = ReportDataService.getDataSource('byUrl');
	        this.attachHandlers();
        },

        reCalculate: function () {
	        this.urlGroup = this.getUrlGroup();

            this.set('mostClicked', this.getMostClicked());
        },

        getUrlGroup: function () {
            return this.dataSource.dimension('url').group({
                click: { $sum: 'visits' }
            });
        },

        getMostClicked: function () {
            var mostClicked = this.urlGroup.orderBy('click').top(4);
            return mostClicked || this.emptyItem();
        },

        attachHandlers: function() {
	        this.dataSource.on('filter:updated filtered', this.reCalculate, this);
        }
    });

    var view = CompositeComponentBase.view.extend({
        childComponents: [
            'BarChart'
        ],

        initialize: function () {
            this._super();

	        this.attachHandlers();
        },

        attachHandlers: function() {
	        this.model.on('change:mostClicked', this.updateTopLinksClicked, this);
        },

        convertToChartData: function(data) {
            return ChartDataConversionService.convert(
                    data,
                    { keys: [ 'click'] }
                );
        },

        updateTopLinksClicked: function() {
            var mostClicked = this.model.get('mostClicked'),
                chartData = [];

            if (mostClicked && mostClicked.length) {
                chartData = this.convertToChartData(mostClicked);
            }

            this.children.BarChart.set("dynamicData", chartData);
        }
    });

    sitecore.Factories.createComponent("TopLinksClickedChart", model, view, ".sc-TopLinksClickedChart");
    return { view: view, model: model };
});