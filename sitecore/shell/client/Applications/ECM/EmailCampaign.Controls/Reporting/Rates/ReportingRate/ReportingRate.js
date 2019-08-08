define([
    "sitecore",
    "/-/speak/v1/ecm/CompositeComponentBase.js",
    "/-/speak/v1/ecm/ReportDataService.js",
    "/-/speak/v1/ecm/MathHelper.js"
], function (sitecore, CompositeComponentBase, ReportDataService, MathHelper) {
    var model = sitecore.Definitions.Models.ControlModel.extend({
        customMetrics: {
            unopen: function(totals) {
                return totals.sent - totals.bounce - totals.uniqueOpen;
            },
            delivered: function (totals) {
                return totals.sent - totals.bounce;
            },
            included: function (totals) {
                return totals.sent + totals.failed;
            }
        },
        getTotal: function(metric, totals) {
            var result;
            if (!totals[metric] && totals[metric] !== 0 && this.customMetrics[metric]) {
                result = this.customMetrics[metric](totals);
            } else {
                result = totals[metric];
            }
            return result;
        },
        getValue: function (totals) {
            var metricValue = this.getTotal(this.get('metric'), totals),
                denominator = this.get('denominator');

            if (denominator) {
                var denominatorValue = this.getTotal(denominator, totals),
                    percentage = this.get('percentage');
                if (percentage) {
                    return MathHelper.percentage(metricValue, denominatorValue) + '%';
                } else {
                    return new Number(MathHelper.divide(metricValue, denominatorValue, 2));
                }
            } else {
                return metricValue;
            }
        }
    });

    var view = CompositeComponentBase.view.extend({
        childComponents: [
            'ScoreCard'
        ],
        initialize: function() {
            this._super();
            this.model.set('metric', this.$el.data('sc-metric'));
            this.model.set('percentage', this.$el.data('sc-percentage'));
            this.model.set('denominator', this.$el.data('sc-denominator'));
            this.attachHandlers();
            this.update();
        },
        attachHandlers: function() {
            ReportDataService.on('change:totals', this.update, this);
        },
        update: function () {
            var totals = ReportDataService.get('totals');
            this.children.ScoreCard.set('value', this.model.getValue(totals));
        }
    });

    return sitecore.Factories.createComponent("ReportingRate", model, view, ".sc-ReportingRate");
});