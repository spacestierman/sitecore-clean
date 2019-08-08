// TODO: Re-factor to use DialogBase
define([
    "sitecore",
    'jquery',
    "/-/speak/v1/ecm/guidGenerator.js",
    "/-/speak/v1/ecm/DialogService.js",
    "/-/speak/v1/ecm/DialogBase.js"
], function(
    sitecore,
    $,
    guidGenerator,
    DialogService,
    DialogBase
) {
    return DialogBase.extend({
        initialized: function() {
            this._super();
            this.defaults.notify = true;
        },

        ok: function() {
            this.Ok.viewModel.disable();
            this.addList()
                .done(_.bind(function(listId) {
                    this.onAddListDone(listId);
                }, this));
        },

        validateFields: function() {
            if (!this.ListNameTextBox.get("text")) {
                this.showError({
                    id: "listNameIsEmpty",
                    Message: sitecore.Resources.Dictionary.translate("ECM.Recipients.AddEmptyRecipientList")
                });
                return false;
            }
            return true;
        },

        addList: function() {
            var listName = this.ListNameTextBox.get("text"),
                defer = $.Deferred();

            if (this.validateFields()) {
                var listId = guidGenerator.getGuid(),
                    token = sitecore.Helpers.antiForgery.getAntiForgeryToken();
    
                $.ajax({
                    beforeSend: function (request) {
                        request.setRequestHeader(token.headerKey, token.value);
                    },
                    url: "/sitecore/api/ssc/ListManagement/ContactList",
                    data: {
                        Id: listId,
                        Name: listName,
                        Owner: "",
                        Description: this.ListDescriptionTextArea.get("text"),
                        Type: "Contact list",
                        Source: "{\"IncludedLists\":[" + (this.existingList ? JSON.stringify(this.existingList) : "") + "],\"ExcludedLists\":[]}"
                    },
                    error: function(jqXHR) {
                        defer.reject(jqXHR);
                    },
                    success: function() {
                        defer.resolve(listId);
                    },
                    type: "POST"
                });
            } else {
                this.Ok.viewModel.enable();
                defer.reject();
            }

            return defer.promise();
        },

        showDialog: function(options) {
            this._super(options);

            var setFocus = _.bind(function() {
                if (this.ListNameTextBox.viewModel.$el.is(':visible')) {
                    this.ListNameTextBox.viewModel.$el.focus();
                } else
                    setTimeout(setFocus, 100);
            }, this);
            setTimeout(setFocus, 100);
            // bootstrap dialog set focus on the div after showing, so we need also handle focus on div not to loose focus
            this.DialogWindow.viewModel.$el.focus(setFocus);
        },

        notify: function() {
            sitecore.trigger("listManager:listCreated");
        },

        resetMessageBar: function() {
            this.MessageBar.removeMessage(function(error) { return error.id === "listNameIsEmpty"; });
        },

        resetDefaults: function() {
            this._super();
            this.resetMessageBar();
            this.ListDescriptionTextArea.set("text", "");
            this.ListNameTextBox.set("text", "");
            this.Ok.viewModel.enable();
        },

        onAddListDone: function(listId) {
            if (this.options.data) {
                this.options.on.ok(this.options.data.messageId, listId, this.options.data.recipientListType);
            }
            this.hideDialog();
            this.resetDefaults();
            if (this.options.notify) {
                this.notify();
            }
        }

    });
});