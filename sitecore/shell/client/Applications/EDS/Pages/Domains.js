define(["sitecore", "/-/speak/v1/EDS/CommonListPage.js", "/-/speak/v1/EDS/edsUtil.js"],
function(sitecore, commonListPage, edsUtil) {
	var domainsPageCode = commonListPage.extend({
	    dialogIds: {
	        AddEditSenderDomainDialog: "{45533D6B-F03C-44BE-A4ED-7D099040C638}",
	        ConfirmationDialog: "{86C43DD0-471D-441A-AD14-AB75CBD40D40}",
	        SendingDomainsDialog: '{4B7A8312-8001-4D4F-8AE4-0C9A52574895}'
	    },
	    actionIds: {
	        removeId: "6E3AD1F14DCE4F98A4FCA305E7F72354",
	        overview: "2B4C6711DC534294B7DED5A0B834AD6F"
	    },
	    initialized: function () {
	        this._super();
	        this.LoadOnDemandPanel.on('change:isBusy',
	            function() {
	                console.log('isBusy:', this.LoadOnDemandPanel.get('isBusy'));
	            },
	            this);
	        this.on({
	            "app:loaded": this.appLoaded,
	            "domain:add": this.addDomain,
	            "domain:delete": this.deleteDomain,
	            "domain:overview": this.showDetails
	        }, this);

	        sitecore.on({
	            "domain:changed": this.domainChanged
	        }, this);

	        this.SenderDomainListControl.on({
	            "change:items change:selectedItemId": this.updateActionsState
	        }, this);

	        this.SenderDomainDataSource.on("itemsChanging", this.updateIcons, this);
	    },

		appLoaded: function() {
			this.SearchTextBox.viewModel.$el.find("input").focus();
		},

		updateActionsState: function() {
			var items = this.SenderDomainListControl.get("items");
			var hasItems = items && items.length > 0;
			var itemId = this.SenderDomainListControl.get("selectedItemId");

			edsUtil.setActionState(this.SenderDomainActionControl,
				this.actionIds.overview,
				hasItems && itemId && itemId.length > 0);
			edsUtil.setActionState(this.SenderDomainActionControl,
				this.actionIds.removeId,
				hasItems && itemId && itemId.length > 0);
		},

		updateIcons: function(items) {
			var validIcon = this.ValidImage.get("imageUrl");
			var notValidIcon = this.NotValidImage.get("imageUrl");
			_.each(items,
				function(item) {
					item.SpfValidIcon = item.SpfValid ? validIcon : notValidIcon;
					item.DkimValidIcon = item.DkimValid ? validIcon : notValidIcon;
				});
		},

		addDomain: function() {
			edsUtil.showDialog(this.LoadOnDemandPanel, this.dialogIds.AddEditSenderDomainDialog, null);
		},

		deleteDomain: function() {
			var selectedItem = this.SenderDomainListControl.get("selectedItem"),
				self = this;

			if (selectedItem) {
			    var dialogText = sitecore.Resources.Dictionary.translate("EDS.Notifications.YouAreAboutToDeleteDomain") +
					"\r\n\r\n" +
					sitecore.Resources.Dictionary.translate("EDS.DoYouWantToContinue");
				dialogText = sitecore.Helpers.string.format(dialogText, selectedItem.get("DomainName"));

				var hasCompleted = false;
				var dialogParams = {
				    title: sitecore.Resources.Dictionary.translate("EDS.AreYouSure"),
					text: dialogText,
					dialogType: "delete",
					callback: _.bind(function() {
							var service = edsUtil.getEntityService("EDS/SenderDomain");
							var itemId = selectedItem.get("itemId");
							service.fetchEntity(itemId)
								.execute()
								.then(function(domain) {
									self.MessageBar.removeMessage(function(oldMessage) { return oldMessage.id === "fetcherror" + itemId; });

									setTimeout(function() {
										if (!hasCompleted) {
											var message = {
												id: "deleteinprogress" + domain.Id,
												text: "",
												actions: [],
												closable: true
											};
											message.text = sitecore.Resources.Dictionary.translate("EDS.Notifications.TheDomainIsBeingDeleted");
											message.text = sitecore.Helpers.string.format(message.text, domain.DomainName);
											self.MessageBar.addMessage("notification", message);
										}
									}, 5000);

									domain.destroy()
										.then(function() {
											self.MessageBar.removeMessage(function(oldMessage) { return oldMessage.id === "deleteerror" + domain.Id; });
											sitecore.trigger("domain:changed", domain, "delete");
										})
										.fail(function(error) {
											var message = {
												id: "deleteerror" + domain.Id,
												text: "",
												actions: [],
												closable: false
											};
											var errorMessage = edsUtil.getErrorMessage(error);
											if (errorMessage.length > 0 && errorMessage !== "Operation failed.") {
												message.text = errorMessage;
											} else {
											    message.text = sitecore.Resources.Dictionary.translate("EDS.Notifications.TheDomainHasNotBeenDeleted") +
													" " +
													sitecore.Resources.Dictionary.translate("EDS.PleaseTryAgainLater");
											}

											message.text = sitecore.Helpers.string.format(message.text, domain.DomainName);

											self.MessageBar.removeMessage(function(oldMessage) { return oldMessage.id === "deleteerror" + domain.Id; });
											self.MessageBar.addMessage("error", message);
										})
										.done(function() {
											hasCompleted = true;
											self.MessageBar.removeMessage(function(oldMessage) {
												return oldMessage.id === "deleteinprogress" + domain.Id;
											});
										});
								})
								.fail(function(error) {
									var errorMessage = edsUtil.getErrorMessage(error);
									if (errorMessage.length > 0) {
										var message = {
											id: "fetcherror" + itemId,
											text: errorMessage,
											actions: [],
											closable: false
										};
										self.MessageBar.addMessage("error", message);
									}
								});
						},
						this)
				};

				edsUtil.showDialog(this.LoadOnDemandPanel, this.dialogIds.ConfirmationDialog, dialogParams);
			};
		},

		showDetails: function () {
		    if (this.SenderDomainListControl.get('hasSelectedItem')) {
		        var selectedItem = this.SenderDomainListControl.get('selectedItem');
		        edsUtil.showDialog(this.LoadOnDemandPanel, this.dialogIds.AddEditSenderDomainDialog, {
		            mode: 'overview',
                    itemId: selectedItem.get('itemId')
		        });
		    }
		},

		domainChanged: function(domain, operation) {

			if (operation && operation.length > 0) {
				var message = {
					text: "",
					actions: [],
					closable: true
				};
				switch (operation) {
				case "add":
				    message.text = sitecore.Resources.Dictionary.translate("EDS.DomainHasBeenAdded");
					break;
				case "delete":
				    message.text = sitecore.Resources.Dictionary.translate("EDS.Notifications.TheDomainHasBeenDeleted");
					break;
				}

				if (message.text && message.text.length > 0) {
					message.text = sitecore.Helpers.string.format(message.text, domain.DomainName);
					this.MessageBar.addMessage("notification", message);
				}
			}
			this.SenderDomainDataSource.refresh();
			this.SenderDomainListControl.set("selectedItemId", "");
		}
	});

	return domainsPageCode;
});