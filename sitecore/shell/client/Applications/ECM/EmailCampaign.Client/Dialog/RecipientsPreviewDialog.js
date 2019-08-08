define([
        'sitecore',
        '/-/speak/v1/ecm/MessageTokenService.js',
        '/-/speak/v1/ecm/DialogBase.js',
        '/-/speak/v1/ecm/RecipientsService.js'
    ],
    function(
        sitecore,
        MessageTokenService,
        DialogBase,
        RecipientsService
    ) {
        return DialogBase.extend({
            attachHandlers: function() {
                this._super();
                this.on({
                        'add:attachment:dialog:close': this.hideDialog,
                        'action:message:recipients:search': this.onRecipientsSearch
                    },
                    this);
            },

            onRecipientsSearch: function() {
                this.RecipientPreviewDataSource.set('search', this.RecipientPreviewSearchButtonTextBox.get('text'));
            },

            getPersonalizationContactId: function() {
                var personalizationContactId = this.RecipientPreviewListControl.get('selectedItemId');
                this.personalizationContactId = personalizationContactId !== '' ? personalizationContactId : null;
                return this.personalizationContactId;
            },

            getContactSource: function () {
                var contactSource = this.RecipientPreviewListControl.get('selectedItem').get("source");
                this.contactSource = contactSource !== '' ? contactSource : null;
                return this.contactSource;
            },

            getContactIdentifier: function () {
                var contactIdentifier = this.RecipientPreviewListControl.get('selectedItem').get("identifier");
                this.contactIdentifier = contactIdentifier !== '' ? contactIdentifier : null;
                return this.contactIdentifier;
            },

            ok: function() {
                var personalizationContactId = this.getPersonalizationContactId();
                var contactSource = this.getContactSource();
                var contactIdentifier = this.getContactIdentifier();

                sitecore.trigger('change:personalizationRecipientId',
                (personalizationContactId) ? ('xdb:' + personalizationContactId) : null);

                sitecore.trigger('change:contactSource',
                    (contactSource) ? (contactSource) : null);

                sitecore.trigger('change:contactIdentifier',
                    (contactIdentifier) ? (contactIdentifier) : null);

                sitecore.trigger('action:previewRecipientSelected',
                    this.RecipientPreviewListControl.get('selectedItem'));

                MessageTokenService.set('context',
                {
                    managerRootId: sessionStorage.managerRootId,
                    contactId: personalizationContactId,
                    source: contactSource,
                    identifier: contactIdentifier
                });
                this._super();
            },

            showDialog: function(options) {
                this._super(options);

                this.RecipientPreviewSearchButtonTextBox.set('text', null);
                this.RecipientPreviewDataSource.set('search', null);

                this.RecipientPreviewDataSource.set('loadRecipients', true);
                this.RecipientPreviewDataSource.set('messageId', options.data.messageContext.get('messageId'));
                this.RecipientPreviewDataSource.set('recipientLists', RecipientsService.lists['include'].toJSON());
                this.RecipientPreviewDataSource.refreshRecipients();
            }
        });
    });