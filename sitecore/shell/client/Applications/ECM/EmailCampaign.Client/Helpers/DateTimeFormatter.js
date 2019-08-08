require.config({
    paths: {
        moment: "/sitecore/shell/client/Speak/Assets/lib/ui/1.1/deps/moment/moment.min"
    }
});

define(["/sitecore/api/ssc/EXM/DateTimeInfo", "moment"], function (dateTimeInfo, moment) {
    var DateTimeFormatter = {
        info: dateTimeInfo,
        formatHourAmPm: function(hour) {
            hour = Number(hour);
            if (dateTimeInfo["HourPattern"] === "H" || dateTimeInfo["HourPattern"] === "HH" || dateTimeInfo["AMDesignator"] === "") {
                return moment(hour, "HH").format(dateTimeInfo["HourPattern"] + ":mm");
            }

            var amPm;
            if (hour >= 12) {
                amPm = dateTimeInfo.PMDesignator;
            } else {
                amPm = dateTimeInfo.AMDesignator;
            }

            return moment(hour, "HH").format(dateTimeInfo["HourPattern"]) + " " + amPm;
        },
        utcToLocalHour: function (hour) {
            if (dateTimeInfo.DisplayDatesInUtc) {
                return hour;
            }

            var utcOffset = dateTimeInfo.UtcOffset.split(":");

            // Seeing as we don't know the full DateTime, we are limited to adding or subtracting hours
            var hourOffset = Number(utcOffset[0]);
            hour = hour + hourOffset;
            if (hour >= 24) {
                hour -= 24;
            } else if (hour < 0) {
                hour += 24;
            }

            return hour;
        },

        getUtcOffset: function () {
            if (dateTimeInfo.UtcOffset === "00:00:00") {
                return ' (UTC)';
            }

            var utcOffset = dateTimeInfo.UtcOffset.split(":");
            var sign;
            if (utcOffset[0].startsWith('-')) {
                sign = '';
            } else {
                sign = '+';
            }

            return ' (UTC ' + sign + utcOffset[0] + ':' + utcOffset[1] + ')';
        }
    };

    return DateTimeFormatter;
});