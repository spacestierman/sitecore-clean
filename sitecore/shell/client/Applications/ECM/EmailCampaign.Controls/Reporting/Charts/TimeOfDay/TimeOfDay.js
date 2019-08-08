define([
    'backbone',
    'sitecore',
    '/-/speak/v1/ecm/ChartDataConversionService.js',
    '/-/speak/v1/ecm/MathHelper.js',
    '/-/speak/v1/ecm/constants.js',
    '/-/speak/v1/ecm/ReportDataService.js',
    '/-/speak/v1/ecm/TimeOfDayReportBase.js',
    "/-/speak/v1/ecm/DateTimeFormatter.js"
], function (backbone, sitecore, ChartDataConversionService, MathHelper, Constants, ReportDataService, TimeOfDayReportBase, DateTimeFormatter) {
    var model = TimeOfDayReportBase.model.extend({
        processData: function(data) {
            for (var idx in data) {
                if (data.hasOwnProperty(idx)) {
                    var item = data[idx];
                    item.key = DateTimeFormatter.utcToLocalHour(item.key);
                }
            }

            var emptyItem = {
                click: 0,
                itemsCount: 0,
                open: 0,
                value: 0
            };

            var processed = _.map(_.range(0, 24),
                function (hour) {
                    var item = _.findWhere(data, { key: hour });

                    if (item) {
                        return item;
                    } else {
                        return {
                            key: hour,
                            value: _.clone(emptyItem)
                        }
                    }
                });

            return processed;
        },

        reCalculate: function() {
            var group = this.getHourGroup(),
                data = group.top(Infinity);
            this.set('hours', this.processData(data));
        }
    });

    var view = TimeOfDayReportBase.view.extend({
        childComponents: [
            'LineChart'
        ],
        initialize: function() {
            this._super();
            this.attachHandlers();
        },
        attachHandlers: function() {
            this.model.on('change:hours', this.update, this);
        },
        update: function() {
            var hours = this.model.get('hours'),
               hoursChartData = [];
            if (hours && hours.length) {
                hoursChartData = ChartDataConversionService.convert(
                    hours,
                    { keys: this.model.get('eventType').split('|') }
                );
            }
            var metricsFormat = this.children.LineChart.viewModel.getMetrics();
            metricsFormat.xOptions.numberScale = 'Time:AMPM';
            this.children.LineChart.set("dynamicData", hoursChartData);
        }
    });

    return sitecore.Factories.createComponent("TimeOfDayChart", model, view, ".sc-TimeOfDayChart");
});