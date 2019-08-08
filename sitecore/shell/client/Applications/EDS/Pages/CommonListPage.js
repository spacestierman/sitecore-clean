define(["sitecore", "/-/speak/v1/EDS/edsUtil.js", "/-/speak/v1/ecm/ListPageBase.js"],
function(sitecore, edsUtil, listPageBase) {
	var commonListPage = listPageBase.extend({
		initialized: function() {
			this._super();

			$(document).off("ajaxError").on("ajaxError", edsUtil.handleAjaxError);

			sitecore.on({
				"error:accessdenied": this.showAccessDenied,
				"error:unavailable": this.showError,
				"error:general": this.showError
			}, this);
		},

		showAccessDenied: function() {
			var dialogParams = {
			    title: sitecore.Resources.Dictionary.translate("EDS.NoAccessRights"),
			    text: sitecore.Resources.Dictionary.translate("EDS.Notifications.YouDoNotHaveTheNecessaryAccessRights"),
				dialogType: "warning",
				alertMode: true,
				callback: function() {
					location.replace("/sitecore/shell/sitecore/client/Applications/Launchpad");
				}
			};

			edsUtil.showDialog(this.LoadOnDemandPanel, this.dialogIds.ConfirmationDialog, dialogParams);
		},

		showError: function(jqXHR) {
			var errorText = edsUtil.getPropertyValue(jqXHR, "responseText", "Message") ||
				sitecore.Resources.Dictionary.translate("ECM.WeAreVerySorryButThereHasBeenAProblem");
			if (errorText.length > 0) {
				var errorMessage = {
					id: jqXHR.status || "generalerror",
					text: errorText,
					actions: [],
					closable: false
				};

				this.MessageBar.removeMessage(function(oldMessage) {
					return oldMessage.id === errorMessage.id && oldMessage.text === errorMessage.text;
				});
				this.MessageBar.addMessage("error", errorMessage);
			}
		},

		updateCustomHeadersCompleted: function(success) {
			this.MessageBar.removeMessage(function(oldMessage) {
				return oldMessage.id === "getcustomheaders" || oldMessage.id === "updatecustomheaders";
			});

			if (success) {
				var successMessage = {
					id: "updatecustomheaders",
					text: sitecore.Resources.Dictionary.translate("EDS.Notifications.TheCustomHeadersHaveBeenUpdated"),
					actions: [],
					closable: true,
					temporary: true
				};

				this.MessageBar.addMessage("notification", successMessage);
			} else {
				var errorMessage = {
					id: "updatecustomheaders",
					text: sitecore.Resources.Dictionary.translate("EDS.Notifications.TheCustomHeadersHaveNotBeenUpdated"),
					actions: [],
					closable: false
				};

				this.MessageBar.addMessage("error", errorMessage);
			}
		}
	});

	return commonListPage;
});