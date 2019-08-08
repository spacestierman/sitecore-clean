define(["sitecore", "jquery", "underscore", "/-/speak/v1/controls/searchdatasource.js"],
    function(Sitecore, $, _) {
        "use strict";
        var searchDataSourceModel = Sitecore.Definitions.Models.SearchDataSource,
            searchDataSourceView = Sitecore.Definitions.Views.SearchDataSource;

        var model = searchDataSourceModel.extend({
            initialize: function(options) {
                this._super();

                this.set("url", null);
                this.set("methodName", null);
                this.set("searchExpression", null);

                this.set("contactListType", null);
                this.set("segmentedListType", null);
                this.set("contactListPagePattern", null);
                this.set("segmentedListPagePattern", null);

                Sitecore.on("listManager:listCreated", this.refreshAfterListCreated, this);

                this.subscribeOnSelectList();
            },
            selectList: function(input) {
                var obj = $(input),
                    selectedItemId = obj.attr("data-id"),
                    type = obj.attr("data-type");
                var typeToCheck = type.toString().toLowerCase();
                switch (typeToCheck) {
                case this.get("contactListType").toLowerCase():
                    location.href = this.get("contactListPagePattern") + selectedItemId;
                    break;
                case this.get("segmentedListType").toLowerCase():
                    location.href = this.get("segmentedListPagePattern") + selectedItemId;
                    break;
                default:
                    break;
                }
            },
            subscribeOnSelectList: function() {
                Sitecore.on("select:list", this.selectList, this);
            },
            unsubscribeFromSelectList: function() {
                Sitecore.off("select:list", this.selectList, this);
            },
            refreshAfterListCreated: function() {
                var self = this;
                setTimeout(function() {
                        self.refresh();
                    },
                    500);
            },
            refresh: function() {
                this.set("pageIndex", 1);
                this.lastPage = 1;
                this.getItems();
            },
            next: function() {
                if (this.get("hasMoreItems") === true) {
                    this._super();
                }
            },
            getItems: function() {
                if (!this.isReady) {
                    return;
                }

                var url = this.get("url"),
                    methodName = this.get("methodName"),
                    options = this.getOptions();

                if (_.isNull(url) || _.isUndefined(url) || url === "") {
                    return;
                }

                if (!_.isNull(methodName) && !_.isUndefined(methodName) && methodName !== "") {
                    url = url.concat("/", methodName);
                }

                this.pendingRequests++;
                this.set("isBusy", true);

                var self = this;
                $.get(url, options, function(items) { self.completed(items, self); });
            },
            getOptions: function() {
                var options = this._super();

                options.searchExpression = this.get("searchExpression") || "";
                options.sc_lang = this.get("language") || "";

                return options;
            },

            completed: function (result, context) {
                var totalCount = result.TotalCount;
                var items = result.Items;

                if (context.get("pagingMode") === "appending" && context.lastPage > 1) {
                    items = context.get("items").concat(items);
                }

                context.set("totalItemsCount", totalCount);
                context.set("hasItems", items && items.length > 0);
                context.set("hasNoItems", !items || items.length === 0);
                context.set("hasMoreItems", items.length < totalCount);

                // encode provided data
                items.forEach(this.htmlEncode);

                context.set("items", items, { force: true });

                context.pendingRequests--;
                if (context.pendingRequests <= 0) {
                    context.set("isBusy", false);
                    context.pendingRequests = 0;
                }

                context.trigger("itemsChanged");
            },

            htmlEncode: function(el) {
                var helpElem = $("<div/>");
                el.Name = helpElem.text(el.Name).html();
            }
        });

        var view = searchDataSourceView.extend({
            initialize: function(options) {
                this._super();

                this.model.set("url", this.$el.attr("data-sc-url") || "");
                this.model.set("methodName", this.$el.attr("data-sc-methodname") || "");
                this.model.set("searchExpression", this.$el.attr("data-sc-searchexpression") || "");

                this.model.set("contactListType", this.$el.attr("data-sc-contactlisttype") || "");
                this.model.set("segmentedListType", this.$el.attr("data-sc-segmentedlisttype") || "");
                this.model.set("contactListPagePattern", this.$el.attr("data-sc-contactlistpagepattern") || "");
                this.model.set("segmentedListPagePattern", this.$el.attr("data-sc-segmentedlistpagepattern") || "");

                this.model.on("change:url change:methodName change:searchExpression",
                    this.model.refresh,
                    this.model);
                this.model.isReady = true;

                if (this.$el.attr("data-sc-skipinitialize") !== "true") {
                    this.model.refresh();
                }
            }
        });

        return Sitecore.Factories.createComponent("ListsDataSource", model, view, ".sc-ListsDataSource");
    });