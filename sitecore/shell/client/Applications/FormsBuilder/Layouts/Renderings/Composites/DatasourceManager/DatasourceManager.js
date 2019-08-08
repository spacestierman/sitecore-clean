(function (speak) {
    var dynamicId = "{93F6FE58-1B04-4094-ABE5-644AD05CF24C}";
    var staticId = "{37A5572A-3512-4013-9498-07D8AC17B2F8}";

    speak.component([], function () {
        return {
            initialized: function () {
                this.CompItems = [];

                this.defineComputedProperty("InnerDatasourceComponent", function () {
                    return this.IsDynamic ? this.DynamicDatasource : this.StaticDatasource;
                });

                this.on({
                    "change:IsDynamic": this.updatedIsDynamic,
                    "change:CompItems": this.updatedCompItems,
                    "change:CompDatasourceGuid": this.updatedCompDatasourceGuid,
                    "change:CompDisplayFieldName": this.updatedCompDisplayFieldName,
                    "change:CompValueFieldName": this.updatedCompValueFieldName
                }, this);

                this.DatasourceTypeSelector.on("change:SelectedValue", this.updateDatasourceType, this);

                this.StaticDatasource.on({
                    "change:KeyValuePairArray": this.updatedInnerItems,
                    "change:CurrentDisplayFieldName": this.updatedInnerDisplayFieldName,
                    "change:CurrentValueFieldName": this.updatedInnerValueFieldName,
                    "change:DataSourceGuid": this.updatedInnerDatasourceGuid
                }, this);

                this.DynamicDatasource.on({
                    "change:Items": this.updatedInnerItems,
                    "change:CurrentDisplayFieldName": this.updatedInnerDisplayFieldName,
                    "change:CurrentValueFieldName": this.updatedInnerValueFieldName,
                    "change:DataSourceGuid": this.updatedInnerDatasourceGuid
                }, this);
            },

            reset: function () {
                if (this.StaticDatasource.KeyValuePairArray.length) {
                    this.StaticDatasource.KeyValuePairArray = [];
                }
                this.StaticDatasource.CurrentDisplayFieldName = "";
                this.StaticDatasource.CurrentValueFieldName = "";
                this.StaticDatasource.DataSourceGuid = "";

                if (this.DynamicDatasource.Items.length) {
                    this.DynamicDatasource.Items = [];
                }
                this.DynamicDatasource.CurrentDisplayFieldName = "";
                this.DynamicDatasource.CurrentValueFieldName = "";
                this.DynamicDatasource.DataSourceGuid = "";
            },

            updatedIsDynamic: function () {
                this.DatasourceTypeSelector.SelectedValue = this.IsDynamic ? dynamicId : staticId;

                this.DynamicDatasource.IsVisible = this.IsDynamic;
                this.StaticDatasource.IsVisible = !this.IsDynamic;

                this.updatedInnerItems();
                this.updatedInnerDisplayFieldName();
                this.updatedInnerValueFieldName();
                this.updatedInnerDatasourceGuid();
            },

            updatedCompDatasourceGuid: function () {
                this.InnerDatasourceComponent.DataSourceGuid = this.CompDatasourceGuid;
            },

            updatedCompDisplayFieldName: function () {
                this.InnerDatasourceComponent.CurrentDisplayFieldName = this.CompDisplayFieldName;
            },

            updatedCompValueFieldName: function () {
                this.InnerDatasourceComponent.CurrentValueFieldName = this.CompValueFieldName;
            },

            updatedCompItems: function (items) {
                if (this.IsDynamic) {
                    if (items !== this.InnerDatasourceComponent.Items) {
                        this.InnerDatasourceComponent.reset(items);
                    }
                }
                else {
                    this.InnerDatasourceComponent.KeyValuePairArray = items;
                }
            },

            updateDatasourceType: function (id) {
                this.IsDynamic = id === dynamicId;
            },

            updatedInnerDatasourceGuid: function () {
                this.CompDatasourceGuid = this.InnerDatasourceComponent.DataSourceGuid;
            },

            updatedInnerDisplayFieldName: function () {
                this.CompDisplayFieldName = this.InnerDatasourceComponent.CurrentDisplayFieldName;
            },

            updatedInnerValueFieldName: function () {
                this.CompValueFieldName = this.InnerDatasourceComponent.CurrentValueFieldName;
            },

            updatedInnerItems: function () {
                var items = this.IsDynamic ? this.InnerDatasourceComponent.Items : this.InnerDatasourceComponent.KeyValuePairArray;
                if (items !== this.CompItems) {
                    this.CompItems = items;
                }
            }
        };
    }, "DatasourceManager");
})(Sitecore.Speak);