define([    'sitecore',    'backbone',    '/-/speak/v1/ecm/constants.js',    '/-/speak/v1/ecm/ServerRequest.js',    '/-/speak/v1/ecm/MessageService.js'], function (    sitecore,    backbone,    constants,    ServerRequest,    MessageService    ) {    var ListModel = backbone.Model.extend({
        defaults: {
            Id: null,            Name: '',            Recipients: 0,            IsInUse: false,
            itemId: ''
        },        idAttribute: 'Id'
    });    var Lists = backbone.Collection.extend({
        model: ListModel
    });    var RecipientsService = backbone.Model.extend({
        defaults: {
            availableLists: new Lists([]),            url: null,
            ignoredType: 'Segmented list'
        },

        lists: {
            all: new Lists([]),
            include: new Lists([]),
            exclude: new Lists([])
        },

        listTypes: {
            exclude: '{CCFBB206-497D-4528-9837-C3CDD8E06791}',
            include: '{AAD5DC30-CC86-4988-BAF1-98661B02B79B}'
        },

        initialize: function () {
            this.attachHandlers();
        },

        load: function () {
            this.loadAllLists();
            this.loadListsByType('include');
            this.loadListsByType('exclude');
        },

        attachHandlers: function () {
            var debouncedUpdateAvailable = _.debounce(this.updateAvailable, 100);
            this.lists.include.on('add remove', debouncedUpdateAvailable, this);
            this.lists.exclude.on('add remove', debouncedUpdateAvailable, this);
            this.lists.all.on('add remove', debouncedUpdateAvailable, this);
        },

        loadAllLists: function () {
            ServerRequest(constants.ServerRequests.LIST_MANAGEMENT_LIST, {
                data: {
                    pageSize: 10,                    pageIndex: 1,                    payLoad: 'full',
                    searchExpression: null
                },
                type: 'GET',
                success: _.bind(this.onLoadAllLists, this)
            });
        },

        onLoadAllLists: function (response) {
            if (response.error) {
                return;
            }
            this.lists.all.reset();
            this.lists.all.add(response.Items);
        },

        loadListsByType: function (type) {
            ServerRequest(constants.ServerRequests.RECIPIENT_LISTS,
            {
                data: {
                    messageId: MessageService.messageContext.get('messageId'),
                    type: this.listTypes[type]
                },
                success: _.bind(this.onLoadListByType, this, type),
                async: false
            });
        },

        onLoadListByType: function (type, response) {
            if (response.error) {
                return;
            }
            var lists = response.recipientLists;
            _.each(lists, function (list) {
                if (list.Default) { list.defaultText = sitecore.Resources.Dictionary.translate('ECM.Pages.Recipients.Yes') }
            });
            this.lists[type].reset();
            this.lists[type].add(lists);
        },

        sumIncludeExclude: function() {
            var include = this.lists.include.toJSON(),
                exclude = this.lists.exclude.toJSON();

            return include.concat(exclude);
        },

        updateAvailable: function() {
            var includeExclude = this.sumIncludeExclude(),
                available = this.lists.all.clone();
            available.remove(_.pluck(includeExclude, 'Id'));
            this.set('availableLists', available);
        },

        addList: function (type, list) {
            if (MessageService.messageContext.get('messageType') === constants.MessageTypes.AUTOMATED &&
                list.Type === this.get('ignoredType')) {
                var messagetoAdd = {
                    id: "cannotAddSegmentedList",
                    text: sitecore.Resources.Dictionary.translate("ECM.Recipients.AutomatedMessageCanNotHaveSegmentedList"),
                    actions: [],
                    closable: true
                };
                this.MessageBar.addMessage("error", messagetoAdd);
                return;
            }

            ServerRequest(constants.ServerRequests.ADD_RECIPIENT_LIST,
            {
                data: {
                    messageId: MessageService.messageContext.get('messageId'),
                    recipientListId: list.Id,
                    type: this.listTypes[type]
                },
                success: _.bind(function (response) {
                    if (response.error) {                        return;                    }                    if (response.recipientLists[0].Type === "Segmented list") {                        // Account for segmented lists potentially containing contacts without an email address                        list.Recipients = response.recipientLists[0].Recipients;
                    }
                    this.lists[type].add(list);
                    sitecore.trigger("recipientLists:added");
                    if (response.isUncommittedRead) {
                        sitecore.trigger("notify:recipientList:locked");
                    }
                }, this),
                async: false
            });
        },

        removeList: function (type, listIds) {
            ServerRequest(constants.ServerRequests.REVOME_RECIPIENT_LIST,
            {
                data: {
                    messageId: MessageService.messageContext.get('messageId'),
                    recipientListIds: listIds,
                    type: this.listTypes[type]
                },
                success: _.bind(function (response) {
                    if (response.error) {
                        return;
                    }

                    this.lists[type].remove(listIds);
                    sitecore.trigger('recipientLists:removed');
                }, this)
            });
        }
    });    return new RecipientsService();
});
