define(["sitecore", "knockout"],
    function (sitecore, ko) {
        "use strict";

        sitecore.Factories.createBaseComponent({
            name: "ExperienceAnalyticsDataTable",
            base: "ControlBase",
            selector: ".sc-ExperienceAnalyticsDataTable",
            
            attributes: [
                { name: "headerItems", value: "$el.data:sc-header-items" },
                { name: "bodyItems", value: "$el.data:sc-body-items" },
                { name: "isBodyItemsClickable", value: "$el.data:sc-is-body-items-clickable" },
                { name: "errorMessages", value: "$el.data:sc-errortexts" }
            ],

            initialize: function () {
                this._super();
                var isBodyItemsClickableString = this.model.get("isBodyItemsClickable");
                this.model.set("isBodyItemsClickable", isBodyItemsClickableString && isBodyItemsClickableString.toLowerCase() === "true");
                this.model.on("change:bodyItems", this.updateDataAvailability, this);
                this.updateDataAvailability();
            },

            updateDataAvailability: function() {
                var bodyItems = this.model.get("bodyItems");
                var isNoDataAvailable = bodyItems === undefined || bodyItems === null || bodyItems.length < 1;
                this.model.set("isNoDataAvailable", isNoDataAvailable);
            },

            setHeaderItems: function (items) {
                this.model.set("headerItems", items);
            },

            setBodyItems: function (items) {
                this.model.set("bodyItems", items);
            },

            appendBodyItems: function (items) {
                var currentItems = this.model.get("bodyItems");
                if (!currentItems)
                    this.model.set("bodyItems", items);
                else
                    this.model.set("bodyItems", currentItems.concat(items));
            },

            drawBodyItem: function (item) {
                var headerItems = this.model.get("headerItems");
                var html = "";

                for (var headerCounter = 0; headerCounter < headerItems.length; headerCounter++) {
                    html += "<td>" + this.ensureValueFormat(item[headerItems[headerCounter].dataField]) + "</td>";
                }

                return html;
            },
            
            ensureValueFormat: function (value) {
                if (value === undefined || value === null)
                    return "N/A";
                return value;
            },

            itemClicked: function (item, eventArgs) {
                if (this.model.get("isBodyItemsClickable") !== true)
                    return null;

                var currentSelectedItem = this.model.get("selectedItem");
                if (currentSelectedItem == item) {
                    this.model.set("selectedItem", null);
                    $(eventArgs.currentTarget).removeClass("active");
                } else {
                    this.model.set("selectedItem", item);
                    $(eventArgs.currentTarget).addClass("active");
                }

                return item;
            }
        });
    });
