define(['sitecore', '/-/speak/v1/EDS/edsUtil.js'],
function (sitecore, edsUtil) {
    var defaults = {},
        viewModes = {
            create: {
                title: 'EDS.AddDomain',
                height: 155
            },
            edit: {
                title: 'EDS.EditDomain',
                height: 410
            },
            overview: {
                title: 'EDS.DomainDetails',
                height: 410
            }
        };

    return sitecore.Definitions.App.extend({
	    Service: null,
	    initialized: function () {
	        this.DialogWindow.set('focusOn', '[data-sc-id=NameTextBox]');

	        this.attachHandlers();
	        this.trackChanges();
	    },

	    attachHandlers: function () {
	        this.DialogWindow.viewModel.$el.on('hidden', _.bind(this.cleanUp, this));
	        this.on({
	            'app:loaded': this.triggerLoaded,
	            'domaindialog:hide': this.hideDialog,
	            'domaindialog:submit': this.submitAction,
	            'change:contextItem': this.render
	        }, this);
	    },


		triggerLoaded: function() {
			sitecore.trigger('eds:dialog:loaded', this);
		},

		showDialog: function (options) {
		    this.prepareOptions(options);

		    this.setDialogTitle(this.options.title);

		    this.render();

		    this.DialogWindow.viewModel.$el.one('shown.bs.modal', _.bind(this.initModel, this, this.options.itemId));
		    this.DialogWindow.show();
		},

		prepareOptions: function (options) {
		    this.options = _.extend({}, defaults, options);
		    this.options.itemId = this.options.itemId || '';

		    if (!this.options.mode) {
		        this.options.mode = this.options.itemId || this.options.itemId ? 'overview' : 'create';
		    }

		    this.options = _.extend({}, viewModes[this.options.mode] || {}, this.options);
		    this.options.title = sitecore.Resources.Dictionary.translate(this.options.title);
		},

		hideDialog: function() {
			this.DialogWindow.hide();
		},

		isValidDomain: function () {
            if (edsUtil.domainIsValid(this.NameTextBox.get('text'))) {
                return true;
            } else {
                this.NameTextBox.viewModel.focus();
                this.MessageBar.addMessage('error', sitecore.Resources.Dictionary.translate('EDS.DomainIsInvalid'));
                return false;
            }
		},

		getDomainName: function () {
		    var domainSquareBrackets = /^\[|\]$/ig,
                domainName = $.trim(this.NameTextBox.get('text') || '');

		    return domainName.replace(domainSquareBrackets, '');
		},

		saveSuccess: function () {
		    var contextItem = this.get('contextItem'),
		        message = sitecore.Helpers.string.format(sitecore.Resources.Dictionary
                .translate('EDS.DomainHasBeenAdded'), contextItem.DomainName);

		    this.MessageBar.addMessage('notification', message);
		    this.Service.fetchEntity(decodeURIComponent(contextItem.Id))
                .execute()
                .then(_.bind(function (data) {
                    this.options.mode = 'overview';
                    this.set('contextItem', data);
		            this.animateDialogResize();
                }, this));

		    sitecore.trigger('domain:changed', contextItem);
		},

		saveFail: function (error) {
		    var contextItem = this.get('contextItem'),
		        isNew = contextItem.isNew,
                errorMessage = edsUtil.getErrorMessage(error),
                message;

		    if (errorMessage.length > 0 && errorMessage !== 'Operation failed.') {
		        message = errorMessage;
		    } else {
		        message = isNew ? 'EDS.DomainHasNotBeenAdded' : 'EDS.DomainHasNotBeenUpdated';
		        message = sitecore.Resources.Dictionary.translate(message) +
                    ' ' +
                    sitecore.Resources.Dictionary.translate('EDS.PleaseTryAgainLater');
		    }

		    message = sitecore.Helpers.string.format(message, isNew ? contextItem.DomainName : this.originalName);
		    this.MessageBar.addMessage('error', message);
		},

		saveContextItem: function () {
		    var contextItem = this.get('contextItem');
            contextItem.save()
					.then(_.bind(this.saveSuccess, this))
                    .fail(_.bind(this.saveFail, this))
					.done(_.bind(function () {
					    this.ProgressIndicator.set('isBusy', false);
					}, this));
        },

		submitAction: function() {
			this.SaveButton.set('isEnabled', false);
			this.MessageBar.removeMessages();

			var contextItem = this.get('contextItem');

			if (this.options.mode === 'overview') {
				this.hideDialog();
				return;
			}

			if (!this.isValidDomain()) {
			    return;
			}

			contextItem.DomainName = this.getDomainName();

			var self = this;

			if (contextItem.isValid()) {
				self.ProgressIndicator.set('isBusy', true);
			    this.saveContextItem();
			} else {
				this.NameTextBox.viewModel.focus();
				this.MessageBar.addMessage('error', sitecore.Resources.Dictionary.translate('EDS.ValidationFailed'));
			}
		},

		setDialogTitle: function(titleText) {
			var title = this.DialogWindow.viewModel.$el.find('.sc-dialogWindow-header-title');
			if (title.length) {
				title.text(titleText);
			}
		},

		animateDialogResize: function(height) {
			var dialogElem = this.DialogWindow.viewModel.$el,
				modal = dialogElem.data('modal'),
				modalBody = dialogElem.find('.modal-body'),
                hessageBarHeight = this.MessageBar.viewModel.$el.innerHeight(),
				modalBodyHeight = height || (viewModes[this.options.mode] + hessageBarHeight),
				modalOverflow = $(window).height() - 10 < dialogElem.height();

			var step = null;
			if (!modalOverflow && !modal.options.modalOverflow) {
				step = function() {
					dialogElem.css('margin-top', 0 - dialogElem.height() / 2);
				}
			}

			modalBody.animate({ 'height': modalBodyHeight + 'px' },
				{
					duration: 600,
					step: step,
					complete: function() {
						modalBody.parent().attr('data-height', modalBodyHeight);
						dialogElem.data('height', modalBodyHeight);
						modal.options.height = modalBodyHeight;
						modal.layout();
					}
				}, 'linear');
		},

		cleanUp: function() {
			this.ProgressIndicator.set('isBusy', false);
			this.MessageBar.removeMessages();
			this.set('contextItem', null, { unset: true });
			this.updateValidationImageState();
		},

		initModel: function(itemId) {
			var self = this,
				query;

			this.ProgressIndicator.set('isBusy', true);

			this.Service = edsUtil.getEntityService('EDS/SenderDomain');
			if (itemId) {
				query = this.Service.fetchEntity(decodeURIComponent(itemId)).execute();
			} else {
				query = this.Service.create();
			}

			query.then(function(data) {
					self.set('contextItem', data);
				})
				.fail(function(error) {
					self.set('contextItem', null);

					var errorMessage = edsUtil.getErrorMessage(error);
					if (errorMessage.length > 0) {
						self.MessageBar.addMessage('error', errorMessage);
					}
				})
				.done(function() {
					self.ProgressIndicator.set('isBusy', false);
				});
		},

        renderMode: function() {
            var mode = this.options.mode;
            this.SetupInfoBorder.set('isVisible', mode !== 'create');
            this.HintBorder.set('isVisible', mode === 'create');

            this.DialogWindow.viewModel.$el.find('.modal-body').parent().data('height', this.options.height);

            this.SaveButton.set('text',
				sitecore.Resources.Dictionary.translate(mode === 'overview' ? 'EDS.Ok' : (mode !== 'create' ? 'EDS.Ok' : 'EDS.Next')));
            this.SaveButton.set('isEnabled', mode === 'overview');
            this.SaveButton.set('isVisible', mode !== 'overview');

            this.CancelButton.set('text', sitecore.Resources.Dictionary.translate(mode !== 'create' ? 'EDS.Close' : 'EDS.Cancel'));

            this.NameTextBox.set('isVisible', mode !== 'overview');
            this.NameText.set('isVisible', mode === 'overview');
            var focusButton = mode === 'overview' ? this.SaveButton : this.CancelButton;
            focusButton.viewModel.$el.focus();
        },

        render: function() {
            var contextItem = this.get('contextItem') || { isNew: true };

			this.originalName = contextItem.DomainName;

			// this.validateDnsRecords(contextItem.Id);
			var dnsRecords = { 'DKIM': contextItem.DkimValid };
			this.updateValidationImageState(dnsRecords);

            this.renderMode();

            this.NameTextBox.set('text', contextItem.DomainName);
            this.NameText.set('text', contextItem.DomainName);

			this.DnsTxtRecord1Value.set('text', contextItem.DkimPublicKeyRecord);
			this.HostnameValue.set('text', contextItem.DkimRecord);
        },

		validateDnsRecords: function(id) {
			if (!id || id.length == 0) {
				this.updateValidationImageState(null);
				return;
			}

			var url = this.Service.url + '/' + id + '/ValidateDnsRecords';

			var options = {
				url: url,
				data: { id: id },
				type: 'GET',
				success: $.proxy(this.updateValidationImageState, this),
				error: $.proxy(this.updateValidationImageState, this)
			}

			$.ajax(options);
		},

		updateValidationImageState: function(data) {
			var dkimValidated = data && data['DKIM'] !== undefined;

			this.DkimInfoImage.set('isVisible', !dkimValidated && data != null);
			this.DkimWarningImage.set('isVisible', dkimValidated && data['DKIM'] == false);
			this.DkimValidImage.set('isVisible', dkimValidated && data['DKIM'] == true);
		},

		trackChanges: function() {
			this.NameTextBox.viewModel.$el.on('cut input paste keyup',
				_.bind(function(event) {
					this.updateSaveButtonState(event, this.NameTextBox.viewModel.$el.val(), 'DomainName');
				}, this));
		},

		updateSaveButtonState: function(event, value, property) {
			var contextItem = this.get('contextItem');
			var domainValue = this.NameTextBox.viewModel.$el.val();

			var isEnabled = contextItem !== null &&
			(contextItem[property] !== value ||
				domainValue !== contextItem['DomainName']);

			isEnabled = isEnabled && domainValue.length > 0 && edsUtil.domainIsValid(domainValue);
			this.SaveButton.set('isEnabled', isEnabled);

			if (event && event.keyCode == 13 && isEnabled) {
				this.SaveButton.viewModel.click();
			}
		}
	});
});