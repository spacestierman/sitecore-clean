define([
    "sitecore",
    "/-/speak/v1/ecm/ReportingRate.js",
    "/-/speak/v1/ecm/ReportDataService.js",
    "/-/speak/v1/ecm/MathHelper.js"
], function (sitecore, ReportingRate, ReportDataService, MathHelper) {
    var model = ReportingRate.model.extend({
        getPrevPeriodComparison: function () {
            var totals = ReportDataService.get('totals'),
                previousPeriodTotals = ReportDataService.get('previousPeriodTotals');

            if (previousPeriodTotals) {
                var prevMetricTotal = this.getTotal(this.get('metric'), previousPeriodTotals),
                    currentMetricTotal = this.getTotal(this.get('metric'), totals),
                    prevDenominatorTotal = this.getTotal(this.get('denominator'), previousPeriodTotals),
                    currentDenominatorTotal = this.getTotal(this.get('denominator'), totals),
                    prevValue = MathHelper.percentage(prevMetricTotal, prevDenominatorTotal),
                    currentValue = MathHelper.percentage(currentMetricTotal, currentDenominatorTotal),
                    // Need to perform additional rounding to prevent javascript specific rounding errors.
                    //  Such as: 1.01-1.00 = 0.010000000000000009
                    percentage = Math.abs(parseFloat((currentValue - prevValue).toFixed(2))),
                    type,
                    text;

                switch (true) {
                    case currentValue > prevValue:
                        type = 'positive';
                        text = percentage + '% ' + sitecore.Resources.Dictionary.translate("ECM.Reporting.HigherThanPreviousPeriod").toLowerCase();
                        break;
                    case currentValue < prevValue:
                        type = 'negative';
                        text = percentage + '% ' + sitecore.Resources.Dictionary.translate("ECM.Reporting.LowerThanPreviousPeriod").toLowerCase();
                        break;
                    default:
                        type = 'neutral';
                        text = percentage + '% ' + sitecore.Resources.Dictionary.translate("ECM.Reporting.NoChange").toLowerCase();
                }

                return { type: type, percentage: percentage, text: text };
            }
            return {};
        }
    });

    var view = ReportingRate.view.extend({
        childComponents: [
            'ScoreCard'
        ],
        initialize: function() {
            this._super();
            this.model.set('description', this.$el.data('sc-description'));
            this.model.set('showPreviousPeriod', this.$el.data('sc-showpreviousperiod'));
            this.attachHandlers();
            this.update();
        },
        attachHandlers: function() {
            ReportDataService.on('change:totals', this.update, this);
            if (this.model.get('showPreviousPeriod')) {
                var debouncedUpdatePreviousPeriod = _.debounce(this.updatePreviousPeriod, 50);
                ReportDataService.on('change:previousPeriodTotals change:totals', debouncedUpdatePreviousPeriod, this);
            }
        },
        update: function () {
            this._super();
            var totals = ReportDataService.get('totals'),
                eventTotal = this.model.getTotal(this.model.get('metric'), totals);

            this.children.ScoreCard.set(
                'description',
                eventTotal +
                ' ' + this.model.get('description')
            );
        },
        updatePreviousPeriod: function() {
            var prevPeriodComparison = this.model.getPrevPeriodComparison(this.model.get('eventType'));

            this.children.ScoreCard.set('comparisonType', prevPeriodComparison.type);
            this.children.ScoreCard.set('comparisonText', prevPeriodComparison.text);
        }
    });

    return sitecore.Factories.createComponent("RecipientActivityRate", model, view, ".sc-RecipientActivityRate");
});