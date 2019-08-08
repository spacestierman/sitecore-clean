(function(speak) {
    define([],
        function() {
            var debouncedUpdateReport = _.debounce(function() {
                    if (this.updateReport) {
                        this.updateReport();
                    }
                },
                10);

            return {
                initialized: function() {
                    this.defineProperty("IsAnalyticsEnabled", true);
                    this.defineProperty("IsActive", false);
                    this.defineProperty("FormId", "");
                    this.defineProperty("StartDate", "");
                    this.defineProperty("EndDate", "");

                    this.on({
                            "change:IsAnalyticsEnabled": this.isAnalyticsEnabledChanged,
                            "change:IsActive": this.isActiveChanged,
                            "change:FormId": this.parameterChanged,
                            "change:StartDate": this.parameterChanged,
                            "change:EndDate": this.parameterChanged
                        },
                        this);

                    this.StartDatePicker.on("change:Date", this.startDatePickerDateChanged, this);
                    this.EndDatePicker.on("change:Date", this.endDatePickerDateChanged, this);

                    var date = new Date();
                    this.EndDatePicker.setDate(date);
                    date.setDate(date.getDate() - 7);
                    this.StartDatePicker.setDate(date);
                },

                startDatePickerDateChanged: function() {
                    if (this.StartDatePicker.MaxDate && this.StartDatePicker.Date > this.StartDatePicker.MaxDate) {
                        this.StartDatePicker.Date = this.StartDatePicker.MaxDate;
                        return;
                    }

                    this.EndDatePicker.MinDate = this.StartDatePicker.Date;
                    this.StartDate = this.toIsoStringDate(this.StartDatePicker.Date);
                },

                endDatePickerDateChanged: function() {
                    if (this.EndDatePicker.MinDate && this.EndDatePicker.Date < this.EndDatePicker.MinDate) {
                        this.EndDatePicker.Date = this.EndDatePicker.MinDate;
                        return;
                    }

                    this.StartDatePicker.MaxDate = this.EndDatePicker.Date;
                    this.EndDate = this.toIsoStringDate(this.EndDatePicker.Date);
                },

                getChart: function() {
                    return this.MetricsChart;
                },

                sortValues: function(values) {
                    return _.sortBy(values, 'y').reverse();
                },

                setChartDynamicData: function(values) {
                    var data = [];

                    if (values.length) {
                        values = this.sortValues(values);
                        data = [
                            {
                                key: "Series0",
                                values: values
                            }
                        ];
                    }
                    this.getChart().DynamicData = data;
                },

                shouldUpdateReport: function() {
                    return this.IsAnalyticsEnabled && this.IsActive && this.FormId && this.StartDate && this.EndDate;
                },

                parameterChanged: function() {
                    this.shouldUpdateReport() && debouncedUpdateReport.call(this);
                },

                isActiveChanged: function() {
                    if (this.IsActive && this.AnalyticsBorder.IsVisible) {
                        setTimeout(function() {
                                this.resizeAnalyticsBorder();
                            }.bind(this),
                            0);
                    }

                    this.parameterChanged();
                },

                isAnalyticsEnabledChanged: function() {
                    this.PerformanceBorder.IsVisible = this.IsAnalyticsEnabled;
                    this.AnalyticsBorder.IsVisible = !this.IsAnalyticsEnabled;

                    if (this.AnalyticsBorder.IsVisible) {
                        var debouncedResizeHandler = _.debounce(function() {
                                    this.resizeAnalyticsBorder();
                                },
                                100,
                                false)
                            .bind(this);

                        window.addEventListener("resize", debouncedResizeHandler);
                        this.resizeAnalyticsBorder();
                    }

                    this.parameterChanged();
                },

                setMetricValue: function(metricKey, value, isPercentage) {
                    var item = this.MetricsListControl.getByValue(metricKey);
                    if (item) {
                        item.Value = isPercentage ? Math.round(value) + "%" : +value.toFixed(2);
                        item.FullValue = value;
                    }
                },

                toIsoStringDate: function(isoDate) {
                    var date = speak.Helpers.date.parseISO(isoDate);
                    var convertedDate = new Date(date * 1 + date.getTimezoneOffset() * 60000);
                    return convertedDate.toISOString();
                },

                showErrorMessage: function() {
                    speak.app.removeOldMessage("UpdateReportError");
                    speak.app.MessageBar.add({
                        MessageId: "UpdateReportError",
                        Type: "error",
                        Text: speak.app.UpdateReportErrorMessage.Text,
                        IsClosable: true,
                        IsTemporary: true
                    });
                },

                resizeAnalyticsBorder: function() {
                    if (!this.IsActive) {
                        return;
                    }

                    var el = this.AnalyticsBorder.el,
                        $containerEl = $(el).closest(".sc-contextdetails-content");
                    if ($containerEl.length) {
                        var height = 0.9 * ($containerEl[0].clientHeight - 60);
                        if (height > 50) {
                            el.style.height = Math.round(height) + "px";
                        }
                    }
                }
            };
        });
})(Sitecore.Speak);