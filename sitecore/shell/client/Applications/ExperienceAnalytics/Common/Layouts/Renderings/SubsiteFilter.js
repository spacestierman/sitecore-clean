require.config({
    paths: {
        experienceAnalytics:
            "/sitecore/shell/client/Applications/ExperienceAnalytics/Common/Layouts/Renderings/Shared/ExperienceAnalytics",
        experienceAnalyticsBase:
            "/sitecore/shell/client/Applications/ExperienceAnalytics/Common/Layouts/Renderings/Shared/experienceAnalyticsBase"
    }
});

define(["sitecore", "experienceAnalytics", "experienceAnalyticsBase"],
    function (sitecore, experienceAnalytics, experienceAnalyticsBase) {
        sitecore.Factories.createBaseComponent({
            name: "SubsiteFilter",
            base: "ExperienceAnalyticsBase",
            selector: ".sc-SubsiteFilter",

            attributes: sitecore.Definitions.Views.ExperienceAnalyticsBase.prototype._scAttrs.concat([
                { name: "selectedSubsiteValue", defaultValue: null },
                { name: "selectedSubsiteName", defaultValue: null },
                { name: "errorTexts", value: "$el.data:sc-errortexts" }
            ]),

            extendModel: {
                selectSubsiteValue: function (value, name) {
                    this.set("selectedSubsiteValue", value);
                    if (name != null)
                        this.set("selectedSubsiteName", name);
                        experienceAnalytics.setSubsite(value === "all" ? "all" : name);
                }
            },

            initialize: function () {
                this._super();

                $(window).off("hashchange." + this.model.get("name"));
                $(window).on("hashchange." + this.model.get("name"), _.bind(this.onHashChange, this));
            },

            afterRender: function () {
                var appName = this.model.get("name"),
                    submitButton = this.app[appName + "SubmitButton"],
                    resetButton = this.app[appName + "ResetButton"],
                    subsiteComboBox = this.app[appName + "SubsiteComboBox"];

                submitButton.on("click", this.setSelectedSubsite, this);
                resetButton.on("click", this.resetSelectedSubsite, this);

                this.model.on("change:selectedSubsiteValue",
                    function (model, value) {
                        subsiteComboBox.set("selectedValue", value ? value : subsiteComboBox.get("items")[0].itemId);
                        var displayFieldName = subsiteComboBox.get("selectedItem")
                            ? subsiteComboBox.viewModel.getDisplayFieldName(subsiteComboBox.get("selectedItem"))
                            : null;

                        if (value === "all") {
                            this.model.set("selectedSubsiteName", displayFieldName);
                        }
                    },
                    this);

                this.model.on("change:selectedSubsiteName",
                    function (model, value) {
                        var items = subsiteComboBox.get("items");
                        var itemsWithDisplayName = _.where(items, { $displayName: value });
                        if (itemsWithDisplayName.length > 0) {
                            var itemId = itemsWithDisplayName[0]['itemId'];
                            subsiteComboBox.set("selectedValue", itemId);
                        }
                    },
                    this);

                this.setSelectedSubsite(experienceAnalytics.getSubsite());
            },

            resetSelectedSubsite: function () {
                this.setSelectedSubsite("all");
                this.closeToggleButtons();
            },

            setSelectedSubsite: function (value) {
                var appName = this.model.get("name"),
                    subsiteComboBox = this.app[appName + "SubsiteComboBox"],
                    subsite = subsiteComboBox.get("selectedValue"),
                    items = subsiteComboBox.get("items");

                if (items.length === 1 && subsite === "all") {
                    subsite = items[0].itemId;
                }

                var displayName;
                if (value === "all") {
                    var itemsWithItemId = _.where(items, { itemId: value });
                    if (itemsWithItemId.length > 0) {
                        this.model.selectSubsiteValue(itemsWithItemId[0].itemId, itemsWithItemId[0].$displayName);
                    }
                } else if (value != null) {
                    var itemsWithDisplayName = _.where(items, { $displayName: value });
                    if (itemsWithDisplayName.length > 0) {
                        var itemId = itemsWithDisplayName[0]['itemId'];
                        this.model.selectSubsiteValue(itemId, value);
                    }
                } else if (_.contains(_.pluck(items, "itemId"), subsite)) {
                    displayName = subsiteComboBox.get("selectedItem")["$displayName"];
                    this.model.selectSubsiteValue(subsite, displayName);
                } else {
                    this.showMessage("notification",
                        this.model.get("errorTexts").InvalidSubsite,
                        { WEBSITE: experienceAnalytics.getSubsite() });
                    this.resetSelectedSubsite();
                }

                this.closeToggleButtons();
            },

            onHashChange: function () {
                var subsiteFromUrl = experienceAnalytics.getSubsiteFromUrl();

                if (this.model.get("selectedSubsiteValue") && this.model.get("selectedSubsiteValue") !== subsiteFromUrl) {
                    this.model.set("selectedSubsiteValue", subsiteFromUrl);
                    this.setSelectedSubsite(experienceAnalytics.getSubsite());
                }
            },

            closeToggleButtons: function () {
                var filtersModel = this.app[this.model.get("name").replace(this.model.componentName, "")];

                if (filtersModel) {
                    filtersModel.viewModel.closeToggleButtons();
                }
            }
        });
    });