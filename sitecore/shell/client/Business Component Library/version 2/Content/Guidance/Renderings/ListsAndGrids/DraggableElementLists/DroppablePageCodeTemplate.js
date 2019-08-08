(function (speak) {

  // Sample page code to setup a droppable area, with two basic callback hooks.
  // Example assumes you have a SPEAK component with the ID ScrollablePanel1 on your layout.

  speak.pageCode(["bclDragAndDrop"], function (dragAndDrop) {
    return {
      initialized: function () {
        dragAndDrop.droppable(this.ScrollablePanel1.el, {
          allowDrop: this.allowDrop.bind(this),
          onDrop: this.onDrop.bind(this)
        });
      },

      allowDrop: function (info) {
        // Allows any draggable to be dropped.
        return true;
      },

      onDrop: function (info) {
        // Insert the same rendering that is dropped.
        return info.el;
      }
    }
  });

})(Sitecore.Speak);