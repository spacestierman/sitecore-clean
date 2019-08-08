define([], function () {
    var DateHelper = {
        duration: {
            day: 24 * 60 * 60 * 1000
        },
        daysBetween: function (date1, date2) {
            return Math.round(Math.abs((date1.getTime() - date2.getTime()) / (DateHelper.duration.day)));
        },
        addDays: function(date, days) {
            var dateOffset = DateHelper.duration.day * days;
            date.setTime(date.getTime() + dateOffset);
        },
        subtractDays: function(date, days) {
            var dateOffset = DateHelper.duration.day * days;
            date.setTime(date.getTime() - dateOffset);
        }
        
    };
    return DateHelper;
});