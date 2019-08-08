(function(sc) {
    sc.pageCode([
            "/sitecore/shell/client/Applications/FormsBuilder/Layouts/Performance/Performance.js",
            "/-/speak/v1/formsbuilder/assets/formservices.js"
        ],
        function(performance, formServices) {
            var metricIds = {
                uniqueViews: "{B1E58105-22E8-453F-B46A-D426E7A8EB3A}",
                abandonments: "{796B237F-8614-4791-9782-AC1EF509FDFC}",
                abandonmentRate: "{42EBDAFF-3286-4643-A218-412C904E2998}"
            };

            return sc.extend({},
                performance,
                {
                    initialized: function() {
                        performance.initialized.call(this);

                        this.defineProperty("FieldMetrics", []);
                        this.on({
                                "change:FieldMetrics": this.updateChart
                            },
                            this);

                        this.MetricsOptions.on("change:SelectedValue", this.updateChart, this);

                        this.MetricsOptions.IsSelectionRequired = true;
                    },

                    getCompactedValues: function(values, showShortChart) {
                        values = _.sortBy(values, 'y').reverse();

                        if (!showShortChart) {
                            return values;
                        }

                        var other = values.slice(4)
                            .reduce(function(a, b) {
                                return { y: a.y + b.y };
                            });
                        other.x = this.OtherLabelText.Text;

                        values.length = 4;
                        values.push(other);
                        return values;
                    },

                    updateChartUi: function(valueCount, showShortChart) {
                        var $metricsBorder = $(this.MetricsChartBorder.el);

                        $metricsBorder.toggleClass("sc-compact-chart", showShortChart);
                        this.MetricsChart.ChartComponent.ItemClicked = showShortChart
                            ? function(bar) {
                                if (bar.rawData.index === 4) {
                                    this.isFullChart = true;
                                    this.updateChart();
                                }
                            }.bind(this)
                            : function() {};
                        //height of bars + height of spaces + margins
                        $metricsBorder.height(valueCount * 20.52 + (valueCount + 1) * 10.11 + 65.11);
                    },

                    sortValues: function(values) {
                        var showShortChart = values.length > 5 && !this.isFullChart;
                        values = this.getCompactedValues(values, showShortChart);
                        this.updateChartUi(values.length, showShortChart);
                        return values;
                    },

                    updateChart: function() {
                        var currentValueFieldName = this.MetricsOptions.SelectedValue;

                        var values = _.map(this.FieldMetrics,
                            function(metric) {
                                return {
                                    x: metric.fieldName,
                                    y: metric[currentValueFieldName]
                                };
                            },
                            this);

                        this.setChartDynamicData(values);
                    },

                    updateReport: function() {
                        formServices.getFormStatistics(this.FormId, this.StartDate, this.EndDate)
                            .then(this.updateReportCompleted.bind(this))
                            .fail(this.updateReportError.bind(this));
                    },

                    updateReportError: function() {
                        var data = {
                            uniqueViews: 0,
                            abandonments: 0,
                            abandonmentRate: 0,
                            fields: []
                        };

                        this.showErrorMessage();
                        this.updateReportCompleted(data);
                    },

                    updateReportCompleted: function(data, textStatus, xhr) {
                        if (xhr && xhr.status === 204) {
                            this.IsAnalyticsEnabled = false;
                            return;
                        }

                        this.setMetricValue(metricIds.uniqueViews, data.uniqueViews);
                        this.setMetricValue(metricIds.abandonments, data.abandonments);
                        this.setMetricValue(metricIds.abandonmentRate, data.abandonmentRate, true);
                        this.MetricsListControl.trigger("itemsChanged", this.MetricsListControl.Items);

                        this.isFullChart = false;
                        this.FieldMetrics = data.fields;
                    }
                });
        },
        "FormPerformance");
})(Sitecore.Speak);