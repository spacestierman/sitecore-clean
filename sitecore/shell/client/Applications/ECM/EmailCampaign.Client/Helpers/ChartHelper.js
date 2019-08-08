define([], function () {
    var ChartHelper = {
        findCharts: function (scope) {
            var charts = [];
            _.each(scope, function (child) {
                if (child && child.componentName && child.componentName.indexOf('Chart') >= 0) {
                    charts.push(child);
                }
            });
            return charts;
        },
        updateCharts: function (scope) {
            var charts = ChartHelper.findCharts(scope);
            _.each(charts, function (chart) {
                if (chart.viewModel.$el.is(':visible') &&
                    !chart._renderedOnce &&
                    $.type(chart.viewModel.refresh) === 'function') {
                    chart.viewModel.refresh(false);
                }
            });
        }
    };
    return ChartHelper;
});