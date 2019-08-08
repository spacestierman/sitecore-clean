define(["dragula", "autoScroll", "css!dragula"], function (dragula, autoScroll) {
  // Static helper function
  // http://ejohn.org/blog/comparing-document-position/
  function contains(a, b) {
    return a.contains ?
      a != b && a.contains(b) :
      !!(a.compareDocumentPosition(b) & 16);
  }

  // private state
  var draggables = new Map();
  var droppables = new Map();
  var scrollables = new Map();
  var activeDragArea = null;
  var draggedElement;
  var draggedSource;

  // private functions
  function allowDrop(el, target, source) {
    if (!droppables.has(target)) {
      return false;
    }

    var dropOptions = droppables.get(target);
    var dragOptions = draggables.get(source);

    return dropOptions.allowDrop({
      copy: dragOptions.copy,
      data: dragOptions.getDragData(el),
      target: target,
      source: source,
      el: el
    });
  }

  function isEmptyDroppable(container, shadow) {
    return container.contains(shadow) && container.children.length === 1;
  }

  function isNestedDroppable(container) {
    var isNested = false;
    droppables.forEach(function (value, target) {
      if (isNested || target === container) return;

      if (target.contains(container) || container.contains(target)) {
        isNested = true;
        return;
      }
    });
    return isNested;
  }

  function showDroppablesHighlight() {
    if (!draggedElement || !draggedSource) {
      return;
    }

    droppables.forEach(function (value, target) {
      if (allowDrop(draggedElement, target, draggedSource)) {
        target.classList.add("sc-state-drop-default");
      }
    });
  }

  function hideDroppablesHighlight() {
    var highlights = Array.prototype.slice.call(document.querySelectorAll(".sc-state-drop-default"));
    highlights.forEach(function (container) {
      container.classList.remove("sc-state-drop-default");
    });
  }

  // Initialize dragula and attach event listeners
  var drake = dragula({
    moves: function (el, source, handle, sibling) {
      return draggables.has(source);
    },

    copy: function (el, source) {
      return draggables.has(source) && draggables.get(source).copy;
    },

    accepts: function (el, target, source, sibling) {
      // This check is to support nested dragging and dropping
      var tryingToInsertDraggableInsideItself = contains(el, target);
      if (tryingToInsertDraggableInsideItself) {
        return false;
      }

      return allowDrop(el, target, source);
    }
  });

  var autoScroller = autoScroll([], {
    margin: 40,
    scrollWhenOutside: false,
    autoScroll: function () {
      return this.down && drake.dragging;
    }
  });

  drake.on("drag", function (el, source) {
    draggedElement = el;
    draggedSource = source;

    if (!activeDragArea) {
      showDroppablesHighlight();
    }
  });
    
  drake.on("shadow", function (el, container, source) {
    if (isEmptyDroppable(container, el) && !isNestedDroppable(container)) {
      el.classList.add("sc-drag-noshadow");
    } else {
      el.classList.add("sc-drag-shadow");
    }
  });

  drake.on("dragend", function (el) {
    el.classList.remove("sc-drag-shadow");
    el.classList.remove("sc-drag-noshadow");

    draggedElement = null;
    draggedSource = null;
    hideDroppablesHighlight();
  });

  drake.on("over", function (el, container, source) {
    if (!droppables.has(container)) {
      return;
    }

    var clone = document.querySelector('.gu-mirror');
    if (clone) {
      clone.classList.add("sc-state-drag-allowed");
    }

    container.classList.add("sc-state-drop-allowed");
  });

  drake.on("out", function (el, container, source) {
    if (!droppables.has(container)) {
      return;
    }

    var clone = document.querySelector('.gu-mirror');
    if (clone) {
      clone.classList.remove("sc-state-drag-allowed");
    }
    container.classList.remove("sc-state-drop-allowed");
  });

  drake.on("drop", function (el, target, source, sibling) {
    if (!droppables.has(target)) {
      return;
    }

    var dragOptions = draggables.get(source);
    var dropOptions = droppables.get(target);

    var newEl = dropOptions.onDrop({
      copy: dragOptions.copy,
      data: dragOptions.getDragData(el),
      target: target,
      source: source,
      el: el
    });
    target.replaceChild(newEl, el);
  });

  // Module export
  return {
    /**
     * Mark a DOM element to be droppable
     */
    setActiveDragArea: function (element) {
      this.clearActiveDragArea();
      activeDragArea = element;
      activeDragArea.addEventListener("mouseenter", showDroppablesHighlight);
      activeDragArea.addEventListener("mouseleave", hideDroppablesHighlight);
    },

    clearActiveDragArea: function () {
      if (!activeDragArea) {
        return;
      }

      activeDragArea.removeEventListener("mouseenter", showDroppablesHighlight);
      activeDragArea.removeEventListener("mouseleave", hideDroppablesHighlight);
      activeDragArea = null;
    },

    /**
     * Given the dragged element, give some data to the droppable handlers (i.e. allowDrop and onDrop).
     * @callback getDragDataCallback
     * @param {Element} Element being dragged
     * @returns You can return any value to be parsed on to the droppable handlers
     */
    /**
     * Give an element, in which all sub elements are draggable.
     * 
     * @param {Element} container The DOM Element that contains elements that can be dragged
     * @param {Object} [options] Optional flags to control draggable behavior
     * @param {boolean} [options.copy=false] When true, ensures element is cloned instead of moved
     * @param {getDragDataCallback} [options.getDragData] Defaults to return the dragged element
     */
    draggable: function (container, options) {
      options = options || {};
      draggables.set(container, {
        copy: options.copy || false,
        getDragData: options.getDragData || function (el) { return el }
      });
      drake.containers.push(container);
    },

    /**
     * @callback allowDropCallback
     * @param {Object} info
     * @param {boolean} info.copy Is dragged element cloned or moved
     * @param {Element} info.el The element currently being dragged
     * @param {Element} info.target The container marked as droppable, that we ask if we are allowed drop the dragged element (info.el) to
     * @param {Element} info.source The container marked as draggable, where the dragged element (info.el) is dragged from
     * @param {Element|Object|*} info.data Data defined by draggable handler
     * @returns {boolean} When true, you accept dragged element to be added to the target
     */
    /**
     * @callback onDropCallback
     * @param {Object} info
     * @param {boolean} info.copy Is dropped element cloned or moved
     * @param {Element} info.el The element dropped
     * @param {Element} info.target The container dropped to
     * @param {Element} info.source The container dragged from
     * @param {Element|Object|*} info.data Data defined by draggable handler
     * @returns {Element} Return the element you whish to be rendered on drop.
     */
    /**
     * Enabling an element to allow draggable elements to be dropped.
     * By default we allow to drag newly dropped elements by also marking the droppable as a draggable container.
     * 
     * @param {Element} container The DOM Element that can recieve droppable elements.
     * @param {Object} [options] Optional hooks to control droppable behavior.
     * @param {allowDropCallback} [options.allowDrop=function] Callback to determine allowance of element to be dragged to a droppable
     * @param {onDropCallback} [options.onDrop=function] Callback to get rendering of dropped element. This allows custom rendering when element is dropped
     * @param {boolean} [options.disableDraggableChildren=false] If true, children can not be dragged once dropped.
     */
    droppable: function (container, options) {
      options = options || {};
      droppables.set(container, {
        allowDrop: options.allowDrop || function (info) { return true; },
        onDrop: options.onDrop || function (info) { return info.el }
      });

      if (!options.disableDraggableChildren) {
        // Not setting the copy flag, allows us to treat sorting differently from dragging new elements
        this.draggable(container);
      }

      drake.containers.push(container);
    },

    /**
     * Deleted the element from DOM and cleans up any references made by the module to avoid memory leaks.
     * Under the hood it calls #unregister after removing the element from DOM.
     * @param {Element} element Element to remove from DOM and to cleanup references for.
     * @returns {boolean} Returns true, if removed element was registered by module.
     */
    remove: function (element) {
      // Remove it from the DOM
      element.remove();

      return this.unregister();
    },

    /**
     * Remove the element from internal state.
     * @param {Element} element Element to remove from DOM and to cleanup references for.
     * @returns {boolean} Returns true, if removed element was registered by module.
     */
    unregister: function (element) {
      // Remove from internal state
      draggables.delete(element);
      droppables.delete(element);

      // Remove from Dragula
      var registered = false,
        contains = false;

      do {
        var index = drake.containers.indexOf(element);
        contains = index !== -1;
        registered = registered || contains;

        if (contains) {
          drake.containers.splice(index, 1);
        }
      } while(contains);

      

      return registered;
    },

    scrollable: function (container) {
      autoScroller.add(container);
    }
  };
});