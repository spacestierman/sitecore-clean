define([
    'sitecore',
    '/-/speak/v1/ecm/CompositeComponentBase.js',
    '/-/speak/v1/ecm/ReportDataService.js',
    '/-/speak/v1/ecm/constants.js'
], function (sitecore, CompositeComponentBase, ReportDataService, constants) {
    var model = sitecore.Definitions.Models.ControlModel.extend({
        initialize: function() {
            this.dataSource = ReportDataService.getDataSource('byHour');
            this.attachHandlers();
        },
        attachHandlers: function() {
            this.dataSource.on('filter:updated filtered', this.reCalculate, this);
        },

        getHourGroup: function() {
            var eventTypes = this.get('eventType').split('|'),
                groupConfig = {};
            _.each(eventTypes,
                function(eventType) {
                    groupConfig[eventType] = {
                        $sum: 'visits',
                        condition: { event: constants.Reporting.Events[eventType.toUpperCase()] }
                    };
                });

            return this.dataSource.dimension('hour').group(groupConfig);
        }
    });

    var view = CompositeComponentBase.view.extend({
        initialize: function () {
            this._super();
            this.model.set('eventType', this.$el.data('sc-eventtype'));
        }
    });

    return { model: model, view: view };
});