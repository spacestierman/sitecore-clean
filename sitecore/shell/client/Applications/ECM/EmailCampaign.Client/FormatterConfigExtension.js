define(['/-/speak/v1/ecm/MathHelper.js', "/-/speak/v1/ecm/DateTimeFormatter.js"], function (MathHelper, DateTimeFormatter) {
    var defaults = {
        maximumFractionDigits: 2
    };

    var sc = window.Sitecore || {};
    sc.Speak = sc.Speak || {};
    sc.Speak.D3 = sc.Speak.D3 || {};
    sc.Speak.D3.models = sc.Speak.D3.models || {};

    return (function(models) {
        return {
            dateFormatter: function(options) {
                return function(value) {
                    return $.datepicker.formatDate('M yy', value);
                };
            },

            numberFormatter: function(options) {
                return function(value) {
                    value = value || 0;
                    if (options.style === "percent") {
                        value = parseFloat((value * 100).toFixed(options.maximumFractionDigits)) + '%';
                    } else {
                        /* SPEAK 1 does not contain data formating templates, as result 
                         *    it's impossible to pass options into formatting methods, 
                         *    so was decided to have global formatting for all charts in ExM.
                         *    For float numbers needed only 2 digits after dot.
                         */
                        value = MathHelper.abbreviateNumber(value, defaults.maximumFractionDigits);
                    }

                    return value;
                };
            },

            metricsFormatter: function(options) {
                return function (value) {
                    if (options.numberScale === 'Time:AMPM') {
                        return DateTimeFormatter.formatHourAmPm(value);
                    }
                };
            }
        }
    })(sc.Speak.D3.models);
});