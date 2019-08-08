require.config({
    paths: {
        experienceAnalytics:
        "/sitecore/shell/client/Applications/ExperienceAnalytics/Common/Layouts/Renderings/Shared/ExperienceAnalytics",
        experienceAnalyticsBase:
        "/sitecore/shell/client/Applications/ExperienceAnalytics/Common/Layouts/Renderings/Shared/experienceAnalyticsBase"
    }
});

define(["sitecore", "experienceAnalytics", "experienceAnalyticsBase"],
    function (sitecore, experienceAnalytics) {
        sitecore.Factories.createBaseComponent({
            name: "ExperienceAnalyticsFilters",
            base: "ExperienceAnalyticsBase",
            selector: ".sc-ExperienceAnalyticsFilters",

            attributes: sitecore.Definitions.Views.ExperienceAnalyticsBase.prototype._scAttrs.concat([
            ]),

            events: {
                "click .sc-togglebutton[data-sc-id*='DateRangeToggleButton']": "toggleComponents",
                "click .sc-togglebutton[data-sc-id*='FilterToggleButton']": "toggleComponents",
                "click .sc-togglebutton[data-sc-id*='MetricsToggleButton']": "toggleComponents"
            },

            initialize: function () {
                var renderingId = this.model.get("name"),
                    dateRangeFilter = this.app[renderingId + "DateRangeFilter"],
                    dateRangeToggleButton = this.app[renderingId + "DateRangeToggleButton"],
                    subsiteFilter = this.app[renderingId + "SubsiteFilter"],
                    filterToggleButton = this.app[renderingId + "FilterToggleButton"],
                    metricsToggleButton = this.app[renderingId + "MetricsToggleButton"],
                    metricsDropDown = this.app[renderingId + "MetricsDropDown"],
                    subsiteComboBox = this.app[renderingId + "SubsiteFilterSubsiteComboBox"];

                this.setFilterButtonState(filterToggleButton, subsiteComboBox);

                this.bindComponentVisibility(filterToggleButton, subsiteFilter);
                this.bindComponentVisibility(dateRangeToggleButton, dateRangeFilter);

                if (metricsDropDown)
                    this.bindComponentVisibility(metricsToggleButton, metricsDropDown);

                experienceAnalytics.on("change:dateRange",
                    function (m, dateRange) {
                        dateRangeToggleButton.set("text", dateRange.dateFrom + " - " + dateRange.dateTo);
                    });

                experienceAnalytics.on("change:subsite",
                    function (model, value) {
                        if (value !== "all") {
                            subsiteFilter.set("selectedSubsiteName", value);
                        } else {
                            subsiteFilter.set("selectedSubsiteValue", value);
                        }
                    });
            },

            setFilterButtonState: function (toggleButton, comboBox) {
                toggleButton.set("isEnabled", comboBox.get("items").length > 1);
            },

            bindComponentVisibility: function (button, component) {
                button.on("change:isOpen",
                    function () {
                        component.set("isVisible", this.get("isOpen"));
                    });
            },

            toggleComponents: function (event) {
                var renderingId = this.model.get("name"),
                    buttonClickedId = $(event.currentTarget).attr("data-sc-id"),
                    buttons = ["DateRangeToggleButton", "FilterToggleButton", "MetricsToggleButton"];

                for (var i = 0; i < buttons.length; i++) {
                    var button = this.app[renderingId + buttons[i]];

                    if (button && button.get("name") !== buttonClickedId) {
                        button.viewModel.close();
                    }
                }
            },

            closeToggleButtons: function () {
                var renderingId = this.model.get("name"),
                    dateRangeToggleButton = this.app[renderingId + "DateRangeToggleButton"],
                    filterToggleButton = this.app[renderingId + "FilterToggleButton"],
                    metricsToggleButton = this.app[renderingId + "MetricsToggleButton"];

                dateRangeToggleButton.viewModel.close();
                filterToggleButton.viewModel.close();

                if (metricsToggleButton)
                    metricsToggleButton.viewModel.close();
            }

        });
    });