define([
    'sitecore', 
    'underscore',
    '/-/speak/v1/EDS/CommonListPage.js', 
    '/-/speak/v1/ecm/ServerRequest.js'
],
function(
    sitecore, 
    _,
    CommonListPage,
    ServerRequest
) {
	var constants = {
		URLs: {
			subscription: 'EDS/Subscription'
		}
	},

	subscriptionPageCode = CommonListPage.extend({
		initialized: function() {
			this._super();

            this.attachHandlers();
            this.loadSubscriptionInformation();
		},

        attachHandlers: function () {
	        this.UsageDataSource.on('change:items', this.onChangeUsageItems, this);
        },

        onChangeUsageItems: function() {
		    var items = this.UsageDataSource.get('items'),
                converted = {
                    'key': 'Visits',
			        values: []
		        };

		    _.each(items, _.bind(function(item, index) {
			    converted.values[index] = {
				    x: item.MonthName + ' ' + item.Year, 
                    y: item.Consumption
			    };
		    }, this));
            this.UsageColumnChart.set('dynamicData', [converted]);
	    },

        loadSubscriptionInformation: function () {
            ServerRequest(constants.URLs.subscription, {
                type: 'GET',
                async: true,
                success: _.bind(this.loadSubscriptionInformationSuccess, this)
            });
        },

        loadSubscriptionInformationSuccess: function (response) {
            this.LicenseDataText.set('text', response.LicenseId);
            this.CustomerDataText.set('text', response.CustomerName);
            var perMonthText = sitecore.Resources.Dictionary.translate("EDS.PerMonth").toLowerCase();
            this.EmailsDataText.set('text', response.Emails + " " + perMonthText);
            var period = response.Emails > 1 ? 'EDS.Months' : 'EDS.Month';
            this.TermDataText.set('text', response.Term + ' ' + sitecore.Resources.Dictionary.translate(period));
        }

	});

	return subscriptionPageCode;
});