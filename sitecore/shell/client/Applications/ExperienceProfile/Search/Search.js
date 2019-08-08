define(["sitecore", "../Common/DataProviderHelper.js", "/-/speak/v1/experienceprofile/CintelUtl.js"], function (sc, providerHelper, cintelUtil) {
    var textProperty = "text";
    var isVisibleProperty = "isVisible";

    var contactsPath = "/contacts";
    var baseUrl = "/sitecore/api/ao/v1" + contactsPath + "/";

    var app = sc.Definitions.App.extend({
        _pageSize: 0,
        initialized: function () {
            this._pageSize = this.SearchDataProvider.get('pageSize');
            var searchTable = "search";

            providerHelper.setupHeaders([
                { urlKey: contactsPath + "/" + searchTable + "?", headerValue: "default" }
            ]);

            providerHelper.initProvider(this.SearchDataProvider, "ContactSearchResults", baseUrl + searchTable, this.SearchMessageBar);
            providerHelper.subscribeAccordionHeader(this.SearchDataProvider, this.ResultsAccordion);
            providerHelper.subscribeSorting(this.SearchDataProvider, this.SearchResults);
            providerHelper.setDefaultSorting(this.SearchDataProvider, "visitCount", true); ////// 

            var searchText = decodeURIComponent(cintelUtil.getQueryParam(textProperty));
            this.SearchTextBox.set(textProperty, searchText);
            this.setDefaultDate();
            this.toggleFiltersVisibility();
            this.findContacts();

            cintelUtil.removeBreadCrumbLastLink(this.Breadcrumb);
            this.SearchResults.on("change:items", cintelUtil.removeMailLink, this.SearchResults);
            this.on('getMoreData', this.getMoreData, this);
        },
        setDefaultDate: function () {
            var defaultDate = new Date();
            var fromDate = new Date(defaultDate.getFullYear(), defaultDate.getMonth(), defaultDate.getDate());

            fromDate.setDate(fromDate.getDate() - 30);
            fromDate = fromDate.getFullYear().toString() +
                this.getMonth(fromDate.getMonth()) +
                this.getDate(fromDate.getDate());

            defaultDate = new Date();
            var toDate = new Date(defaultDate.getFullYear(), defaultDate.getMonth(), defaultDate.getDate());
            toDate = toDate.getFullYear().toString() +
                this.getMonth(toDate.getMonth()) +
                this.getDate(toDate.getDate());

            this.FromDatePick.set("date", fromDate);
            this.ToDatePick.set("date", toDate);
        },
        getMonth: function (month) {
            var result;
            if ((month + 1).toString().length === 2)
                result = month + 1;
            else
                result = "0" + (month + 1);
            return result;
        },
        getDate: function (date) {
            var result;
            if (date.toString().length === 2)
                result = date;
            else
                result = "0" + (date);
            return result;
        },
        findContacts: function () {
            var match = this.SearchTextBox.get(textProperty) || "*";

            if (!this.ResultsBorder.get(isVisibleProperty)) {
                this.ResultsBorder.viewModel.show();
            }

            history.pushState(null, null, "search?text=" + encodeURIComponent(match));

            providerHelper.addQueryParameter(this.SearchDataProvider, "match", encodeURIComponent(match));
            providerHelper.addQueryParameter(this.SearchDataProvider, "searchfromdatefilter", encodeURIComponent(this.FromDatePick.get("formattedDate")));
            providerHelper.addQueryParameter(this.SearchDataProvider, "searchtodatefilter", encodeURIComponent(this.ToDatePick.get("formattedDate")));
            this.setChannelFilters();
            this.setCampaignFilters();
            this.setOutcomeFilters();
            this.setGoalFilters();
            this.setProfileFilters();
            this.setDeviceFilters();
            providerHelper.getListData(this.SearchDataProvider);
        },
        setChannelFilters: function () {
            var channelFilterIDs = this.ChannelsTreeview.get("checkedItemIds");
            var searchChannelFilters;
            if (channelFilterIDs != null && channelFilterIDs != "") {
                channelFilterIDs = channelFilterIDs.toString();
                channelFilterIDs = channelFilterIDs.split('|').join(',').replace(/{/g, "{\"ItemId\": \"").replace(/}/g, "\"}");
                searchChannelFilters = this.applyFilterFormatter("CHANNEL_FILTERS", channelFilterIDs);
                providerHelper.addQueryParameter(this.SearchDataProvider, "searchchannelfilters", encodeURIComponent(JSON.stringify(searchChannelFilters)));
            }
            else { searchChannelFilters = null; }
            providerHelper.addQueryParameter(this.SearchDataProvider, "searchchannelfilters", encodeURIComponent(JSON.stringify(searchChannelFilters)));
        },
        setCampaignFilters: function () {
            var campaignFilterIDs = this.CampaignsTreeview.get("checkedItemIds");
            var searchCampaignFilters;
            if (campaignFilterIDs != null && campaignFilterIDs != "") {
                campaignFilterIDs = campaignFilterIDs.toString();
                campaignFilterIDs = campaignFilterIDs.split('|').join(',').replace(/{/g, "{\"ItemId\": \"").replace(/}/g, "\"}");
                searchCampaignFilters = this.applyFilterFormatter("CAMPAIGN_FILTERS", campaignFilterIDs);
            }
            else { searchCampaignFilters = null; }
            providerHelper.addQueryParameter(this.SearchDataProvider, "searchcampaignfilters", encodeURIComponent(JSON.stringify(searchCampaignFilters)));
        },
        setOutcomeFilters: function () {
            var outcomeFilterIDs = this.OutcomeTreeview.get("checkedItemIds");
            var searchOutcomeFilters;
            if (outcomeFilterIDs != null && outcomeFilterIDs != "") {
                outcomeFilterIDs = outcomeFilterIDs.toString();
                outcomeFilterIDs = outcomeFilterIDs.split('|').join(',').replace(/{/g, "{\"ItemId\": \"").replace(/}/g, "\"}");
                searchOutcomeFilters = this.applyFilterFormatter("OUTCOME_FILTERS", outcomeFilterIDs);
            }
            else { searchOutcomeFilters = null; }
            providerHelper.addQueryParameter(this.SearchDataProvider, "searchoutcomefilters", encodeURIComponent(JSON.stringify(searchOutcomeFilters)));
        },
        setGoalFilters: function () {
            var goalFilterIDs = this.GoalsTreeview.get("checkedItemIds");
            var searchGoalFilters;
            if (goalFilterIDs != null && goalFilterIDs != "") {
                goalFilterIDs = goalFilterIDs.toString();
                goalFilterIDs = goalFilterIDs.split('|').join(',').replace(/{/g, "{\"ItemId\": \"").replace(/}/g, "\"}");
                searchGoalFilters = this.applyFilterFormatter("GOAL_FILTERS", goalFilterIDs);
            }
            else { searchGoalFilters = null; }
            providerHelper.addQueryParameter(this.SearchDataProvider, "searchgoalfilters", encodeURIComponent(JSON.stringify(searchGoalFilters)));
        },
        setProfileFilters: function () {
            var profileFilterIDs = this.ProfilesTreeview.get("checkedItemIds");
            var searchProfileFilters;
            if (profileFilterIDs != null && profileFilterIDs != "") {
                profileFilterIDs = profileFilterIDs.toString();
                profileFilterIDs = profileFilterIDs.split('|').join(',').replace(/{/g, "{\"ItemId\": \"").replace(/}/g, "\"}");
                searchProfileFilters = this.applyFilterFormatter("PROFILE_FILTERS", profileFilterIDs);
            }
            else { searchProfileFilters = null; }
            providerHelper.addQueryParameter(this.SearchDataProvider, "searchprofilefilters", encodeURIComponent(JSON.stringify(searchProfileFilters)));
        },
        setDeviceFilters: function () {
            var deviceFilterIDs = this.DevicesTreeview.get("checkedItemIds");
            var searchDeviceFilters;
            if (deviceFilterIDs != null && deviceFilterIDs != "") {
                deviceFilterIDs = deviceFilterIDs.toString();
                deviceFilterIDs = deviceFilterIDs.split('|').join(',').replace(/{/g, "{\"ItemId\": \"").replace(/}/g, "\"}");
                searchDeviceFilters = this.applyFilterFormatter("DEVICE_FILTERS", deviceFilterIDs);
            }
            else { searchDeviceFilters = null; }
            providerHelper.addQueryParameter(this.SearchDataProvider, "searchdevicefilters", encodeURIComponent(JSON.stringify(searchDeviceFilters)));
        },
        getMoreData: function () {
            providerHelper.getMoreListData(this.SearchDataProvider, this._pageSize);
        },
        toggleFiltersVisibility: function () {
            this.LeftContentBorder.toggle();
            if (this.LeftContentBorder.attributes.isVisible) {
                $("div[data-sc-id='RightContentBorder']").width("75%");
            }
            else {
                $("div[data-sc-id='RightContentBorder']").width("");
            }
        },
        applyFilterFormatter: function (filterName, filterIds) {
            var jsonFormatterString = '{"name": "<FILTER_NAME>", "SearchItems": [<FILTER_IDs>]}';
            var filterJson = jsonFormatterString.replace("<FILTER_NAME>", filterName);
            filterJson = filterJson.replace("<FILTER_IDs>", filterIds);
            return JSON.parse(filterJson);
        }
    });
    return app;
});