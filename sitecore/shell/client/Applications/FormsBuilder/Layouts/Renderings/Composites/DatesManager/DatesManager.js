(function(speak) {
    speak.component([],
        function() {
            var updateDateLessThanMin = function() {
                var test = this.Date && this.MinDate && this.Date < this.MinDate;
                if (test) {
                    this.Date = this.MinDate;
                }
                return test;
            };

            var updateDateGreaterThanMax = function() {
                var test = this.MaxDate && this.Date > this.MaxDate;
                if (test) {
                    this.Date = this.MaxDate;
                }
                return test;
            };

            var setDatePickerDateTime = function(dateStr) {
                var date = "", time = "T000000";
                if (dateStr) {
                    var dateObj = new Date(dateStr);
                    date = speak.Helpers.date.toISO(dateObj);
                    time = date.substring(8) || time;
                }

                this.Time = time;
                this.Date = date;
            };

            return {
                initialized: function() {
                    this.$el = $(this.el);
                    this.$el.closest(".sc-formcomponent").css("display", this.IsVisible ? "" : "none");

                    this.on({
                            "change:SelectedDate": this.updatedSelectedDate,
                            "change:StartDate": this.updatedStartDate,
                            "change:EndDate": this.updatedEndDate
                        },
                        this);

                    this.SelectedDatePicker = this.parent.SelectedDatePicker;
                    this.StartDatePicker = this.parent.StartDatePicker;
                    this.EndDatePicker = this.parent.EndDatePicker;

                    this.SelectedDatePicker.on("change:Date", this.selectedDatePickerDateChanged, this);
                    this.StartDatePicker.on("change:Date", this.startDatePickerDateChanged, this);
                    this.EndDatePicker.on("change:Date", this.endDatePickerDateChanged, this);
                },

                updatedSelectedDate: function() {
                    if (!this.SelectedIsDirty) {
                        setDatePickerDateTime.call(this.SelectedDatePicker, this.SelectedDate);
                    }
                },

                updatedStartDate: function() {
                    if (!this.StartIsDirty) {
                        setDatePickerDateTime.call(this.StartDatePicker, this.StartDate);
                    }
                },

                updatedEndDate: function() {
                    if (!this.EndIsDirty) {
                        setDatePickerDateTime.call(this.EndDatePicker, this.EndDate);
                    }
                },

                selectedDatePickerDateChanged: function() {
                    if (updateDateGreaterThanMax.call(this.SelectedDatePicker) ||
                        updateDateLessThanMin.call(this.SelectedDatePicker)) {
                        return;
                    }

                    this.SelectedIsDirty = true;
                    this.SelectedDate = this.toIsoStringDate(this.SelectedDatePicker.Date);
                    this.SelectedIsDirty = false;
                },

                startDatePickerDateChanged: function() {
                    if (updateDateGreaterThanMax.call(this.StartDatePicker)) {
                        return;
                    }

                    this.EndDatePicker.MinDate = this.StartDatePicker.Date;
                    this.SelectedDatePicker.MinDate = this.StartDatePicker.Date;

                    if (!this.StartDatePicker.Date) {
                        this.EndDatePicker.$el.datepicker('option', "minDate", null);
                        this.SelectedDatePicker.$el.datepicker('option', "minDate", null);

                    } else {
                        updateDateLessThanMin.call(this.EndDatePicker);
                        updateDateLessThanMin.call(this.SelectedDatePicker);
                    }

                    this.StartIsDirty = true;
                    this.StartDate = this.toIsoStringDate(this.StartDatePicker.Date);
                    this.StartIsDirty = false;
                },

                endDatePickerDateChanged: function() {
                    if (updateDateLessThanMin.call(this.EndDatePicker)) {
                        return;
                    }

                    this.StartDatePicker.MaxDate = this.EndDatePicker.Date;
                    this.SelectedDatePicker.MaxDate = this.EndDatePicker.Date;

                    if (!this.EndDatePicker.Date) {
                        this.StartDatePicker.$el.datepicker('option', "maxDate", null);
                        this.SelectedDatePicker.$el.datepicker('option', "maxDate", null);
                    } else {
                        updateDateGreaterThanMax.call(this.StartDatePicker);
                        updateDateGreaterThanMax.call(this.SelectedDatePicker);
                    }

                    this.EndIsDirty = true;
                    this.EndDate = this.toIsoStringDate(this.EndDatePicker.Date);
                    this.EndIsDirty = false;
                },

                reset: function() {
                    setDatePickerDateTime.call(this.StartDatePicker);
                    setDatePickerDateTime.call(this.EndDatePicker);
                    setDatePickerDateTime.call(this.SelectedDatePicker);
                },

                toIsoStringDate: function(isoDate) {
                    if (!isoDate)
                        return "";

                    var date = speak.Helpers.date.parseISO(isoDate);
                    return date.toISOString().substring(0, 19) + "Z";
                }
            };
        },
        "DatesManager");
})(Sitecore.Speak);