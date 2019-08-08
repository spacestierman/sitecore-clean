define([
    "sitecore",
    "jquery",
    "/-/speak/v1/ecm/ReportingListDataModel.js",
    "/-/speak/v1/ecm/DateTimeFormatter.js"
], function (
    sitecore,
    $,
    ReportingListDataModel,
    DateTimeFormatter
    ) {

    var dayNames = [
        "ECM.DayNames.Sunday",
        "ECM.DayNames.Monday",
        "ECM.DayNames.Tuesday",
        "ECM.DayNames.Wednesday",
        "ECM.DayNames.Thursday",
        "ECM.DayNames.Friday",
        "ECM.DayNames.Saturday"];

    var TimeOfDayListModel = ReportingListDataModel.extend({
        initialize: function () {
            this._super();
            _.each(dayNames, function (day, key) {
                dayNames[key] = sitecore.Resources.Dictionary.translate(day);
            });
        },
        processDataItem: function (item) {
            this.setDayName(item);
            this.setHourRange(item);
            this._super(item);
        },
        setDayName: function (item) {
            item.dayOfWeek = dayNames[item.dayOfWeek];
        },
        setHourRange: function (item) {
            item._hour = item.hour;

            item.hour = DateTimeFormatter.formatHourAmPm(item._hour) + " - ";
            if (item._hour === 23) {
                item.hour += DateTimeFormatter.formatHourAmPm(12);
            } else {
                item.hour += DateTimeFormatter.formatHourAmPm(item._hour + 1);
            }

            item.hour += DateTimeFormatter.getUtcOffset();
        }
    });

    /* test-code */
    TimeOfDayListModel._dayNames = dayNames;
    /* end-test-code */

    return TimeOfDayListModel;
});