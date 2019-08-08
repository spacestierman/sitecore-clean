define([
    'sitecore',
    '/-/speak/v1/ecm/TimeOfDayReportBase.js',
    "/-/speak/v1/ecm/DateTimeFormatter.js"
], function (sitecore, TimeOfDayReportBase, DateTimeFormatter) {
    var model = TimeOfDayReportBase.model.extend({
        reCalculate: function () {
            var group = this.getHourGroup(),
                data = group.orderBy(this.get('eventType')).top(1);
            if (data && data.length) {
                data[0].key = DateTimeFormatter.utcToLocalHour(data[0].key);
                this.set('bestTimeOfDay', data[0]);
            }
        }
    });

    var view = TimeOfDayReportBase.view.extend({
        childComponents: [
            'ScoreCard'
        ],
        initialize: function () {
            this._super();
            this.model.set('description', this.$el.data('sc-description'));
            this.attachHandlers();
            this.update();
        },
        attachHandlers: function () {
            this.model.on('change:bestTimeOfDay', this.update, this);
        },
        update: function () {
            var bestTimeOfDay = this.model.get('bestTimeOfDay');

            if (bestTimeOfDay) {
                var hour = Number(bestTimeOfDay.key),
                    visits = bestTimeOfDay.value[this.model.get('eventType')];
                var timePeriod = DateTimeFormatter.formatHourAmPm(hour);
                timePeriod += ' - ';
                if (hour === 23) {
                    timePeriod += DateTimeFormatter.formatHourAmPm(0);
                } else {
                    timePeriod += DateTimeFormatter.formatHourAmPm(hour + 1);
                }

                timePeriod += DateTimeFormatter.getUtcOffset();

                this.children.ScoreCard.set('value', timePeriod);
                this.children.ScoreCard.set(
                    'description',
                    visits +
                    ' ' + this.model.get('description')
                );
            }
        }
    });

    return sitecore.Factories.createComponent("TimeOfDayRate", model, view, ".sc-TimeOfDayRate");
});