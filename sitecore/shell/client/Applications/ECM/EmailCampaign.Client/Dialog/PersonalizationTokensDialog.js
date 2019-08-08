define([
    'sitecore',
    '/-/speak/v1/ecm/MessageTokenService.js',
    '/-/speak/v1/ecm/DialogBase.js'
], function (
    sitecore,
    MessageTokenService,
    DialogBase
    ) {
    return DialogBase.extend({
        showDialog: function(options) {
            this.InsertTokensDialogListControl.set('selectedItemId', null);
	        this._super(options);
        },

        ok: function() {
	        if (this.InsertTokensDialogListControl.get('selectedItemId')) {
	            MessageTokenService.set('selectedToken', this.InsertTokensDialogListControl.get('selectedItemId'));
                MessageTokenService.trigger('tokenSelected');
            }

            this._super();
        }
    });
});