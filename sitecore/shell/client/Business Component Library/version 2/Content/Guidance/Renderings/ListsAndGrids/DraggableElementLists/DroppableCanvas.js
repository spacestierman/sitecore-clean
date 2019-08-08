(function (speak) {

  speak.pageCode([
    "bclDragAndDrop",
    "css!/sitecore/shell/client/Business Component Library/version 2/Content/Guidance/Renderings/ListsAndGrids/DraggableElementLists/DroppableCanvas.css"
  ], function (dragAndDrop) {
    return {
      initialized: function () {
        this.setDroppable(this.DropCanvas.el);
        dragAndDrop.setActiveDragArea(this.ScrollCanvas.el);

        document.addEventListener("keydown", this.deleteSelectedRendering.bind(this));

        // Enable auto scroll on entire main area and on ScrollablePanel that wraps droppable canvas 
        dragAndDrop.scrollable(document.querySelector('.sc-flx-content-pane'));
        dragAndDrop.scrollable(this.ScrollCanvas.el);
      },

      setDroppable: function (container) {
        dragAndDrop.droppable(container, {
          allowDrop: this.allowDropHandler.bind(this),
          onDrop: this.dropHandler.bind(this)
        });
      },

      allowDropHandler: function (info) {
        if (info.data.$itemId === "{79A848E7-608A-485B-99F6-4230BB97C5FE}") {
          return false;
        }
        return true;
      },

      dropHandler: function (info) {
        if (info.copy) {
          // it is a new element, that we need to create a rendering for
          return this.createRendering(info.data);
        } else {
          // a rendering was moved, returning that moved rendering to be inserted there
          return info.el;
        }
      },

      createRendering: function (data) {
        var rendering;
        switch (data.$itemId) {
          case "{C91A35CD-B8D0-40C7-8576-227AD45F126D}": {
            rendering = document.createElement("div");
            rendering.className = "myapp-textField";
            rendering.innerHTML = "<textarea>A textfield.</textarea>";
            break;
          }
          case "{1D9AF632-6B7B-4BD7-ADE1-3ED00A4C7741}": {
            rendering = document.createElement("div");
            rendering.className = "myapp-section";
            rendering.innerHTML = "<div class=\"myapp-droppable\"></div>";
            this.setDroppable(rendering.querySelector(".myapp-droppable"));
            break;
          }
          default: {
            throw new Error("Don't know how to render item with id " + data.$itemId);
          }
        }

        rendering.addEventListener("click", this.clickHandler.bind(this));
        return rendering;
      },

      deleteSelectedRendering: function (event) {
        if (event.keyCode === 46) {
          var selected = document.querySelector(".myapp-selected");
          if (selected) {
            // Using the modules remove method, allow the module to clean up and avoid memory leaks.
            dragAndDrop.remove(selected);
          } 
        }
      },

      clickHandler: function (event) {
        // stop bubbling to support nested click handling..
        event.stopImmediatePropagation();

        var prevSelected = document.querySelector(".myapp-selected");
        if (prevSelected) {
          prevSelected.classList.remove("myapp-selected");
        }

        var rendering = event.currentTarget;
        rendering.classList.add("myapp-selected");
      }
    }
  }, "DemoApp");

})(Sitecore.Speak);