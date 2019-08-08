require.config({
    paths: {
        experienceAnalytics:
            "/sitecore/shell/client/Applications/ExperienceAnalytics/Common/Layouts/Renderings/Shared/ExperienceAnalytics",
        experienceAnalyticsDvcBase:
            "/sitecore/shell/client/Applications/ExperienceAnalytics/Common/Layouts/Renderings/Shared/ExperienceAnalyticsDvcBase"
    }
});

define(["sitecore", "experienceAnalytics", "experienceAnalyticsDvcBase"],
    function(sitecore, experienceAnalytics) {
        "use strict";

        var resDaily = "5B533C99F0D241659ACD97201DAB74EB",
            resWeekly = "8BC1EF452A3841DFBA618CA679541A89",
            resMonthly = "F48DBE526048419CB4E30110C9D6AFF2";

        sitecore.Factories.createBaseComponent({
            base: "ExperienceAnalyticsDvcBase",
            name: "ExperienceAnalyticsChartBase",
            selector: ".sc-ExperienceAnalyticsChartBase",

            attributes: sitecore.Definitions.Views.ExperienceAnalyticsDvcBase.prototype._scAttrs.concat([
                { name: "errorTexts", value: "$el.data:sc-errortexts" },
                { name: "title", value: "$el.data:sc-title" },
                { name: "metrics", value: "$el.data:sc-metrics" },
                { name: "segments", value: "$el.data:sc-segments" },
                { name: "timeResolution", value: "" },
                { name: "keys", value: "$el.data:sc-keys" },
                { name: "seriesChartField", value: "$el.data:sc-serieschartfield" },
                { name: "keysByMetricQuery", value: "$el.data:sc-keysbymetricquery" },
                { name: "chartName", value: "ChartBase" },
                { name: "keyGrouping", value: "$el.data:sc-keygrouping" },
                { name: "componentType", value: "$el.data:sc-componenttype" }
            ]),

            lastRequestHash: "",
            previousResponseData: null,
            keyProperty: "key",
            rawKeys: {},

            initialize: function() {
                this._super();
                if (this.model.get("configurationError")) {
                    return;
                }

                this.rawKeys = {};
                // TODO: Move time resolution functionality into separated extension. #16903
                var timeResolutionControlName = this.model.get("name") + "ActionControl",
                    timeResolutionControl = this.app[timeResolutionControlName];

                if (timeResolutionControl) {
                    this.model.setPreferredTimeResolution(this
                        .getResolutionString(this.$el.attr("data-sc-timeresolution")));
                    this.setupActions(timeResolutionControl);
                }

                this.setupServerSideErrorHandling();

                this.validateProperties();

                this.model.on("change:timeResolution", this.updateChart, this);
                experienceAnalytics.on("change:dateRange change:subsite", this.updateChart, this);
            },

            afterRender: function() {
                if (this.model.get("configurationError")) {
                    return;
                }
                var chartModel = this.app[this.model.get("name") + this.model.get("chartName")];
                this.chartModel = chartModel;
                this.setupMessageBar(chartModel);
                this.setChartProperties(chartModel);
            },

            extendModel: {
                setTitle: function(value) {
                    this.set("title", value);
                },

                setPreferredTimeResolution: function(value) {
                    this.set("timeResolution", value.toLowerCase());
                }
            },

            getResolutionString: function(abbreviation) {
                switch (abbreviation) {
                case "m":
                    return "monthly";
                case "w":
                    return "weekly";
                case "d":
                    return "daily";
                case "a":
                    return "auto";
                case "c":
                    return "collapsed";
                default:
                    throw "Could not convert abbreviation '" + abbreviation + "' to resolution string";
                }
            },

            getResolutionAbbreviation: function(resString) {
                switch (resString) {
                case "monthly":
                    return "by-month";
                case "weekly":
                    return "by-week";
                case "daily":
                    return "by-day";
                case "auto":
                    return "by-auto";
                case "-":
                    return "collapsed";
                default:
                    throw "Could not convert resolution'" + resString + "' to abbreviation string";
                }
            },

            setupActions: function(actionControl) {
                var that = this;

                actionControl.get("actions")
                    .each(function(i, action) {
                        switch (action.id()) {
                        case resDaily:
                            action.click = $.proxy(that.selectDaily, that);
                            break;
                        case resWeekly:
                            action.click = $.proxy(that.selectWeekly, that);
                            break;
                        case resMonthly:
                            action.click = $.proxy(that.selectMonthly, that);
                            break;
                        default:
                            throw "Could not find action for " + action.id();
                        }
                    });
            },
            selectCurrentTimResolution: function(resolution) {
                switch (resolution) {
                case "weekly":
                    this.updateResolutionDropdown(resWeekly);
                    break;
                case "monthly":
                    this.updateResolutionDropdown(resMonthly);
                    break;
                case "daily":
                    this.updateResolutionDropdown(resDaily);
                    break;
                default:
                    break;
                }
            },

            selectDaily: function() {
                this.model.setPreferredTimeResolution("daily");
            },

            selectWeekly: function() {
                this.model.setPreferredTimeResolution("weekly");
            },

            selectMonthly: function() {
                this.model.setPreferredTimeResolution("monthly");
            },

            updateResolutionDropdown: function(resolutionItemId) {
                var actionControl = this.app[this.model.get("name") + "ActionControl"];
                actionControl.get("actions")
                    .each(function(i, action) {
                        action.isEnabled(action.id() !== resolutionItemId);
                    });
            },

            updateChart: function() {
                var dateRange = experienceAnalytics.getDateRange(),
                    subsite = experienceAnalytics.getSubsite(),
                    timeResolution = this.model.get("timeResolution"),
                    currentRequestHash = JSON.stringify(dateRange) + subsite + timeResolution,
                    keysAreValid = this.areKeysValid(),
                    metrics = this.model.get("metrics"),
                    segments = this.model.get("segments");

                if (dateRange &&
                    subsite &&
                    timeResolution &&
                    this.lastRequestHash != currentRequestHash &&
                    keysAreValid &&
                    metrics &&
                    segments) {
                    this.lastRequestHash = currentRequestHash;

                    var parameters = sitecore.Helpers.url.getQueryParameters(this.model.get("keysByMetricQuery"));
                    parameters.dateFrom = experienceAnalytics.convertDateFormat(dateRange.dateFrom);
                    parameters.dateTo = experienceAnalytics.convertDateFormat(dateRange.dateTo);
                    parameters.keyGrouping = this.model.get("keyGrouping");
                    this.getData(parameters, subsite, timeResolution);
                }
            },

            setChartProperties: function(chartModel) {
                var chartProperties = chartModel.get("chartProperties"),
                    metrics = this.model.get("metrics"),
                    segments = this.model.get("segments"),
                    keys = this.model.get("keys") ? this.model.get("keys").toString() : "",
                    keysArr = keys ? keys.split("|") : [],
                    errorTexts = this.model.get("errorTexts");

                if (!segments || !metrics) {
                    return;
                }

                chartProperties.dataMapping.valueChartFields = metrics;

                var keyTop = sitecore.Helpers.url.getQueryParameters(this.model.get("keysByMetricQuery")).keyTop
                        ? parseInt(sitecore.Helpers.url.getQueryParameters(this.model.get("keysByMetricQuery")).keyTop)
                        : 0,
                    keyFromUrl = sitecore.Helpers.url.getQueryParameters(window.location.search).key,
                    hasMultipleMetrics = metrics.length > 1,
                    hasMultipleKeys = !keyFromUrl &&
                        (keyTop !== 1) &&
                        (keysArr.length > 1 || keys === "" || keys === "+" || keys === "ALL") &&
                        (this.model.get("keyGrouping") !== "collapsed");

                if (hasMultipleMetrics && hasMultipleKeys) {
                    this.showMessage("warning", errorTexts.MultipleKeysAndMultipleMetrics);
                }

                if (errorTexts.AllOnly) {
                    this.showMessage("warning", errorTexts.AllOnly);
                }

                chartModel.set("chartProperties", chartProperties);
            },

            getData: function(parameters, subsite, timeResolution) {
                var modelName = this.model.get("name"),
                    dataProviderComponentName = modelName + "DataProvider",
                    dataProviderModel = this.app[dataProviderComponentName],
                    dataParameters = {
                        url: this.getDataUrl(dataProviderModel.get("dataUrl"),
                            this.model.get("segments"),
                            this.model.get("keys"),
                            subsite,
                            this.getResolutionAbbreviation(timeResolution)),
                        parameters: parameters,
                        onSuccess: this.dataLoadedHandler.bind(this)
                    };

                if (this.chartModel) {
                    this.chartModel.viewModel.toggleProgressIndicator(true);
                }

                dataProviderModel.viewModel.getData(dataParameters);
            },

            dataLoadedHandler: function(data) {
                data = this.convertApiDataToChartData(data);

                var dataLength = data.data.dataset[0].data.length;

                if (!dataLength) {
                    data.data.localization ? this.setChartData(data.data) : $.noop();
                    this.resetChartData();
                } else {
                    this.setChartData(data.data);
                }

                if (this.chartModel && !dataLength || _.isEqual(this.previousResponseData, data)) {
                    this.chartModel.viewModel.toggleProgressIndicator(false);
                }

                this.previousResponseData = data;
                this.selectCurrentTimResolution(this.getResolutionString(data.timeResolution));
            },

            serverSideErrorHandler: function(errorObject) {
                this._super(errorObject);
                // Need to hide progress indicator if server error is appeared
                if (this.chartModel) {
                    this.chartModel.viewModel.toggleProgressIndicator(false);
                }
                this.resetChartData();
            },

            resetChartData: function() {
                if (this.chartModel) {
                    if (this.chartModel.get("chartControls").length) {
                        this.chartModel.get("chartControls")[0].setJSONData({});
                    }

                    this.chartModel.set("data", { dataset: [{ data: [] }] });
                }
            },

            setChartData: function(data) {
                var readyData = data;

                if (this.model.get("keyGrouping") === "collapsed") {
                    readyData = this.renameSumKeys(data);
                } else {
                    if (this.useCartesianKey(data)) {
                        readyData = this.createCartesianProduct(data);
                    }
                }

                this.setChartFieldProperties(readyData);
                readyData = this.setKeyTranslations(readyData);
                this.chartModel.set("data", readyData);
            },

            setChartFieldProperties: function(data) {
                var chartProperties = this.chartModel.get("chartProperties"),
                    seriesChartField = this.model.get("seriesChartField");

                chartProperties.dataMapping.seriesChartField = {
                    dataField: seriesChartField.keyField
                };

                if (this.useCartesianKey(data)) {
                    chartProperties.dataMapping.seriesChartField.dataField = seriesChartField.cartesianKeyField;
                }
            },

            setKeyTranslations: function(readyData) {
                return readyData;
            },

            useCartesianKey: function(data) {
                var seriesChartField = this.model.get("seriesChartField"),
                    numOfSegments = _.keys(this.getTranslationsByField(data, seriesChartField.segmentField)).length,
                    useCartesianKey = false;
                if (!(this.model.get("keyGrouping") === "collapsed")) {
                    useCartesianKey = numOfSegments > 1;
                }
                return useCartesianKey;
            },

            getTranslationsByField: function(data, field) {
                var translations;
                try {
                    translations = _.find(data.localization.fields, function(item) { return item.field === field; })
                        .translations;
                } catch (e) {
                    throw 'Cannot find translation for field "' + field + '"';
                }
                return translations;
            },

            createCartesianProduct: function(data) {
                var entries = data.dataset[0].data,
                    seriesChartField = this.model.get("seriesChartField"),
                    keyTranslations = this.getTranslationsByField(data, seriesChartField.keyField),
                    segmentTranslations = this.getTranslationsByField(data, seriesChartField.segmentField);

                for (var i = 0; i < entries.length; i++) {
                    var entry = entries[i];
                    entry.cartesianKey = segmentTranslations[entry[seriesChartField.segmentField]] +
                        " - " +
                        keyTranslations[entry[seriesChartField.keyField]];
                }

                return data;
            },

            setupMessageBar: function(chartModel) {
                chartModel.on("error",
                    function(error) {
                        this.showMessage("error", error.message);
                    },
                    this);
            },

            validateProperties: function() {
                this._super();

                if (!this.model.get("metrics")) {
                    this.showMessage("error", this.model.get("errorTexts").MetricsAreEmpty);
                }
            },

            drillDownToKey: function(selectedSegment) {
                if (selectedSegment.dataObject) {
                    var targetPageUrl = this.model.get("targetPageUrl");

                    if (targetPageUrl) {
                        var rawKey = this.rawKeys[selectedSegment.dataObject.itemId] ||
                            selectedSegment.dataObject[this.keyProperty];
                        window.location.href = sitecore.Helpers.url.addQueryParameters(targetPageUrl,
                        {
                            key: rawKey
                        });
                    }
                }
            }

        });
    });