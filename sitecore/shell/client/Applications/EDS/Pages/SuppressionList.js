define([
	'sitecore', 
	'/-/speak/v1/EDS/CommonListPage.js', 
	'/-/speak/v1/EDS/edsUtil.js',
    '/-/speak/v1/ecm/ServerRequest.js'
],
function(sitecore, commonListPage, edsUtil, ServerRequest) {
	var suppressionListPageCode = commonListPage.extend({
		dialogIds: {
			AddSuppressionDialog: '{45CE126C-E8CA-4301-A290-5E1DE404B8F3}',
			ConfirmationDialog: '{86C43DD0-471D-441A-AD14-AB75CBD40D40}',
			ExportSuppressionDialog: '{9F2696F0-DCE0-4039-97D1-1558CAE61C03}'
		},
		actionIds: {
			removeId: '0FD46520D2F048899D1470A868EC5610',
			exportId: '0293FE032BF64343B342CA04FBD48E0E'
		},
		initialized: function() {
			this._super();
			this.on({
					'app:loaded': this.appLoaded,
					'suppression:add': this.addSuppression,
					'suppression:remove': this.removeSuppression,
					'suppression:export': this.exportSuppressionList
				},
				this);

			sitecore.on({ 'suppression:changed': this.suppressionChanged },
				this);

			this.SuppressionListControl.on('change:items change:checkedItemIds', this.updateActionsState, this);
		},

		appLoaded: function() {
			this.SearchTextBox.viewModel.$el.find('input').focus();
		},

		updateActionsState: function() {
			var items = this.SuppressionListControl.get('items');
			var hasItems = items && items.length > 0;
			var itemIds = this.SuppressionListControl.get('checkedItemIds');

			edsUtil.setActionState(this.SuppressionActionControl,
				this.actionIds.removeId,
				hasItems && itemIds && itemIds.length > 0);
			edsUtil.setActionState(this.SuppressionActionControl, this.actionIds.exportId, hasItems);
		},

		addSuppression: function() {
			edsUtil.showDialog(this.LoadOnDemandPanel, this.dialogIds.AddSuppressionDialog, null);
		},

		removeSuppression: function() {
			var checkedItemIds = this.SuppressionListControl.get('checkedItemIds');

			if (checkedItemIds) {
				var dialogText = sitecore.Resources.Dictionary.translate('EDS.YouAreAboutToDeleteCheckedEmails') +
					'\r\n\r\n' +
					sitecore.Resources.Dictionary.translate('EDS.DoYouWantToContinue');

				var hasCompleted = false;
				var dialogParams = {
					title: sitecore.Resources.Dictionary.translate('EDS.AreYouSure'),
					text: dialogText,
					dialogType: 'delete',
					callback: _.bind(function() {
                        var supressionDelete = 'EDS/Suppression/Suppression/Delete',
                            firstCheckedId = checkedItemIds[0];

						setTimeout(_.bind(function(id) {
							if (!hasCompleted) {
								var message = {
									id: 'deleteinprogress' + id,
									text: '',
									actions: [],
									closable: true
								};
								message.text = sitecore.Resources.Dictionary.translate('EDS.CheckedEmailAddressesAreBeingDeleted');
								this.MessageBar.addMessage('notification', message);
							}
						},
						this, firstCheckedId), 500);
                            
                        ServerRequest(supressionDelete + '?' + $.param({ids: checkedItemIds}), {
                            type: 'DELETE',
                            success: _.bind(function (id) {
                                hasCompleted = true;
	                            sitecore.trigger('suppression:changed', null, 'delete');
	                            this.SuppressionListControl.set('checkedItemIds', []);
                                this.MessageBar.removeMessage(function(oldMessage) {
									return oldMessage.id === 'deleteinprogress' + id;
								});
                            }, this, firstCheckedId),
                            error: _.bind(function(xhr) {
                                var message = {
                                    id: 'fetcherror' + checkedItemIds,
                                    text: xhr.statusText,
                                    actions: [],
                                    closable: false
								};
								this.MessageBar.addMessage('error', message);
                            }, this)
                        });
					},
					this)};

				edsUtil.showDialog(this.LoadOnDemandPanel, this.dialogIds.ConfirmationDialog, dialogParams);
			};
		},

		exportSuppressionList: function(e) {
			var options = e.exportOptions || {}
			options.contextApp = this;
			edsUtil.showDialog(this.LoadOnDemandPanel, this.dialogIds.ExportSuppressionDialog, options);
		},

		suppressionChanged: function(suppression, operation) {
			var message = {
				text: '',
				actions: [],
				closable: true
			};

			if (operation == 'add') {
				message.text = sitecore.Resources.Dictionary.translate('EDS.TheEmailAddressHasBeenAddedToTheSuppressionList');
				message.text = sitecore.Helpers.string.format(message.text, suppression.Email);
			} else if (operation == 'delete') {
				message.text = sitecore.Resources.Dictionary.translate('EDS.CheckedEmailAddressesHaveBeenDeleted');
			}

			this.MessageBar.addMessage('notification', message);

			this.SuppressionDataSource.refresh();
			this.SuppressionListControl.set('selectedItemId', '');
		}
	});

	return suppressionListPageCode;
});