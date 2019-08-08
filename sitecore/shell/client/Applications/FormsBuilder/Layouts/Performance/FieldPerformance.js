(function(sc) {
    sc.pageCode([
            "/sitecore/shell/client/Applications/FormsBuilder/Layouts/Performance/Performance.js",
            "/-/speak/v1/formsbuilder/assets/formservices.js"
        ],
        function(performance, formServices) {
            var metricIds = {
                abandonmentRate: "{E222DB70-C4DB-495E-A421-D4BAACEB9653}",
                errorRate: "{A3BA68A3-9C93-49ED-B1A8-46C9278BCC21}",
                averageTime: "{0C73EAF6-2450-4576-869B-7282357DF648}"
            };
            return sc.extend({},
                performance,
                {
                    initialized: function() {
                        performance.initialized.call(this);
                        this.defineProperty("FieldId", "");

                        this.on("change:FieldId", this.parameterChanged);
                    },

                    getChart: function() {
                        return this.FieldMetricsChart;
                    },

                    shouldUpdateReport: function() {
                        return this.FieldId && performance.shouldUpdateReport.call(this);
                    },

                    updateReport: function() {
                        formServices.getFieldStatistics(this.FormId, this.FieldId, this.StartDate, this.EndDate)
                            .then(this.updateReportCompleted.bind(this))
                            .fail(this.updateReportError.bind(this));
                    },

                    updateReportError: function() {
                        var data = {
                            abandonmentRate: 0,
                            errorRate: 0,
                            averageTime: 0
                        };

                        this.showErrorMessage();
                        this.updateReportCompleted(data);
                    },

                    updateReportCompleted: function(data, textStatus, xhr) {
                        if (xhr && xhr.status === 204) {
                            this.IsAnalyticsEnabled = false;
                            return;
                        }

                        this.setMetricValue(metricIds.abandonmentRate, data.abandonmentRate, true);
                        this.setMetricValue(metricIds.errorRate, data.errorRate, true);
                        this.setMetricValue(metricIds.averageTime, data.averageTime);
                        this.MetricsListControl.trigger("itemsChanged", this.MetricsListControl.Items);

                        var values = _.map(this.MetricsListControl.Items,
                            function(item) {
                                return {
                                    x: item.$displayName,
                                    y: item.FullValue
                                };
                            });

                        this.setChartDynamicData(values);
                    }
                });
        },
        "FieldPerformance");
})(Sitecore.Speak);