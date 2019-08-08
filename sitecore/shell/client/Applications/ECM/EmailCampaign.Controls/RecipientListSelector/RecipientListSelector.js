define([
    'sitecore',
    '/-/speak/v1/ecm/CompositeComponentBase.js',
    '/-/speak/v1/ecm/RecipientListModel.js',
    '/-/speak/v1/ecm/DialogService.js',
    '/-/speak/v1/ecm/ServerRequest.js',
    '/-/speak/v1/ecm/MessageValidationService.js',
    '/-/speak/v1/ecm/MessageService.js',
    '/-/speak/v1/ecm/RecipientsService.js',
    '/-/speak/v1/ecm/constants.js'
], function (
    sitecore,
    CompositeComponentBase,
    RecipientListModel,
    DialogService,
    ServerRequest,
    MessageValidationService,
    MessageService,
    RecipientsService,
    Constants
    ) {
    var view = CompositeComponentBase.view.extend({
        childComponents: [
            'Expander',
            'AdvancedComboBox',
            'NoLists',
            'ListControl',
            'Actions'
        ],

        actionIds: {
            remove: '70E50F8B48DD4AB7BAE8A3AA0C3B625C',
            advancedOptions: 'C4F17D3A189544C58A3446C333B0BCFB',
            listFromFile: 'BCD67EDCE3464BBC85E78BC251EA360A'
        },

        initialize: function () {
            this._super();
            this.initActions();
            this.attachHandlers();
            this.model.set("listType", this.$el.data("sc-listtype"));
            this.updateCombobox();
        },

        afterRender: function () {
            this.updateSelectedLists();
        },

        attachHandlers: function () {
            RecipientsService.on('change:availableLists', this.updateCombobox, this);
            this.model.on({
                'change:selectedLists': this.onChangeSelectedLists,
                'change:isEnabled': function () {
                    _.each(this.children, _.bind(function (child) {
                        child.set('isEnabled', this.model.get('isEnabled'))
                    }, this));
                }
            }, this);
            this.children.ListControl.on({
                'change:items': this.onChangeListItems,
                'change:checkedItems': this.onChangeListCheckedItems
            }, this);
            this.children.AdvancedComboBox.on('change:selectedValue', _.bind(this.onChangeSelectedValue, this));

        },

        updateCombobox: function () {
            this.children.AdvancedComboBox.set('items', RecipientsService.get('availableLists').toJSON());
        },

        onChangeListCheckedItems: function () {
            var actions = this.children.Actions.get('actions'),
                checkedItems = this.children.ListControl.get('checkedItems');

            _.each(actions, _.bind(function (action) {
                if (action.id() === this.actionIds.remove) {
                    action[checkedItems.length ? 'enable' : 'disable']();
                }
            }, this));
        },

        onChangeListItems: function (list) {
            if (list) {
                this.children.NoLists.set('isVisible', !list.get('items').length);
                list.set('isVisible', !!list.get('items').length);
            }
        },

        onChangeSelectedValue: function (combobox) {
            if (combobox.get('selectedItem')) {
                this.pushSelectedItems(combobox.get('selectedItem'));
                combobox.set('selectedItem', null);
                combobox.set('selectedValue', null);
            }
        },

        initActions: function() {
            var actions = this.children.Actions.get('actions');
            for (var index in actions) {
                var action = actions[index];
                if ($.type(action.id) === 'function') {
                switch(action.id()) {
                    case this.actionIds.remove:
                        action.click = _.bind(this.removeLists, this);
                        break;
                    case this.actionIds.advancedOptions:
                        action.click = _.bind(this.openAdvancedOptions, this);
                        break;
                    case this.actionIds.listFromFile:
                        action.click = _.bind(this.openListFromFile, this);
                        break;
                }
                }
            }
        },

        removeLists: function() {
            var listsToRemove = this.children.ListControl.get('checkedItems'),
                ids;

            ids = _.pluck(listsToRemove, 'Id');
            RecipientsService.removeList(this.model.get('listType'), ids);
            this.children.ListControl.set('checkedItems', []);
            this.children.ListControl.set('checkedItemIds', []);
        },

        openAdvancedOptions: function () {
        	var callback = _.bind(function (selectedItemId, selectedItem) {
		        this.pushSelectedItems(selectedItem);
            }, this);

        	DialogService.get('selectList').done(_.bind(function (dialog) {
	            var selectedLists = RecipientsService.sumIncludeExclude();
	            dialog.ListsSearchButtonTextBox.set('text', null);
        	    // TODO remove url replacement when PBI #194843 will be implemented
	            var replaceUrl = Constants.ServerRequestPrefix.EXM + Constants.ServerRequests.LIST_MANAGEMENT_LIST;
	            dialog.DialogListsDataSource.set("url", replaceUrl);
                dialog.DialogListsDataSource.set('searchExpression', null);
                dialog.showDialog({
                    callback: callback,
                    excludelists: _.pluck(selectedLists, 'Id')
                });
            }, this));
        },

        openListFromFile: function () {
            var callback = _.bind(function (id) {
                RecipientsService.lists.all.once('add', _.bind(function () {
                    RecipientsService.addList(this.model.get('listType'), RecipientsService.lists.all.get(id).toJSON());
                }, this));
                RecipientsService.load();
            }, this);

            DialogService.get('importWizard').done(_.bind(function (dialog) {
                dialog.showDialog({
                    callback: callback
                });
            }, this));
        },

        pushSelectedItems: function (item) {
            RecipientsService.addList(this.model.get('listType'), item);
            this.model.get('selectedLists').add(item);
        },

        getSelectedList: function() {
            var listControl = this.children.ListControl;

            if (!listControl.get("selectedItemId") && listControl.get("checkedItemIds").length !== 1) {
                return;
            }

            var list = listControl.get("checkedItems").length === 1 ?
                listControl.get("checkedItems")[0]:
                listControl.get("selectedItem");

            if (list.type === "Segmented list") {
                return;
            }

            return list;
        },

        resetListControlState: function () {
            this.children.ListControl.set('checkedItemIds', []);
            this.children.ListControl.set('checkedItems', []);
            this.children.ListControl.trigger('change:items');
        },

        onChangeSelectedLists: function () {
            var prevSelectedLists = this.model.previous('selectedLists'),
                selectedLists = this.model.get('selectedLists');
            if (prevSelectedLists) {
                prevSelectedLists.off(null, null, this);
            }
            if (selectedLists) {
                selectedLists.on('add remove', this.updateSelectedLists, this);
            }
        },

        updateSelectedLists: function () {
            this.children.ListControl.set('items', this.model.get('selectedLists').toJSON());
        }
    });

    return sitecore.Factories.createComponent('RecipientListSelector', RecipientListModel, view, '.sc-exm-RecipientListSelector');
});