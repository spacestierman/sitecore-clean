define(["sitecore", "jquery"],
    function(sitecore, $) {
        "use strict";
        var defaultOptions = {
            items: null,
            pageIndex: 0,
            pageSize: 0,
            request: "",
            search: "",
            sorting: "",
            pagingMode: "appending",
            additionalParameters: {},
            hasItems: false,
            hasMoreItems: false,
            isBusy: false,
            itemsKey: "items",
            totalCount: 0
        };

        var model = sitecore.Definitions.Models.ComponentModel.extend(
            {
                initialize: function(options) {
                    this._super();
                    options = options || {};
                    this.set(_.extend({}, defaultOptions, options));

                    this.lastPage = 0;
                    this.pendingRequests = 0;
                    this.isReady = true;
                    this.isRefreshLoaded = false;
                    this.debouncedRefresh = _.debounce(this.refresh, 50);

                    this.attachHandlers();
                },

                attachHandlers: function() {
                    this.on(
                        "change:pageIndex change:pageSize change:request change:search change:sorting change:additionalParameters",
                        this.debouncedRefresh,
                        this
                    );
                },

                success: function(data) {
                    if (data.error) {
                        this.afterResponse();
                        return;
                    }

                    data = this.processData(data);
                    this.set("totalCount", data.totalCount);

                    var itemsKey = this.get("itemsKey"),
                        responseItems = data[itemsKey];

                    this.setItems(responseItems);

                    this.setHasItems();

                    this.processPendingRequest();
                },

                setItems: function (items) {

                    if (this.get("pagingMode") === "appending" && this.lastPage > 0 && !this.isRefreshLoaded) {
                        this.set("items", this.get("items") ? this.get("items").concat(items) : items);
                    } else {
                        this.set("items", items);
                        this.isRefreshLoaded = false;
                    }
                },

                setHasItems: function () {
                    var items = this.get("items");
                    if (items) {
                        this.set("hasItems", true);
                        this.set("hasMoreItems", items.length < this.get("totalCount"));
                    } else {
                        this.set("hasItems", false);
                        this.set("hasMoreItems", false);
                    }
                },

                processData: function(data) {
                    return data;
                },

                error: function() {
                    this.set("items", null);
                    this.set("hasItems", false);
                    this.set("hasMoreItems", false);
                    this.processPendingRequest();
                },

                processPendingRequest: function() {
                    this.pendingRequests--;
                    if (this.pendingRequests <= 0) {
                        this.afterResponse();
                    }
                },

                afterResponse: function() {
                    this.set("isBusy", false);
                    this.pendingRequests = 0;
                },

                checkRequestParameters: function() {
                    return true;
                },

                refresh: function () {
                    this.lastPage = 0;
                    // Changing of pageIndex triggers refresh method to be executed twice. 
                    //  {silent:true} prevents this.
                    this.set("pageIndex", this.lastPage, {silent: true});
                    if (this.checkRequestParameters()) {
                        this.getItems(this.lastPage);
                    }
                },

                refreshLoaded: function() {

                    var pageSize = this.get("pageSize"),
                        lastPage = this.lastPage,
                        dataSize = pageSize * (lastPage + 1);

                    this.isRefreshLoaded = true;

                    this.getItems(0, dataSize);
                },

                next: function() {
                    this.lastPage++;
                    if (this.get("pagingMode") === "paged") {
                        this.set("pageIndex", this.lastPage);
                    }

                    this.getItems(this.lastPage);
                },

                getParameters: function() {
                    return _.extend({
                        search: this.get("search"),
                        sorting: this.get("sorting")
                    }, this.get("additionalParameters"));
                },

                getItems: function(pageIndex, pageSize) {
                    if (!this.isReady || !this.get("request") || this.get("isBusy")) {
                        return;
                    }

                    pageSize = pageSize ? pageSize : this.get("pageSize");
                    pageIndex = pageIndex || 0;
                    var parameters = this.getParameters();
                    _.extend(parameters, { pageIndex: pageIndex, pageSize: pageSize });

                    var options = {
                        url: "/sitecore/api/ssc/" + this.get("request"),
                        data: parameters,
                        type: "POST",
                        success: _.bind(this.success, this),
                        error: _.bind(this.error, this)
                    };

                    this.pendingRequests++;
                    this.set("isBusy", true);

                    $.ajax(options);
                }
            }
        );

        /* test-code */
        model._defaultOptions = defaultOptions;
        /* end-test-code */

        return model;
    });