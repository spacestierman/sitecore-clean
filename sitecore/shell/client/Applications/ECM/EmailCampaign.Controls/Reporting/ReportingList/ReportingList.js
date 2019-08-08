define([
    "sitecore",
    "/-/speak/v1/ecm/constants.js",
    "/-/speak/v1/ecm/CompositeComponentBase.js",
    "/-/speak/v1/ecm/MessageService.js",
    "/-/speak/v1/ecm/ManagerRootService.js"
], function (
    sitecore,
    constants,
    CompositeComponentBase,
    MessageService,
    ManagerRootService
    ) {
    var defaultDataModel = "ReportingListDataModel";
    var model = sitecore.Definitions.Models.ComponentModel.extend({
        initDataModel: function () {
            this.set("isBusy", true);
            require([constants.JsResourcePrefixes.EXM + (this.get("dataModel") || defaultDataModel) + '.js'],
                _.bind(function (dataModel) {
                    this.set("isBusy", false);
                    this.detachDataSourceHandlers();
                    this.set("dataSource", new dataModel());
                    this.updateDataSource();
                    this.attachDataSourceHandlers();
                }, this));
        },
        detachDataSourceHandlers: function () {
            this.off("change:request", null, this);
            this.off("change:pageSize", null, this);
            this.off("change:pageIndex", null, this);
            this.off("change:sorting", null, this);
        },
        attachDataSourceHandlers: function () {
            var debouncedUpdate = _.debounce(this.updateDataSource, 50);
            this.on("change:request change:pageSize change:pageIndex change:sorting", debouncedUpdate, this);
        },

        updateDataSource: function () {
            var messageId = MessageService.messageContext ?
                    MessageService.messageContext.get("messageId") : "",
                rootId = ManagerRootService.getSelectedRoot(),
                additionalParameters = {
                    messageId: messageId,
                    managerRootId: rootId
                },
                dataSource = this.get("dataSource");

            dataSource.set({
                request: this.get("request"),
                pageSize: this.get("pageSize"),
                pageIndex: this.get("pageIndex"),
                sorting: this.get("sorting"),
                additionalParameters: additionalParameters
            });
        }
    });
    var view = CompositeComponentBase.view.extend({
        childComponents: ["List", "Search", "ViewMore", "ProgressIndicator"],
        initialize: function () {
            this._super();
            this.attachHandlers();
            this.model.set("dataModel", this.$el.attr("data-sc-datamodel"));
            this.model.set("request", this.$el.attr("data-sc-request"));
            this.model.set("pageSize", this.$el.attr("data-sc-pagesize"));
            this.model.set("pageIndex", this.$el.attr("data-sc-pageindex"));
            var isSearchable = this.$el.attr("data-sc-issearchable");
            this.model.set("isSearchable", isSearchable ? (!!parseInt(isSearchable)) : true);
            this.children.ProgressIndicator.set("targetControl", this.children.List.get("name"));
            this.model.initDataModel();
        },

        attachHandlers: function () {
            this.model.on({
                "change:dataSource": this.onChangeDataSource,
                "change:isSearchable": this.onChangeIsSearchable
            }, this);

            var searchButton = this.children.Search.viewModel.$el.find("button.btn:first");
            searchButton.on("click.reportinglist", _.bind(this.onSearchButtonClick, this));
            this.children.ViewMore.viewModel.$el.on("click", function(e) {
                e.preventDefault();
            });
            this.children.Search.viewModel.$el.on("keypress", _.bind(this.onSearchKeyPress, this));
            this.children.List.on("change:sorting", function() {
                this.model.get("dataSource").set("sorting", this.children.List.get("sorting"));
            }, this);
        },

        onSearchKeyPress: function(e) {
            if (e.keyCode === 13 || e.which === 13) {
                this.onSearchButtonClick();
            }
        },

        onChangeIsSearchable: function () {
            var isSearchable = this.model.get("isSearchable");
            this.children.Search.set("isVisible", isSearchable);
            this.$el[isSearchable ? "addClass" : "removeClass"]("searchable");
        },

        onChangeDataSource: function() {
            this.toggleViewMoreButton();
            this.attachDataSourceHandlers();
        },

        attachDataSourceHandlers: function () {
            var prevDataSource = this.model.previous("dataSource"),
                currentDataSource = this.model.get("dataSource");
            if (prevDataSource) {
                prevDataSource.off("change:items", this.updateList);
                prevDataSource.off("change:hasMoreItems", this.toggleViewMoreButton);
                prevDataSource.off("change:isBusy", this.toggleProgressIndicator);
                this.children.ViewMore.viewModel.$el.off("click.view.more");
            }

            if (currentDataSource) {
                currentDataSource.on("change:items", this.updateList, this);
                currentDataSource.on("change:hasMoreItems", this.toggleViewMoreButton, this);
                currentDataSource.on("change:isBusy", this.toggleProgressIndicator, this);
                this.children.ViewMore.viewModel.$el.on("click.view.more", _.bind(this.onClickViewMore, this));
            }
        },

        onClickViewMore: function() {
            this.model.get("dataSource").next();
        },

        toggleProgressIndicator: function () {
            var dataSource = this.model.get("dataSource");
            if (dataSource) {
                var isDataSourceBusy = this.model.get("dataSource").get("isBusy"),
                isListVisible = this.children.List.viewModel.$el.is(":visible");
                this.children.ProgressIndicator.set("isBusy", isListVisible && isDataSourceBusy);
            }
        },

        toggleViewMoreButton: function() {
            var dataSource = this.model.get("dataSource");
            this.children.ViewMore.set("isVisible", dataSource.get("hasMoreItems"));
        },

        onSearchButtonClick: function() {
            var searchText = this.children.Search.get("text");
            this.model.get("dataSource").set("search", searchText);
        },

        updateList: function() {
            this.children.List.set("items", this.model.get("dataSource").get("items"));
        }
    });
    sitecore.Factories.createComponent("ReportingList", model, view, ".sc-ReportingList");
    return { view: view, model: model };
});