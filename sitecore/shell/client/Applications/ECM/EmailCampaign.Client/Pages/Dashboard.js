define([
    'sitecore',
    'backbone',
    '/-/speak/v1/ecm/ListPageBase.js',
    '/-/speak/v1/ecm/ReportDataModel.js',
    '/-/speak/v1/ecm/ReportDataService.js'
], function (
    sitecore,
    backbone,
    ListPageBase,
    ReportDataModel,
    ReportDataService
) {

    return ListPageBase.extend({

        initialized: function () {
            this._super();
            ReportDataService.set("managerRootId", this.EmailManagerRoot.get('managerRootId'));
            ReportDataService.set(this.getDateRange());
            this.attachHandlers();
            this.setDateRangeButtonText();
            this.setupPreviousPeriod();
        },

        attachHandlers: function() {
            this.DateRangeFilterSubmitButton.on("click", this.onApplyDateRange, this);
            this.DateRangeFilterResetButton.on("click", this.onApplyDateRange, this);
            this.EmailManagerRoot.on("change:managerRootId", function() {
                ReportDataService.set("managerRootId", this.EmailManagerRoot.get('managerRootId'));
            }, this);
        },

        getDateRange: function() {
            var fromDatePicker = this.DateRangeFilter.viewModel.getFromDatePicker(),
                toDatePicker = this.DateRangeFilter.viewModel.getToDatePicker();
            return {
                dateFrom: fromDatePicker.viewModel.getDate(),
                dateTo: toDatePicker.viewModel.getDate()
            }
        },

        setDateRangeButtonText: _.debounce(function () {
            this.DateRangeDropDownButton.set("isOpen", false);
            this.DateRangeDropDownButton.set("text", this.DateRangeFilter.get("fromDate") + " - " + this.DateRangeFilter.get("toDate"));
        }, 50),

        onApplyDateRange: function() {
            this.setDateRangeButtonText();
            ReportDataService.set(this.getDateRange());
        },

        setupPreviousPeriod: function() {
            var dataSource = ReportDataService.getDataSource('byMessage:previousPeriod');
            dataSource.on('filtered filter:updated',
                function() {
                    ReportDataService.set('previousPeriodTotals',
                        ReportDataService.calculateTotals('byMessage:previousPeriod'));
                });
        }
    });
});