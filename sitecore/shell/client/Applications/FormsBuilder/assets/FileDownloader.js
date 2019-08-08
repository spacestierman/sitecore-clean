(function (speak) {
    define(["jquery"], function ($) {
        var fileDownloader = {
            getCookieValue: function (name) {
                var cookie = document.cookie,
                    cookieArray = cookie.split(';');

                for (var i = 0; i < cookieArray.length; i++) {
                    var cookieItem = cookieArray[i].trim().split('=');

                    if (cookieItem[0] === name) {
                        return cookieItem[1];
                    }
                }

                return null;
            },

            download: function (baseUrl, options, onSuccessCallback, onErrorCallback, context) {
                var hiddenIFrameId = 'hiddenDownloader',
                  iframe = $('#' + hiddenIFrameId);
                if (iframe.length === 0) {
                    iframe = $("<iframe>", {
                        "id": hiddenIFrameId,
                        "style": "display:none;",
                        "height": "0",
                        "width": "0"
                    });

                    $('body').append(iframe);
                }

                iframe.attr('src', baseUrl + "?" + $.param(options));

                var cookieName = 'fileDownloadToken' + options.token;

                var fileDownloadCheckTimer = window.setInterval(function () {
                    var cookieValue = this.getCookieValue(cookieName);
                    if (cookieValue) {
                        window.clearInterval(fileDownloadCheckTimer);

                        // expire the cookie
                        var cookieString = cookieName + "=; expires=" + new Date(new Date().getTime() - 1000).toUTCString() + "; path=/;";
                        document.cookie = cookieString;

                        if (cookieValue === options.token.toString()) {
                            onSuccessCallback.call(context, options);
                        } else {
                            onErrorCallback.call(context, options, cookieValue);
                        }
                    }
                }.bind(this), 300);
            }
        };

        return fileDownloader;
    });
})(Sitecore.Speak);