require.config({
    paths: {
        experienceAnalytics:
        "/sitecore/shell/client/Applications/ExperienceAnalytics/Common/Layouts/Renderings/Shared/ExperienceAnalytics",
        experienceAnalyticsDvcBase:
        "/sitecore/shell/client/Applications/ExperienceAnalytics/Common/Layouts/Renderings/Shared/ExperienceAnalyticsDvcBase",
        chartDataConversionService:
        "/sitecore/shell/client/Applications/ExperienceAnalytics/Common/Layouts/Renderings/Shared/ChartDataConversionService"
    }
});

define(["sitecore", "experienceAnalytics", "chartDataConversionService", "experienceAnalyticsDvcBase"],
    function (sitecore, experienceAnalytics, chartDataConversionService) {
        "use strict";

        var resDaily = "5B533C99F0D241659ACD97201DAB74EB",
            resWeekly = "8BC1EF452A3841DFBA618CA679541A89",
            resMonthly = "F48DBE526048419CB4E30110C9D6AFF2";

        sitecore.Factories.createBaseComponent({
            base: "ExperienceAnalyticsDvcBase",
            name: "ExperienceAnalyticsD3ChartBase",
            selector: ".sc-ExperienceAnalyticsD3ChartBase",

            attributes: sitecore.Definitions.Views.ExperienceAnalyticsDvcBase.prototype._scAttrs.concat([
                { name: "errorTexts", value: "$el.data:sc-errortexts" },
                { name: "keyscollapsedlabel", value: "$el.data:sc-keyscollapsedlabel" },
                { name: "title", value: "$el.data:sc-title" },
                { name: "metrics", value: "$el.data:sc-metrics" },
                { name: "segments", value: "$el.data:sc-segments" },
                { name: "timeResolution", value: "" },
                { name: "keys", value: "$el.data:sc-keys" },
                { name: "seriesChartField", value: "$el.data:sc-serieschartfield" },
                { name: "keysByMetricQuery", value: "$el.data:sc-keysbymetricquery" },
                { name: "chartName", value: "ChartBase" },
                { name: "keyGrouping", value: "$el.data:sc-keygrouping" },
                { name: "componentType", value: "$el.data:sc-componenttype" },
                { name: "configurationError", value: "$el.data:sc-configurationerror" }
            ]),

            lastRequestHash: "",
            previousResponseData: null,
            keyProperty: "key",
            rawKeys: {},

            initialize: function () {
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
                experienceAnalytics.on("change:metric", this.metricChangedHandler, this);
            },

            afterRender: function () {
                if (this.model.get("configurationError")) {
                    return;
                }
                var chartModel = this.app[this.model.get("name") + this.model.get("chartName")];
                this.chartModel = chartModel;
                this.setupMessageBar(chartModel);
                this.setChartProperties(chartModel);
            },

            extendModel: {
                setTitle: function (value) {
                    this.set("title", value);
                },

                setPreferredTimeResolution: function (value) {
                    this.set("timeResolution", value.toLowerCase());
                }
            },

            getResolutionString: function (abbreviation) {
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

            getResolutionAbbreviation: function (resString) {
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

            setupActions: function (actionControl) {
                var that = this;

                actionControl.get("actions")
                    .each(function (i, action) {
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
            selectCurrentTimResolution: function (resolution) {
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

            selectDaily: function () {
                this.model.setPreferredTimeResolution("daily");
            },

            selectWeekly: function () {
                this.model.setPreferredTimeResolution("weekly");
            },

            selectMonthly: function () {
                this.model.setPreferredTimeResolution("monthly");
            },

            updateResolutionDropdown: function (resolutionItemId) {
                var actionControl = this.app[this.model.get("name") + "ActionControl"];
                actionControl.get("actions")
                    .each(function (i, action) {
                        action.isEnabled(action.id() !== resolutionItemId);
                    });
            },

            updateChart: function () {
                var dateRange = experienceAnalytics.getDateRange(),
                    subsite = experienceAnalytics.getSubsite(),
                    timeResolution = this.model.get("timeResolution"),
                    currentRequestHash = JSON.stringify(dateRange) + subsite + timeResolution,
                    keysAreValid = this.areKeysValid(),
                    metrics = this.getMetrics(),
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

            setChartProperties: function (chartModel) {
                var metrics = this.getMetrics(),
                    segments = this.model.get("segments");

                if (!segments || !metrics) {
                    return;
                }

                var errorTexts = this.model.get("errorTexts");
                if (errorTexts.AllOnly) {
                    this.showMessage("warning", errorTexts.AllOnly);
                }

                this.showMessageForInvalidSettingsOfCharts();
                chartModel.set("lang", experienceAnalytics.getCookie("shell#lang"));
            },

            showMessageForInvalidSettingsOfCharts: function () {
                var metrics = this.model.get("metrics"),
                    keys = this.model.get("keys") ? this.model.get("keys").toString() : "",
                    keysArr = keys ? keys.split("|") : [];

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
                    var errorTexts = this.model.get("errorTexts");
                    this.showMessage("warning", errorTexts.MultipleKeysAndMultipleMetrics);
                }
            },

            getData: function (parameters, subsite, timeResolution) {
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

                this.toggleProgressIndicator(true);

                dataProviderModel.viewModel.getData(dataParameters);
            },

            toggleProgressIndicator: function (toggle) {
                var progressIndicator = this.app[this.model.get("name") + "ProgressIndicator"];
                if (progressIndicator) {
                    progressIndicator.set("isBusy", toggle);
                }
            },

            dataLoadedHandler: function (data) {
                data = this.convertApiDataToChartData(data);

                if (this.model.get("title") == "") {
                    this.displayKeyAsTitleForDrillDown(data.data);
                }
                this.model.set("timeResolutionKey", data.timeResolution);
                var dataLength = data.data.dataset[0].data.length;
                if (!dataLength) {
                    this.resetChartData();
                } else {

                    this.updateMetricsFormat();

                    this.setChartData(data.data);
                }

                this.toggleProgressIndicator(false);

                this.previousResponseData = data;
                this.selectCurrentTimResolution(this.getResolutionString(data.timeResolution));
            },
            updateXAxis: function () {
                var language = experienceAnalytics.getCookie("shell#lang");
                var timeResolution = this.model.get("timeResolutionKey");

                var metricsFormat = this.chartModel.viewModel.getMetrics();
                metricsFormat.xOptions.numberScale = "Date";
                metricsFormat.xOptions.numberScaleUnits = timeResolution;
                metricsFormat.xOptions.numberScaleValues = language;
            },

            updateMetricsFormat: function () {
                if (!this.isMetricFormattingEnabled())
                    return;

                this.updateXAxis();

                var metric = experienceAnalytics.getMetric();
                if (metric)
                    this.setMetricsFormat(metric.object);
            },

            setMetricsFormat: function (metric) {
                var metricsFormat = this.chartModel.viewModel.getMetrics();

                if (this.doesChartRespectMetricDropDown()) {
                    if (metric.numberScale) {
                        metricsFormat.yOptions.numberScale = metric.numberScale.name;
                        metricsFormat.yOptions.numberScaleUnits = metric.numberScale.scaleUnit;
                        metricsFormat.yOptions.numberScaleValues = metric.numberScale.scaleValue;
                    } else {
                        metricsFormat.yOptions.numberScale = "Number";
                        metricsFormat.yOptions.numberScaleUnits = "K,M,B";
                        metricsFormat.yOptions.numberScaleValues = "1000,1000,1000";
                    }
                }
            },

            isMetricFormattingEnabled: function () {
                return false;
            },

            serverSideErrorHandler: function (errorObject) {
                this._super(errorObject);
                // Need to hide progress indicator if server error is appeared
                this.toggleProgressIndicator(false);
                this.resetChartData();
            },

            renameSumKeys: function (data) {
                _(data.dataset[0].data)
                    .each(function (dataItem) {
                        dataItem.key = this.model.get("keyscollapsedlabel");
                    },
                    this);

                return data;
            },

            resetChartData: function () {
                if (this.chartModel) {
                    this.chartModel.set("dynamicData", []);
                }
            },

            setChartData: function (data) {
                var readyData = data;
                var isKeyGroupingCollapsed = this.model.get("keyGrouping") === "collapsed";
                var seriesChartField = this.model.get("seriesChartField");
                var chartName = this.model.get("chartName");
                var metrics = this.getMetrics();

                var segmentTranslations = this.getTranslationsByField(data, seriesChartField.segmentField);
                var numOfSegments = _.keys(segmentTranslations).length;
                var keyTranslations = this.getTranslationsByField(data, seriesChartField.keyField);
                var translations = _(segmentTranslations).extend(keyTranslations);

                var useCartesianKey = !isKeyGroupingCollapsed && numOfSegments > 1;

                if (isKeyGroupingCollapsed) {
                    readyData = this.renameSumKeys(data);
                } else if (useCartesianKey) {
                    _(readyData.dataset[0].data)
                        .each(function (item) {
                            item.cartesianKey = item[seriesChartField.segmentField] +
                                "|" +
                                item[seriesChartField.keyField];
                            translations[item.cartesianKey] = translations[item[seriesChartField.segmentField]] +
                                " - " +
                                translations[item[seriesChartField.keyField]];
                        });
                }

                this.extractDimensionKeys(data);

                this.chartModel.set("data", readyData);
                var chartParameters = {};
                chartParameters.metrics = metrics;
                chartParameters.chartName = chartName;
                chartParameters.isKeyGroupingCollapsed = isKeyGroupingCollapsed;
                chartParameters.numOfSegments = numOfSegments;
                chartParameters.seriesChartField = seriesChartField;

                this.model.set("cachedChartData",
                    {
                        dataset: readyData.dataset,
                        translations: translations,
                        chartParameters: chartParameters
                    });

                this.renderChart(readyData.dataset, translations, chartParameters);
            },

            renderChart: function (dataset, translations, chartParameters) {

                if (this.doesChartRespectMetricDropDown()) {
                    if (!this.isValidMetricSelection(dataset, chartParameters.metrics[0])) {
                        var componentFullName = this.model.get("name") + this.chartModel.componentName;
                        var message = "[" + componentFullName + "]" + " " + this.model.get("errorTexts").InvalidMetricSelection;
                        this.showMessage("warning", message);
                        this.chartModel.set("dynamicData", []);
                        return;
                    }
                    this.chartModel.set("yAxisLabel", chartParameters.metrics[0].headerText); //Just for keeping the model in sync with the values in the DOM elements
                    this.updateChartYAxis(chartParameters.metrics[0].headerText);
                }

                var dynamicData = chartDataConversionService.convert(dataset, translations, chartParameters);
                this.chartModel.set("dynamicData", dynamicData);
            },

            updateChartYAxis: function (title) {
                var componentFullName = this.model.get("name") + this.chartModel.componentName;
                var chartContainerElement = $("div[data-sc-id='" + componentFullName + "']");
                $("div.nv-axislabel.custom", chartContainerElement).html(title);
            },

            isValidMetricSelection: function (dataset, metric) {
                if (!dataset || !dataset[0].data || dataset[0].data.length < 1)
                    return true;

                var obj = dataset[0].data[0].metrics;
                if (obj === undefined || obj === null)
                    return null;
                var value = obj[metric.dataField];
                return value !== undefined && value !== null;
            },

            metricChangedHandler: function () {
                if (!this.doesChartRespectMetricDropDown())
                    return;

                var data = this.model.get("cachedChartData");
                if (!data)
                    return;

                this.updateMetricsFormat();
                data.chartParameters.metrics = this.getMetrics();
                this.renderChart(data.dataset, data.translations, data.chartParameters);

            },

            displayKeyAsTitleForDrillDown: function (data) {
                var seriesChartField = this.model.get("seriesChartField");
                var keyTranslations = this.getTranslationsByField(data, seriesChartField.keyField);
                var keyFromUrl = sitecore.Helpers.url.getQueryParameters(window.location.search).key;
                if (keyFromUrl) {
                    var keyTranslation = keyTranslations[keyFromUrl];
                    if (keyTranslation) {
                        this.model.set("title", keyTranslation);
                    }
                }
            },

            extractDimensionKeys: function (readyData) {
                var entries = readyData.dataset[0].data;
                this.rawKeys = _.pluck(entries, this.keyProperty);
            },

            getTranslationsByField: function (data, field) {
                var translations;
                try {
                    translations = _.find(data.localization.fields, function (item) { return item.field === field; })
                        .translations;
                } catch (e) {
                    throw 'Cannot find translation for field "' + field + '"';
                }
                return translations;
            },

            setupMessageBar: function (chartModel) {
                chartModel.on("error",
                    function (error) {
                        this.showMessage("error", error.message);
                    },
                    this);
            },

            validateProperties: function () {
                this._super();

                if (!this.model.get("metrics")) {
                    this.showMessage("error", this.model.get("errorTexts").MetricsAreEmpty);
                }
            },

            drillDownToKey: function (selectedSegment) {
                var rawData = selectedSegment.rawData;
                if (rawData && this.model.get("targetPageUrl") && this.model.get("keyGrouping") != "collapsed") {
                    var targetPageUrl = this.model.get("targetPageUrl");

                    if (targetPageUrl) {
                        var rawKey = this.rawKeys[rawData.index] || rawData.data[this.keyProperty];
                        window.location.href = sitecore.Helpers.url.addQueryParameters(targetPageUrl,
                            {
                                key: rawKey
                            });
                    }
                }
            },

            getMetrics: function () {
                if (this.doesChartRespectMetricDropDown()) {
                    var selectedMetric = experienceAnalytics.getMetric();
                    if (selectedMetric) {
                        return [selectedMetric.object];
                    }
                }

                return this.model.get("metrics");
            },

            doesChartRespectMetricDropDown: function () {
                var metrics = this.model.get("metrics");
                var chartName = this.model.get("chartName");
                return (chartName === "LineChart" ||
                    chartName === "PieChart" ||
                    chartName === "BarChart" ||
                    chartName === "AreaChart") && (metrics === undefined || metrics === null || metrics.length < 2);
            }

        });
    });