define([
  "sitecore",
  "/-/speak/v1/ecm/AppBase.js",
  "/-/speak/v1/ecm/DataBaseService.js",
  "/-/speak/v1/ecm/DialogService.js",
  "/-/speak/v1/ecm/ServerRequest.js",
  "/-/speak/v1/ecm/constants.js",
  "/-/speak/v1/ecm/FormatterConfigExtension.js",
  "/-/speak/v1/ecm/Cookies.js"
], function (sitecore, appBase, dbService, DialogService, ServerRequest, constants, FormatterConfigExtension) {
  var PageBase = appBase.extend({
    initialized: function () {
      this.bindAjaxErrorMessages();
      this.setTimezoneCookie();
      this.setupFavoriteActionsClick();
      dbService.expectedDatabase('master').fail(this.isMasterDatabaseFail);
      this.extendFormatterConfig();
      if (
         !sessionStorage.managerRootId ||
         sessionStorage.managerRootId === 'null' ||
         sessionStorage.managerRootId === 'undefined'
         ) {
          this.firstrun();
      }
    },

    // Workaround for Date formatting in D3 charts.
    // TODO: Need to remove when migrate to SPEAK 2.
    extendFormatterConfig: function () {
        if (
            window.Sitecore.Speak &&
            window.Sitecore.Speak.D3 &&
            window.Sitecore.Speak.D3.models &&
            window.Sitecore.Speak.D3.models.formatterConfig
            ) {
            _.extend(window.Sitecore.Speak.D3.models.formatterConfig, FormatterConfigExtension);
        }
    },

    isMasterDatabaseFail: function () {
      DialogService.show('confirm', {
        title: sitecore.Resources.Dictionary.translate("ECM.Warning"),
        text: sitecore.Resources.Dictionary.translate("ECM.ThisApplicationRequiresMasterDatabase"),
        buttons: { cancel: { show: false }, close: { show: false } },
        on: {
          ok: function() {
            location.replace('/sitecore/shell/sitecore/client/Applications/Launchpad');
          }
        } 
      });
    },

    bindAjaxErrorMessages: function () {
      if (!this.MessageBar) {
        return;
      }

      sitecore.on('ajax:error', function (message) {
        if (!_.findWhere(this.MessageBar.get('errors'), { text: message.text })) {
          this.MessageBar.addMessage('error', message);
        }
      }, this);
    },

    setTimezoneCookie: function () {
      var timezoneCookie = "utcOffset";
      if (!$.cookie(timezoneCookie)) {
        $.cookie(timezoneCookie, new Date().getTimezoneOffset());
      }
      else {
        var storedOffset = parseInt($.cookie(timezoneCookie));
        var currentOffset = new Date().getTimezoneOffset();
        if (storedOffset !== currentOffset) {
          $.cookie(timezoneCookie, new Date().getTimezoneOffset());
        }
      }
    },

    // Workaround to fix 107140, because SPEAK will not fix it in v.1, SPEAK made fix only for v.2
    setupFavoriteActionsClick: function () {
        var favoriteButtonSelector = '.sc-actioncontrol ul[role=menu] a.btn',
            buttonIconSelector = 'div.sc-icon';
        $(document)
            .on('click',
                favoriteButtonSelector,
                function (e, options) {
                    var target = $(e.target);
                    if (target.is(buttonIconSelector)) {
                        if (options && options.delegateInProgress) {
                            e.stopPropagation();
                        }
                    } else if (target.is(favoriteButtonSelector)) {
                        $(this).find(buttonIconSelector).trigger('click', { delegateInProgress: true });
                    }
                });
    },

    firstrun: function () {
        // check if we should show the dialog or not...
        ServerRequest(constants.ServerRequests.FIRST_USAGE, {
            data: null,
            success: function (response) {
                if (!response.error && response.value) {
                    sessionStorage.managerRootId = response.value;
                    sessionStorage.firstrun = 1;
                    location.reload();
                }
            },
            context: this
        });
    }
  });
  return PageBase;
});