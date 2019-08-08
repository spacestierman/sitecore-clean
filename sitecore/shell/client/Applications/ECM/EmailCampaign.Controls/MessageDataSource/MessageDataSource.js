define(["jquery", "sitecore", "/-/speak/v1/ecm/DataSourceBase.js"], function ($, sitecore, DataSourceBase) {
  "use strict";

  var model = DataSourceBase.model.extend(
    {
      initialize: function () {
        this._super();

        this.set("data", "");
        this.set("managerRootId", "");
        this.set("messageId", "");
        this.set("messageListType", "");
        this.set("itemsKey", "messages");
        this.set("messages", null);

      },

      attachHandlers: function() {
          this._super();
          this.on("change:managerRootId change:messageListType", this.debouncedRefresh, this);
          this.on("change:items", function() {
              this.set("messages", this.get("items"));
          }, this);
      },

      processData: function (data) {
          var items = data[this.get("itemsKey")] || this.get("items");
          _.each(items, function (item) {
              item.abTestText = item.hasAbn ?
                sitecore.Resources.Dictionary.translate("ECM.Pages.Recipients.Yes") :
                "";
          });
          return data;
      },

      checkRequestParameters: function() {
          return this.get("managerRootId") !== undefined || this.get("messageId") !== undefined;
      },

      getParameters: function () {
          var parameters = this._super();
          _.extend(parameters, {
              managerRootId: this.get("managerRootId"),
              messageId: this.get("messageId"),
              type: this.get("messageListType")
          });
          return parameters;
      }
    }
  );

  var view = DataSourceBase.view.extend(
    {
      parseAttributes: function () {
          this._super();
          this.model.set("data", this.$el.attr("data-sc-data"));
          this.model.set("managerRootId", this.$el.attr("data-sc-managerrootid"));
          this.model.set("messageId", this.$el.attr("data-sc-messageid"));
          this.model.set("messageListType", this.$el.attr("data-sc-messagelisttype"));
      }
    }
  );

  sitecore.Factories.createComponent("MessageDataSource", model, view, "script[type='text/x-sitecore-ecm-messagedatasource']");
});