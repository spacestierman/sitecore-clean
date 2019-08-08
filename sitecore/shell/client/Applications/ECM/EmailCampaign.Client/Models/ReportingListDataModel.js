define([
    "sitecore",
    "/-/speak/v1/ecm/ListDataModelBase.js",
    "/-/speak/v1/ecm/MathHelper.js"
],
    function (
        sitecore,
        ListDataModelBase,
        MathHelper
    ) {
        "use strict";

        var model = ListDataModelBase.extend(
            {
                processData: function(data) {
                    var items = data[this.get("itemsKey")] || [];
                    _.each(items, _.bind(function(item) {
                        this.processDataItem(item);
                    }, this));
                    return data;
                },

                processDataItem: function (item) {
                    this.processDates(item);
                    _.each(item, _.bind(function (value, key) {
                        var processedValue = this.roundFloat(this.processEmptyValue(value));
                        item[key] = processedValue;
                    }, this));
                },

                processDates: function(item) {
                    if (item.dateFormatted) {
                        item.shortDate = item.dateFormatted.shortDate;
                        item.longDate = item.dateFormatted.longDate;
                    }
                },

                roundFloat: function(value) {
                    if (MathHelper.isFloat(value)) {
                        return parseFloat(value.toFixed(2));
                    } else {
                        return value;
                    }
                },

                processEmptyValue: function (value) {
                    return value || "-";
                }
            }
        );
        return model;
    });