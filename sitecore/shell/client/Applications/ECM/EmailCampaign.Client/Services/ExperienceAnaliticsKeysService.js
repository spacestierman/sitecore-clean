define([
    '/-/speak/v1/ecm/ServerRequest.js',
    '/-/speak/v1/ecm/constants.js'
], function (
    ServerRequest,
    constants
) {
    var defaultParams = {
        messageId: '',
        managerRootId: ''
    },
    ExperienceAnaliticsKeysService = function () { },
        keys = [];
    _.extend(ExperienceAnaliticsKeysService.prototype, {
        getKey: function(params) {
            var defer = $.Deferred();
            if (params && params.managerRootId) {
                var keyExist = this.findKey(params);
                if (keyExist) {
                    defer.resolve(keyExist.key);
                } else {
                    ServerRequest(constants.ServerRequests.EXPERIENCE_ANALYTICS_KEY, {
                        type: "GET",
                        data: _.extend({}, defaultParams, params),
                        success: _.bind(function (response) {
                            if (!response.error) {
                                keys.push({ key: response.value, params: params });
                                defer.resolve(response.value);
                            } else {
                                defer.reject(response.error);
                            }
                        }, this)
                    });
                }
            } else {
                defer.resolve(null);
            }

            return defer.promise();
        },

        findKey: function(params) {
            return _.find(keys, function(key) {
                return _.isEqual(key.params, params);
            });
        }
    });
    return new ExperienceAnaliticsKeysService();
});