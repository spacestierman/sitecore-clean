define([
  "sitecore",
  "jquery",
  "/-/speak/v1/ecm/constants.js"
], function (
  sitecore,
  $,
  constants
) {
  var validators = {
    required: {
      method: function (value) {
        return (value && value.length) > 0;
      }
    },

    trimRequired: {
      method: function (value) {
        return validators.required.method($.trim(value));
      }
    },

    emailRemote: {
      method: function(value, params, input, message) {
        return this.validate(value, {
          remote: {
            requestParams: {
              url: constants.ServerRequestPrefix.EXM + constants.ServerRequests.VALIDATE_EMAIL_ADDRESS,
              type: 'GET',
              async: false,
              data: { emailAddress: value }
            },
            message: message
          }
        }, input);
      },
      silent:true
    },

    fromReplyToEmailRemote: {
        method: function (value, params, input, message) {
            return this.validate(value, {
                remote: {
                    requestParams: {
                        url: constants.ServerRequestPrefix.EXM + constants.ServerRequests.VALIDATE_FROM_REPLY_TO_EMAIL_ADDRESS,
                        type: 'GET',
                        async: false,
                        data: { emailAddress: value }
                    },
                    message: message
                }
            }, input);
        },
        silent: true
    },

    emailListRemote: {
        method: function (value, params, input, message) {
            validators.emailListRemote.message = null;
            var result = this.validate(value,
                {
                    trimRequired: {
                        message: sitecore.Resources.Dictionary
                            .translate("ECM.Pages.Message.YouMustEnterAtLeastOneEmailAddressInNotificationField")
                    }
                },
                input);

            if (result) {
                var emails = value.split(","),
                    index = 0,
                    messageReplacedToken;

                while (result && index < emails.length) {
                    var email = $.trim(emails[index]);
                    index++;
                    messageReplacedToken = message.replace(/\{0\}/gi, email);
                    result = this.validate(email,
                        {
                            required: {
                                message: sitecore.Resources.Dictionary
                                    .translate("ECM.Pages.Message.InNotificationFieldUseOneCommaBetweenEmail")
                            }
                        },
                        input);
                    if (result) {
                        result = validators.emailRemote.method.call(this, email, params, input, messageReplacedToken);
                    } else {
                        validators.emailListRemote.message = sitecore.Resources.Dictionary
                            .translate("ECM.Pages.Message.InNotificationFieldUseOneCommaBetweenEmail");
                    }
                }
            }
            
            return result;
        },
        silent:true
    },

    url: {
      method: function (value) {
        return /^(http|https){1}\:\/\/(([a-zA-Z0-9][a-zA-Z0-9\-]{0,61}[a-zA-Z0-9]?)\.)*([a-zA-Z0-9][A-Za-z0-9\-]{0,61}[A-Za-z0-9]?)(:\d{2,5})?(\/[a-zA-Z0-9][A-Za-z0-9\-]{0,61}[A-Za-z0-9]?)*(\/{1})?$/.test(value);
      }
    },

    expression: {
      method: function (value, params) {
        var re = new RegExp(params.expression);
        return re.test(value);
      }
    },

    minLength: {
      method: function (value, params) {
        return typeof value === "string" && value.length >= params.min;
      }
    },

    maxLength: {
      method: function (value, params) {
        return typeof value === "string" && value.length <= params.max;
      }
    },

    summaryMax: {
      method: function (values, params) {
        var textSummary = values.join('');
        return validators.maxLength.method(textSummary, params);
      }
    },
    numMin: {
      method: function(value, params) {
        return typeof value === 'number' && value >= params.min;
      }
    },
    numMax: {
      method: function(value, params) {
        return typeof value === 'number' && value <= params.max;
      }
    },

    // EXM specific rules
    nameIsValid: {
      method: function (value, params, input) {
        params = _.extend({ max: 100 }, (params || {}));
        return this.validate(value,
          {
            required: {
              message: sitecore.Resources.Dictionary.translate("ECM.Pipeline.Validate.NameRequired")
            },
            trimRequired: {
              message: sitecore.Resources.Dictionary.translate("ECM.Pipeline.Validate.NameTrimRequired")
            },
            expression: {
              message: sitecore.Resources.Dictionary.translate("ECM.Pipeline.Validate.IsNotValidName").replace(/\{0\}/gi, value),
              params: params
            },
            maxLength: {
              message: sitecore.Resources.Dictionary.translate("ECM.Pipeline.Validate.NameMaxLength"),
              params: params
            }
          }, input);
      },
      silent: true
    }
  },

  messages = {
    default: ''
  };

  var ValidatorsService = {
    validators: validators,
    messages: messages,
    addMessages: function(messages) {
      $.extend(true, ValidatorsService.messages, messages);
    },
    addValidators: function (validators) {
      $.extend(true, ValidatorsService.validators, validators);
    }
  }

  return ValidatorsService;
});