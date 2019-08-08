(function(speak) {
    speak.pageCode(["/-/speak/v1/formsbuilder/assets/filedownloader.js"],
        function(fileDownloader) {
            var exportDataBaseUrl = "/sitecore/api/ssc/forms/exportdata";

            return {
                initialized: function() {
                    this.on({
                            "exportdata:Submit": this.submit,
                            "exportdata:Cancel": this.cancel
                        },
                        this);

                    this.StartDatePicker = this.ExportDataForm.StartDatePicker;
                    this.EndDatePicker = this.ExportDataForm.EndDatePicker;
                    this.ExportType = this.ExportDataForm.ExportType;

                    this.EndDatePicker.Time = "T235959";

                    this.StartDatePicker.on("change:Date", this.startDatePickerDateChanged, this);
                    this.EndDatePicker.on("change:Date", this.endDatePickerDateChanged, this);
                    this.ExportType.on("change:SelectedValue", this.exportTypeChanged, this);
                    this.exportTypeChanged();

                    this.ExportDataDialogWindow.viewModel.$el().on('hidden', this.cleanUp.bind(this));
                },

                startDatePickerDateChanged: function() {
                    if (this.StartDatePicker.MaxDate && this.StartDatePicker.Date > this.StartDatePicker.MaxDate) {
                        this.StartDatePicker.Date = this.StartDatePicker.MaxDate;
                        return;
                    }

                    this.EndDatePicker.MinDate = this.StartDatePicker.Date;
                },

                endDatePickerDateChanged: function() {
                    if (this.EndDatePicker.MinDate && this.EndDatePicker.Date < this.EndDatePicker.MinDate) {
                        this.EndDatePicker.Date = this.EndDatePicker.MinDate;
                        return;
                    }

                    this.StartDatePicker.MaxDate = this.EndDatePicker.Date;
                },

                resetDateRange: function() {
                    this.StartDatePicker.MaxDate = "";
                    this.EndDatePicker.MinDate = "";

                    setTimeout(function() {
                            this.StartDatePicker.$el.datepicker('option', "maxDate", null);
                            this.EndDatePicker.$el.datepicker('option', "minDate", null);
                        }.bind(this),
                        0);
                },

                exportTypeChanged: function() {
                    var isDateRange = this.ExportType.SelectedValue === "1";
                    this.StartDatePicker.IsEnabled = isDateRange;
                    this.EndDatePicker.IsEnabled = isDateRange;
                },

                show: function(options) {
                    if (!options || !options.formId)
                        return;

                    if (options.token) {
                        this.removeMessages(options.token);
                    }

                    this.formId = options.formId;

                    this.ExportType.SelectedValue = options.isDateRange ? "1" : "0";

                    this.StartDatePicker.setDate(options.startDate ? new Date(options.startDate) : null);
                    this.EndDatePicker.setDate(options.endDate ? new Date(options.endDate) : null);

                    this.ExportDataDialogWindow.show();
                },

                hide: function() {
                    this.ExportDataDialogWindow.hide();
                },

                submit: function() {
                    var options = {
                        formId: this.formId
                    };

                    options.isDateRange = this.ExportType.SelectedValue === "1";
                    if (options.isDateRange) {
                        if (this.StartDatePicker.Date) {
                            options.startDate = this.toIsoStringDate(this.StartDatePicker.Date);
                        }
                        if (this.EndDatePicker.Date) {
                            options.endDate = this.toIsoStringDate(this.EndDatePicker.Date);
                        }
                    }

                    options.token = new Date().getTime();
                    this.hasCompleted = false;

                    setTimeout(function() {
                            this.downloadInProgress(options);
                        }.bind(this),
                        2000);

                    fileDownloader.download(exportDataBaseUrl,
                        options,
                        this.downloadComplete,
                        this.downloadError,
                        this);

                    this.hide();
                },

                cancel: function() {
                    this.hide();
                },

                downloadInProgress: function(options) {
                    if (!this.hasCompleted) {
                        this.parent.MessageBar.add({
                            MessageId: "exportinprogress" + options.token,
                            Type: "notification",
                            Text:
                                this.ExportInProgressText.Text,
                            IsClosable: true,
                            IsTemporary: true
                        });
                    }
                },

                downloadComplete: function(options) {
                    this.hasCompleted = true;
                    this.removeMessages(options.token);
                },

                downloadError: function(options, cookieValue) {
                    this.downloadComplete(options);

                    var message = {
                        MessageId: "exporterror" + options.token,
                        Type: "warning",
                        Text: "",
                        Actions: [
                            {
                                Text: this.TryAgain.Text,
                                Action: "trigger:forms:ExportData({\"exportOptions\":" + JSON.stringify(options) + "})"
                            }
                        ],
                        IsClosable: false
                    };

                    switch (cookieValue.toLowerCase()) {
                    case "nodata":
                        message.Text = this.NoDataText.Text;
                        message.Actions = [];
                        message.IsClosable = true;
                        break;
                    case "nodatainrange":
                        message.Text = this.NoDataInRangeText.Text;
                        break;
                    default:
                        message.Text = this.GenericErrorText.Text;
                        break;
                    }

                    this.parent.MessageBar.add(message);
                },

                removeMessages: function(token) {
                    token = token || "";
                    this.parent.removeOldMessage("exportinprogress" + token);
                    this.parent.removeOldMessage("exporterror" + token);
                },

                cleanUp: function() {
                    this.resetDateRange();
                    this.StartDatePicker.Date = "";
                    this.EndDatePicker.Date = "";
                },
                
                toIsoStringDate: function(isoDate) {
                    var date = speak.Helpers.date.parseISO(isoDate);
                    var convertedDate = new Date(date * 1 +
                        date.getTimezoneOffset() *
                        60000);
                    return convertedDate.toISOString();
                }
            };
        },
        "ExportDataSubAppRenderer");
})(Sitecore.Speak);