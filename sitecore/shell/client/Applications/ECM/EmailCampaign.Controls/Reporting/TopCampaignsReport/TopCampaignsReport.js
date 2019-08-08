define([
    'sitecore',
    '/-/speak/v1/ecm/ReportingBlockBaseTabs.js',
    '/-/speak/v1/ecm/ChartDataConversionService.js',
    '/-/speak/v1/ecm/MathHelper.js',
    '/-/speak/v1/ecm/constants.js'
], function (
    sitecore,
    ReportingBlockBaseTabs,
    ChartDataConversionService,
    MathHelper,
    Constants
) {
    var model = ReportingBlockBaseTabs.model.extend({
        defaults: {
            dataSourceName: 'byMessage'
        },
        reCalculate: function() {
            this.messageGroup = this.getMessageGroup();
            this.set('recipientActivity', this.getRecipientActivity());
            this.set('valueAndVisits', this.getValueAndVisits());
            this.set('mostEngaging', this.getMostEngaging());
        },

        getMessageGroup: function() {
            return this.get('dataSource').dimension('messageName').group({
                open: { $sum: 'visits', condition: { event: Constants.Reporting.Events.OPEN } },
                click: { $sum: 'visits', condition: { event: Constants.Reporting.Events.CLICK } },
                uniqueOpen: { $sum: 'count', condition: { event: Constants.Reporting.Events.OPEN } },
                uniqueClick: { $sum: 'count', condition: { event: Constants.Reporting.Events.CLICK } },
                value: '$sum',
                messageId: '$any'
            });
        },

        getRecipientActivity: function() {
            return this.messageGroup.order(function(group) {
                return group.click + group.open;
            }).top(5);
        },

        getValueAndVisits: function() {
            return this.messageGroup.orderBy('value').top(5);
        },

        getMostEngaging: function() {
            return this.messageGroup.orderBy('uniqueClick').top(5);
        }

    });

    var view = ReportingBlockBaseTabs.view.extend({
        childComponents: [
            'Tabs',
            'TabContent0',
            'TabContent1',
            'TabContent2',
            'BarChart',
            'ValueAndVisitsListControl',
            'MostEngagingListControl'
        ],

        attachHandlers: function () {
            this._super();
            this.model.on({
                'change:recipientActivity': this.updateRecipientActivity,
                'change:valueAndVisits': this.updateValueAndVisits,
                'change:mostEngaging': this.updateMostEngaging
            }, this);
        },

        convertDataToValueAndVisits: function (data) {
            return _.map(
                data,
                function(item) {
                    return {
                        url: sitecore.Helpers.url.addQueryParameters(Constants.URLs.MessageReport, {id: item.value.messageId}),
                        DisplayName: item.key,
                        Value: item.value.value,
                        ValuePerVisit: new Number(MathHelper.divide(item.value.value, item.value.click, 2)),
                    };
                }
            );
        },

        convertDataToMostEngaging: function (data) {
            return _.map(
                data,
                function (item) {
                    return {
                        url: sitecore.Helpers.url.addQueryParameters(Constants.URLs.MessageReport, { id: item.value.messageId }),
                        DisplayName: item.key,
                        UniqueClicks: item.value.uniqueClick,
                        UniqueOpens: item.value.uniqueOpen
                    };
                }
            );
        },

        convertToChartData: function(data) {
            return ChartDataConversionService.convert(
                    data,
                    { keys: [ 'click', 'open'] }
                );
        },

        updateRecipientActivity: function () {
            var recipientActivity = this.model.get('recipientActivity'),
                chartData = [];

            if (recipientActivity && recipientActivity.length) {
                chartData = this.convertToChartData(recipientActivity);
            }

            this.children.BarChart.set("dynamicData", chartData);
        },

        updateValueAndVisits: function () {
            this.children.ValueAndVisitsListControl.set("items", this.convertDataToValueAndVisits(this.model.get('valueAndVisits')));
        },

        updateMostEngaging: function() {
            this.children.MostEngagingListControl.set('items', this.convertDataToMostEngaging(this.model.get('mostEngaging')));
        }
    });

    return sitecore.Factories.createComponent("TopCampaignsReport", model, view, ".sc-TopCampaignsReport");
});