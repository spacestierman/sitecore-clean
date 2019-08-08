define(["sitecore"], function (Sitecore) {
    Sitecore.Factories.createBaseComponent({
        name: "SelectOptionsItem",
        base: "ButtonBase",
        selector: ".sc-insertItem-container",
        attributes: [
          { name: "isPressed", value: "$el.data:sc-ispressed" },
          { name: "displayName", value: "$el.data:sc-displayname" },
          { name: "itemId", value: "$el.data:sc-itemid" }
        ],

        init: function (object) {
            if (object.visited) {
                return;
            }
            object.visited = true;

            this.$el = object;

            if (this._super) {
                this._super();
            }

            this.$el.parent().find("ul").hide();

            this.model.on("change:isEnabled", this.toggleEnable, this);
            this.model.on("change:isVisible", this.toggleVisible, this);
            this.model.on("change:isPressed", this.togglePressed, this);

            object.mouseover(function (event) { object.addClass("hover"); });

            object.mouseout(function (event) { object.removeClass("hover"); });

            object.mousedown(function (event) {
                jQuery.each(object.parent().find(".selected"), function () {
                    $(this).removeClass("selected");
                });
                object.toggleClass("selected");
                object.toggleClass("hover");
                $(this).closest(".dialog-content").trigger("selectOptionPressed", object);
            });
        },

        initialize: function () {
            this.init(this.$el);
            var that = this;
            $(this.el.parentElement).bind("insertOptionAdded", function (event, element) {
                that.init($(element));
            });
        },
        toggleEnable: function () {
            if (!this.model.get("isEnabled")) {
                this.$el.addClass("disabled");
            } else {
                this.$el.removeClass("disabled");
            }
        },
        toggleVisible: function () {
            if (!this.model.get("isVisible")) {
                this.$el.hide();
            } else {
                this.$el.show();
            }
        },
        togglePressed: function () {
            if (this.model.get("isPressed"))
                this.$el.addClass("selected");
            else {
                this.$el.removeClass("selected");
            }
        },
    });
});