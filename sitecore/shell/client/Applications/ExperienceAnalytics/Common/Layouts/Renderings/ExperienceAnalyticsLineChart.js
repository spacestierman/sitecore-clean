require.config({
    paths: {
        experienceAnalyticsD3ChartBase:
            "/sitecore/shell/client/Applications/ExperienceAnalytics/Common/Layouts/Renderings/Shared/ExperienceAnalyticsD3ChartBase"
    }
});

define(["sitecore", "experienceAnalyticsD3ChartBase"],
    function(sitecore, experienceAnalyticsD3ChartBase) {

        sitecore.Factories.createBaseComponent({
            name: "ExperienceAnalyticsLineChart",
            base: "ExperienceAnalyticsD3ChartBase",
            selector: ".sc-ExperienceAnalyticsLineChart",
            attributes: sitecore.Definitions.Views.ExperienceAnalyticsD3ChartBase.prototype._scAttrs.concat([
                { name: "chartName", value: "LineChart" }
            ]),

            initialize: function() {
                this._super();
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

           isMetricFormattingEnabled: function () {
                return true;
            },

            showMessageForInvalidSettingsOfCharts: function() {
                var metrics = this.model.get("metrics"),
                    segments = this.model.get("segments"),
                    keys = this.model.get("keys") ? this.model.get("keys").toString() : "",
                    keysArr = keys ? keys.split("|") : [];

                if (!segments || !metrics || metrics.length == 1) {
                    return;
                }

                segments = segments.split("|");
                var keyTop = sitecore.Helpers.url.getQueryParameters(this.model.get("keysByMetricQuery")).keyTop
                        ? parseInt(sitecore.Helpers.url.getQueryParameters(this.model.get("keysByMetricQuery")).keyTop)
                        : 0,
                    keyFromUrl = sitecore.Helpers.url.getQueryParameters(window.location.search).key,
                    hasMultipleKeys = !keyFromUrl &&
                        (keyTop !== 1) &&
                        (keysArr.length > 1 || keys === "" || keys === "+" || keys === "ALL") &&
                        (this.model.get("keyGrouping") !== "collapsed");

                var errorTexts = this.model.get("errorTexts");

                if (metrics.length > 2 || hasMultipleKeys || segments.length > 1) {
                    this.showMessage("warning", errorTexts.CombinationChartInvalidSettings);
                }

                if (errorTexts.AllOnly) {
                    this.showMessage("warning", errorTexts.AllOnly);
                }
            }
        });

    });