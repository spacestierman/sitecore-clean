define([
  'sitecore',
  '/-/speak/v1/ecm/GlobalValidationService.js',
  '/-/speak/v1/ecm/ServerRequest.js',
  '/-/speak/v1/ecm/MessageService.js',
  '/-/speak/v1/ecm/RecipientsService.js',
  '/-/speak/v1/ecm/constants.js'
], function (
  sitecore,
  GlobalValidationService,
  ServerRequest,
  MessageService,
  RecipientsService,
  Constants
  ) {
    return {
    validateMessageVariantsSubject: function (variants) {
      /*
       * Validation of message variants should not block message from saving, it only should block message from dispatching
       * That is why needed to validate message variants silently and trigger validation message event manually,
       * to not polute validation model with unnecessary errors. (Legacy behavior)
       */
      for (var index in variants) {
        if (!GlobalValidationService.validate(variants[index].subject, {
          required: { silent: true }
        })) {
          GlobalValidationService.trigger('validation:input:error', {
            id: 'variantSubjectRequired',
            text: sitecore.Resources.Dictionary.translate("ECM.Pages.Message.TheSubjectFieldIsEmpty")
          });
          return false;
        }
      }
      GlobalValidationService.trigger('validation:input:success', { id: 'variantSubjectRequired' });
      return true;
    },

    validateImageResources: function (variants) {
        for (var index in variants) {
            if (variants[index].isResourceError) {
                GlobalValidationService.trigger('validation:input:error', {
                    id: 'imagesAreNotAvailable',
                    text: sitecore.Resources.Dictionary.translate("ECM.Pages.Message.ImagesAreNotAvailable")
                });
                return false;
            }
        }
        GlobalValidationService.trigger('validation:input:success', { id: 'imagesAreNotAvailable' });
        return true;
    },

        validateRecipients: function () {
            var isValid = GlobalValidationService.validate(null,
                {
                    recipientsSelected: {
                        method: _.bind(function () {
                            return !!RecipientsService.lists.include.length;
                        }, this),
                        silent: true
                    }
                }
            );

            if (isValid) {
                GlobalValidationService.trigger('validation:input:success', { id: 'includedRecipientsRequired' });
                return true;
            } else {
                GlobalValidationService.trigger('validation:input:error',
                    {
                        id: 'includedRecipientsRequired',
                        text: sitecore.Resources.Dictionary.translate("ECM.Pages.Message.PleaseSelectIncludeList")
                    });
                return false;
            }

        },

        validateBrokenLinks: function () {
            var defer = $.Deferred(),
                messageId = MessageService.messageContext.get('messageId');

            ServerRequest(Constants.ServerRequests.VALIDATE_BROKEN_LINKS, {
                data: { messageId: messageId },
                success: function (response) {
                    if (!response.error) {
                        defer.resolve(response.value);
                    } else {
                        defer.reject();
                    }
                },
                type: 'GET'
            });

            return defer.promise();
        }

    };
});