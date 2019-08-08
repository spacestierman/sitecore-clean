(function (speak) {
    speak.pageCode(["itemJS", "css!/-/speak/v1/formsbuilder/navigation/create.css"], function (itemJS) {
        var blankFormId = "{AC27A304-1EED-487B-965E-C993C561C6A7}";
        return {
            initialized: function () {
                this.on({
                    "formItemClick": this.formItemClick
                }, this);

                this.CreateFormDataSource.on("itemsChanged", this.appendBlankForm, this);
                this.CreateFormDataSource.on("change:Items", this.dataSourceItemsChanged, this);
                this.CreateFormDataSource.on("change:IsBusy change:HasMoreData", this.updateListEndlessScroll, this);

                var self = this;
                this.CreatePopover.$targetEl.on('show.bs.popover', function () {
                    self.CreateFormListControl.trigger("change:MaxRows");
                });
            },

            formItemClick: function (data) {
                var item = data.sender.ClickedItem;
                if (!item)
                    return;

                var selectedItemId = item.$itemId;
                var isBlankForm = blankFormId === selectedItemId;

                speak.trigger("sc-create-form-message", isBlankForm ? "" : selectedItemId);
            },

            updateListEndlessScroll: function () {
                this.CreateFormListControl.IsEndlessScrollEnabled = !this.CreateFormDataSource.IsBusy && this.CreateFormDataSource.HasMoreData;
            },

            dataSourceItemsChanged: function() {
                this.CreateFormDataSource.Items.forEach(function(item) {
                    item.$url = "javascript:;";
                });

                this.CreateFormListControl.DynamicData = this.CreateFormDataSource.Items;
            },

            appendBlankForm: function () {
                if (this.CreateFormDataSource.PageIndex !== 0) {
                    return;
                }

                if (speak.utils.is.an.object(this.BlankFormItem)) {
                    if (this.BlankFormItem !== this.CreateFormDataSource.Items[0]) {
                        var items = [this.BlankFormItem].concat(this.CreateFormDataSource.Items);
                        this.CreateFormDataSource.set("Items", items, false);
                    }
                    return;
                }

                var self = this;
                var options = {
                    language: this.CreateFormDataSource.LanguageName
                }

                itemJS.fetch(blankFormId, options, function (item, result) {
                    if (result.result.statusCode === 401) {
                        speak.module("bclSession").unauthorized();
                        return;
                    }

                    if (item != null) {
                        item["__Thumbnail"] = item.$mediaurl;
                        self.BlankFormItem = item;
                        var items = [item].concat(self.CreateFormDataSource.Items);
                        self.CreateFormDataSource.set("Items", items, false);
                    }
                });
            }
        };
    }, "CreateSubAppRenderer");
})(Sitecore.Speak);