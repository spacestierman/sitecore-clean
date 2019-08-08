define([
  "sitecore",
  'backbone',
  'underscore',
  "/-/speak/v1/ecm/constants.js",
  "/-/speak/v1/ecm/MessageReport.js",
  '/-/speak/v1/ecm/ReportDataService.js',
  '/-/speak/v1/ecm/ChartHelper.js',
  '/-/speak/v1/ecm/MessageService.js',
  '/-/speak/v1/ecm/MathHelper.js'
], function (
  sitecore,
  backbone,
  _,
  Constants,
  MessageReport,
  ReportDataService,
  ChartHelper,
  MessageService,
  MathHelper
  ) {
    var CampaignReportLists = [
            "OpenClickRatesList",
            "TimeOfDayList",
            "BouncedList",
            "UsubscribedList",
            "SpamList"
        ],
        /*
         * detailedReports is used for binding bottomLinks on reports to appropriate tab
         * key is the name of the report
         * value is the ID of the tab
         */
        detailedReports = {
            RecipientActivityReportExtended: '{AB68349D-59D1-48C2-B089-0AE20D272425}',
            LandingPagesReport : '{33701CC6-64F7-433B-801F-715E41413314}',
            ValueAndVisitsReportExtended: '{4D80512B-EBFD-4565-9E5F-42398A77D5F5}'
        };

    var messageReport = MessageReport.extend({
        getDateRange: function () {
            var dateRange = { dateTo: new Date() },
                d = $.Deferred();
            if (this.MessageContext.get('startTime')) {
                dateRange.dateFrom = this.MessageContext.get('startTime');
                d.resolve(dateRange);
            } else {
                var onChangeStartTime = function () {
                    dateRange.dateFrom = this.MessageContext.get('startTime');
                    this.MessageContext.off('change:startTime', onChangeStartTime);
                    d.resolve(dateRange);
                };

                this.MessageContext.on('change:startTime', onChangeStartTime, this);
            }

            return d.promise();
        },
        initialized: function() {
            this._super();
            MessageService.messageContext = this.MessageContext;
            this.getDateRange()
                .done(_.bind(function (dateRange) {
                    ReportDataService.set(_.extend({
                        managerRootId: this.EmailManagerRoot.get('managerRoot').id,
                        messageId: this.MessageContext.get('messageId')
                    }, dateRange));
                }, this));

            this.dataSource = ReportDataService.getDataSource('byUrl');
            this.attachHandlers();
            this.updateDetailedLinks();
        },

        attachHandlers: function() {
            this.CampaignReportTabControl.on('change:selectedTab', function () {
                ChartHelper.updateCharts(this);
                this.updateHiddenProgressIndicators();
            }, this);
            this.EventListsSubTabs.on('change:selectedTab', function () {
                this.updateHiddenProgressIndicators();
            }, this);
            this.dataSource.on('filter:updated filtered', this.reCalculate, this);
        },

        findDetailedLinks: function () {
	        var reports = [];
            _.each(this, function (child) {
                if (child && child.componentName && child.attributes.name.indexOf('CardHyperlinkButton') >= 0) {
                    reports.push(child);
                }
            });

            return reports;
        },

        updateDetailedLinks: function () {
            var links = this.findDetailedLinks(),
                detailedReportsName = _.keys(detailedReports),
                tabIds = _.values(detailedReports);

            _.each(links, function (link) {
	            _.each(detailedReportsName, function(report, index) {
		            if (link.attributes.name.indexOf(report) >= 0) {
			            link.viewModel.$el.on('click',
				            _.bind(function() {
                                this.CampaignReportTabControl.set('selectedTab', tabIds[index]);
                            }, this));
		            }
	            }, this);
            }, this);
        },

        updateHiddenProgressIndicators: function() {
            _.each(CampaignReportLists, _.bind(function(listName) {
                this[listName].viewModel.toggleProgressIndicator();
            }, this));
        },

        getUrlGroup: function () {
            return this.dataSource.dimension('url').group({
                click: { $sum: 'visits' },
                value: '$sum',
				uniqueClick: { $sum: 'count' },
                visits: '$sum'
            });
        },

        reCalculate: function () {
	        this.urlGroup = this.getUrlGroup();

            this.setMostClicked();
			this.setMostValuable();
			this.setMostRelevant();
	        this.setMostUniqueClicks();
			this.setMosAttentiont();
        },

        emptyItem: function () {
            return {
                key: '',
                value: {}
            }
        },

        setLinkTitle: function (card, key) {
            this[card + 'LinkValue'].viewModel.$el.attr('title', key || '');
        },

        setMostClicked: function () {
            var mostClicked = this.urlGroup.orderBy('click').top(1)[0] || this.emptyItem();
            
			if (mostClicked.value.click) {
                this.MostClickedScoreCard.set('value', { title: mostClicked.key, url: mostClicked.key });
				this.setLinkTitle('MostClickedScoreCard', mostClicked.key);
                this.MostClickedScoreCard.set('description', mostClicked.value.click + ' ' +
                    sitecore.Resources.Dictionary.translate('ECM.Reporting.Clicks'));
            }
        },

		setMostValuable: function () {
            var mostValuable = this.urlGroup.order(function (group) {
					return new Number(MathHelper.divide(group.value, group.click));
				}).top(1)[0] || this.emptyItem(),
				valuePerVisit = new Number(MathHelper.divide(mostValuable.value.value, mostValuable.value.click, 2));
            
			if (valuePerVisit > 0) {
                this.MostValuableScoreCard.set('value', { title: mostValuable.key, url: mostValuable.key });
                this.setLinkTitle('MostValuableScoreCard', mostValuable.key);
                this.MostValuableScoreCard.set('description', valuePerVisit + ' ' +
                    sitecore.Resources.Dictionary.translate("ECM.Reporting.ValuePerVisit"));
            }
        },

        setMostRelevant: function () {
            var mostRelevant = this.urlGroup.orderBy('value').top(1)[0] || this.emptyItem();

            if (mostRelevant.value.value) {
                this.MostRelevantScoreCard.set('value', { title: mostRelevant.key, url: mostRelevant.key });
                this.setLinkTitle('MostRelevantScoreCard', mostRelevant.key);
                this.MostRelevantScoreCard.set('description', mostRelevant.value.value + ' ' +
                    sitecore.Resources.Dictionary.translate("ECM.Reporting.Value"));
            }
        },

        setMostUniqueClicks: function () {
            var mostUniqueClicks = this.urlGroup.orderBy('uniqueClick').top(1)[0] || this.emptyItem();
            
			if (mostUniqueClicks.value.click) {
                this.MostUniqueClicksScoreCard.set('value', { title: mostUniqueClicks.key, url: mostUniqueClicks.key });
                this.setLinkTitle('MostUniqueClicksScoreCard', mostUniqueClicks.key);
                this.MostUniqueClicksScoreCard.set('description', mostUniqueClicks.value.uniqueClick + ' ' +
                    sitecore.Resources.Dictionary.translate('ECM.Reporting.UniqueClicks'));
            }
        },

		setMosAttentiont: function () {
			var mostAttention = this.urlGroup.orderBy('click').top(1)[0] || this.emptyItem();

            if (mostAttention.value.visits) {
                this.MostAttentionClicksScoreCard.set('value', { title: mostAttention.key, url: mostAttention.key });
                this.setLinkTitle('MostAttentionClicksScoreCard', mostAttention.key);
                this.MostAttentionClicksScoreCard.set('description', mostAttention.value.visits + ' ' +
                    sitecore.Resources.Dictionary.translate("ECM.Reporting.Visits"));
            }
		}
});


  return messageReport;
});