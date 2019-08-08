define([], function () {
    var baseAddress = "/sitecore/api/ssc/beacon/service/Beacon/";

    var doGet = function (path, data) {
        return $.ajax({
            url: baseAddress + path,
            data: data,
            headers: {
                "X-RequestVerificationToken": jQuery('[name=__RequestVerificationToken]').val(),
                "X-Requested-With": "XMLHttpRequest"
            }
        });
    }

    return {
        checkScript: function (address) {
            return doGet("Ping", { address: address });
        },
        getScript: function () {
            return doGet("BundleAddress");
        }
    }
});