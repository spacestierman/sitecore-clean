(function (Speak) {
    var cultureNameUrl = '/sitecore/api/ma/currentCulture';

    Speak.component(['jquery'], function ($) {
        return {
            contentLanguage: null,
            initialized: function () {
                this.initPlans();
            },

            getContentLanguage: function() {
                var defer = $.Deferred();
                var self = this;
                if (!this.contentLanguage) {
                    $.get(cultureNameUrl)
                        .success(function(res) {
                            self.contentLanguage = res;
                            defer.resolve(res);
                        })
                        .fail(function(res) { defer.reject(res) });
                } else {
                    defer.resolve(this.contentLanguage);
                }
                return defer.promise();
            },

            initPlans: function () {
                var isActive = parseInt(this.el.getAttribute('data-ma-isActive')),
                    params = {};

                switch (isActive) {
                    case 0:
                        params.isActive = false;
                        break;

                    case 1:
                        params.isActive = true;
                        break;
                }

                this.getLanguageAndInitDataSource(params);
            },

            getLanguageAndInitDataSource: function(params) {
                this.getContentLanguage()
                    .done($.proxy(function(res) {
                            params["cultureName"] = res;
                            this.initDataSource(params);
                        },
                        this))
                    .fail($.proxy(function() {
                            params["cultureName"] = Speak.Context.current().language;
                            this.initDataSource(params);
                        },
                        this));
            },

            initDataSource: function (params) {
                var dataSourceUrl = this.el.getAttribute('data-ma-serviceurl'),
                    serviceUrl = Speak.Helpers.url.addQueryParameters(dataSourceUrl, params);

                this.GenericDataSource.ServiceUrl = serviceUrl;

                this.GenericDataSource.on('change:DynamicData', function (campaigns) {
                    this.formatDateTimeProperties(campaigns);
                    this.ListControl.reset(campaigns);
                }, this);
            },

            formatDateTimeProperties: function (campaigns) {
                var dateTimeProperties = ['createdDate', 'lastModifiedDate'];

                campaigns.forEach(function (campaign) {
                    dateTimeProperties.forEach(function (dateTimeProperty) {
                        campaign[dateTimeProperty] = this.convertToBasicIsoFormat(campaign[dateTimeProperty]);
                    }, this);
                }, this);
            },

            //Converts the date-time from yyyy-MM-ddThh:mm:ssZ (ISO extended format) 
            // to yyyyMMddThhmmss (ISO basic format) because SPEAK supports the basic format only
            convertToBasicIsoFormat: function (extendedIsoDateTime) {
                //1. Remove the trailing Z to show date-time in UTC
                var basicIsoDateTime = extendedIsoDateTime.substr(0, extendedIsoDateTime.length - 1);

                //2. Remove dashes
                basicIsoDateTime = basicIsoDateTime.replace(/-/g, '');

                //3. Remove colons
                basicIsoDateTime = basicIsoDateTime.replace(/:/g, '');

                return basicIsoDateTime;
            }
        };
    }, 'AutomationCampaignList');
})(Sitecore.Speak);
