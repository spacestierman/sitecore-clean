require.config({
    paths: {
        experienceAnalytics:
        "/sitecore/shell/client/Applications/ExperienceAnalytics/Common/Layouts/Renderings/Shared/ExperienceAnalytics",
        experienceAnalyticsBase:
        "/sitecore/shell/client/Applications/ExperienceAnalytics/Common/Layouts/Renderings/Shared/experienceAnalyticsBase"
    }
});

define(["sitecore", "experienceAnalytics", "experienceAnalyticsBase"],
    function (sitecore, experienceAnalytics, bbb) {
        sitecore.Factories.createBaseComponent({
            name: "MetricsDropDown",
            base: "ExperienceAnalyticsBase",
            selector: ".sc-MetricsDropDown",
            attributes: sitecore.Definitions.Views.ExperienceAnalyticsBase.prototype._scAttrs.concat([
                { name: "items", value: "$el.data:sc-items", defaultValue: null },
                { name: "defaultSelectedItem", value: "$el.data:sc-default-selected-item", defaultValue: null }
            ]),

            initialize: function () {
                this._super();
                this.model.set("selectedMetricName", this.model.get("defaultSelectedItem").$displayName);
                this.model.set("selectedMetric", this.model.get("defaultSelectedItem"));

                function camelizeItems(items) {
                    function camelize(obj) {
                        for (var key in obj) {
                            var tempValue = obj[key];
                            var camelCaseKey = key[0].toLowerCase() + key.substring(1);

                            if (camelCaseKey !== key) {
                                obj[camelCaseKey] = tempValue;
                                delete obj[key];
                            }

                            if (typeof obj[camelCaseKey] === "object")
                                obj[camelCaseKey] = camelize(obj[camelCaseKey]);
                        }
                        return obj;
                    }

                    for (var c = 0; c < items.length; c++) {
                        camelize(items[c]);
                    }
                }

                camelizeItems(this.model.get("items"));
                this.validateSavedMetric();

            },

            afterRender: function () {
                var appName = this.model.get("name"),
                    metricsCheckbox = this.app[appName + "MetricComboBox"],
                    submitButton = this.app[appName + "SubmitButton"],
                    resetButton = this.app[appName + "ResetButton"];

                submitButton.on("click", this.submitButtonHandler, this);
                resetButton.on("click", this.resetButtonHandler, this);

                var metric = experienceAnalytics.getMetric();
                if (!metric)
                    metric = this.model.get("defaultSelectedItem");

                this.updateSelectedMetric(metric.itemId);
            },

            updateSelectedMetric: function (value) {
                var metricsCheckbox = this.app[this.model.get("name") + "MetricComboBox"];
                var metrics = this.model.get("items");
                var selectedMetricItem = _.findWhere(metrics, { itemId: value });
                metricsCheckbox.set("selectedValue", value);
                experienceAnalytics.setMetric(selectedMetricItem);
                this.model.set("selectedMetricName", selectedMetricItem.$displayName);
                this.model.set("selectedMetric", selectedMetricItem);
                this.closeToggleButtons();
            },

            submitButtonHandler: function () {
                var appName = this.model.get("name"),
                    metricsCheckbox = this.app[appName + "MetricComboBox"];

                var value = metricsCheckbox.get("selectedValue");
                this.updateSelectedMetric(value);
            },

            resetButtonHandler: function () {
                var value = this.model.get("defaultSelectedItem").itemId;
                this.updateSelectedMetric(value);
            },

            closeToggleButtons: function () {
                var filtersModel = this.app[this.model.get("name").replace(this.model.componentName, "")];

                if (filtersModel) {
                    filtersModel.viewModel.closeToggleButtons();
                }
            },

            validateSavedMetric: function () {

                var items = this.model.get("items");

                var currentItem = null;
                var metricName = experienceAnalytics.getMetricName();

                if (metricName) {
                    currentItem = _.findWhere(items, { $displayName: metricName });
                }

                if (!currentItem) {
                    var metricId = experienceAnalytics.getMetricId();
                    currentItem = _.findWhere(items, { itemId: metricId });
                }

                if (!currentItem)
                    currentItem = this.model.get("defaultSelectedItem");

                if (currentItem)
                    experienceAnalytics.setMetric(Boolean(currentItem) ? currentItem : null);
            }

        });
    });