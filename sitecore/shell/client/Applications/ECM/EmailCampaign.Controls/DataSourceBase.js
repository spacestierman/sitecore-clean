define(["sitecore", "/-/speak/v1/ecm/ListDataModelBase.js"], function (sitecore, ListDataModelBase) {
    "use strict";

    var model = ListDataModelBase;

    var view = sitecore.Definitions.Views.ComponentView.extend(
      {
          listen: window._.extend({}, sitecore.Definitions.Views.ComponentView.prototype.listen, {
              "refresh:$this": "refresh",
              "next:$this": "next"
          }),

          initialize: function () {
              this._super();

              this.parseAttributes();

              this.model.set("pagingMode", this.$el.attr("data-sc-pagingmode") || "appending");
              this.model.isReady = true;
              this.refresh();
          },

          parseAttributes: function() {
              this.model.set("pageIndex", parseInt(this.$el.attr("data-sc-pageindex"), 10) || 0);
              this.model.set("pageSize", parseInt(this.$el.attr("data-sc-pagesize"), 10) || 0);
              this.model.set("request", this.$el.attr("data-sc-request"));
              this.model.set("search", this.$el.attr("data-sc-search"));
              this.model.set("sorting", this.$el.attr("data-sc-sorting"));
          },

          refresh: function () {
              this.model.debouncedRefresh();
          },

          next: function () {
              this.model.next();
          }
      }
    );

    return { model: model, view: view };
});