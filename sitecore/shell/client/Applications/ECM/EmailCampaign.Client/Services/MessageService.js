define(["/-/speak/v1/ecm/constants.js"], function (constants) {

    var messageService = function () { };
    _.extend(messageService.prototype, {
        messageContext: null
    });

    return new messageService();
});