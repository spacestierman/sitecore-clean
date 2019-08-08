define([    'sitecore',    'backbone',    '/-/speak/v1/ecm/RecipientsService.js'], function (    sitecore,    backbone,    RecipientsService    ) {    return sitecore.Definitions.Models.ControlModel.extend({
        defaults: {            recipientListType: '',
            selectedLists: new backbone.Collection([])
        },        segmentedType: 'Segmented list',        initialize: function () {
            this.attachEventHandlers();        },        attachEventHandlers: function() {            this.on('change:listType', this.onChangeListType, this);        },

        onChangeListType: function () {
            this.set('selectedLists', RecipientsService.lists[this.get('listType')]);
        }
    });
});
