(function (speak) {
  /**
   * Uses HTML5 Drag n drop capabilities by default.
   * If you whish to override the drag'n'drop lib uses, simply override DragHandler property, with a custom DragHelper function.
   */
  speak.component(["bclCollection", "bclDragAndDrop"], function (Collection, dragAndDrop) {
    var DraggableElement = Collection.factory.createBaseModel({
      IsDisabled: false,
      BackgroundColor: "",
      Icon: "",
      SpritePosition: "",
      Text: ""
    });

    function getDragData(el) {
      var value = el.getAttribute("data-sc-value");
      return this.getByValue(value);
    }

    return speak.extend({}, Collection.prototype, {
      Model: DraggableElement,

      initialized: function () {
        Collection.prototype.initialized.call(this);
        dragAndDrop.draggable(this.el.querySelector(".sc-listIterator"), {
          copy: true,
          getDragData: getDragData.bind(this)
        });
      },

      getBackgroundClass: function (color) {
        if (!color)
          return '';

        return 'sc-bg-' + color.toLowerCase();
      }
    });

  }, "DraggableElementList");
})(Sitecore.Speak);