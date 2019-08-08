# How to use drag and drop module

This guide aims to be a tutorial / guide on how to setup drag and drop capabilities.

## Using the module

Application developers perform the following steps to set up a page that supports drag and drop in their application.

1. Create a SPEAK task page (suggestion: use the `PredefinedTaskPage` template).
1. Add the `DraggableElementList` to the `ContextDetails.Content` placeholder.
1. Add a container component (such as a `ScrollablePanel`) to the `Content` placeholder.
1. Write page code to register the container as a droppable area with the `DragAndDrop` module. 

When registering the droppable area, you can optionally configure callback methods to restrict which draggable elements the user may drop into the droppable area and to respond when the user drops an element into the area.

By default, the droppable area accepts all draggable elements and when the user drops an element, the module places a copy of the element in the container. The module provides information (as parameters to the callback methods) which allow the application developer to override this default behavior to meet their application's business requirements.

The module supports nested droppable areas and each droppable area may configure its own callbacks, so different droppable areas may accept and reject different draggable elements.

## How it works

The drag and drop module operates on the DOM, and thus works for both SPEAK and non-SPEAK components. Drag and drop module works by registering HTML elements as either a `draggable` or `droppable` container on the DragAndDrop module API.

Registering a draggable and droppable are two different processes, that can be done independently of each other. This allows SPEAK to implement the draggable part, and applications to implement the droppable part without knowing much about the technical implementation, with the lowest denominator being HTML elements.

## Getting started

To get started, you will need to have a PageCode, a SubPageCode, a Component or something similar that allows you to write some JavaScript.

From there you should import the DragAndDrop module as a dependency. Here is an example doing that from a PageCode:

```js
(function (speak) {
  speak.pageCode(["bclDragAndDrop"], function (dragAndDrop) {
    return {
      initialized: function () {
        // Code here..
      }
    }
  });
})(Sitecore.Speak);
```

This gives you a reference to the DragAndDrop module and you are now ready to mark elements as either draggables or droppables.

## Walk-through: How to register a droppable area

Imagine that you already have DraggableElementList inserted on a page. Next you want to define a droppable area that elements from the DraggableElementList can be dropped into.

1. Insert a component on your layout that will work as a container. For this example, lets us add a ScrollablePanel component to the page and set the component ID to `DropArea`, and its height to `300px`.
1. In your pageCodes initialized method, call dragAndDrop modules droppable method.
1. Set minHeight on DropArea, as we can not drop anything to a non-visible container.
1. You should now be able to drag elements from DraggableElementList into the DropArea.

```js
(function (speak) {
  speak.pageCode(["bclDragAndDrop"], function (dragAndDrop) {
    return {
      initialized: function () {
        dragAndDrop.droppable(this.DropArea.el);
      }
    }
  });
})(Sitecore.Speak);
```

### Control what elements can be dropped

You might only want certain elements to be allowed to drop into you container, or maybe only one of the DraggableElementList's on the page should be allowed to drop to your drop area.

To control what can be dropped, you should provide a allowDrop callback to the dragAndDrop module, while registering your drop area.

Following snippet shows how to change parts of your PageCode to add an allowDrop callback, that always allows elements to be dropped.

```js
return {
  initialized: function () {
    dragAndDrop.droppable(this.DropArea.el, {
      allowDrop: this.allowDrop
    });
  },

  allowDrop: function (dragInfo) {
    return true;
  }
}
```

Now let us add some code to not allow the element with ID `{1D9AF632-6B7B-4BD7-ADE1-3ED00A4C7741}` being dragged from a DraggableElementList.

```js
allowDrop: function (dragInfo) {
  var item = dragInfo.data;
  if (item.$itemId === "{1D9AF632-6B7B-4BD7-ADE1-3ED00A4C7741}") {
    return false;
  }
  return true;
}
```

Note: The data property is a specialized property that contains information specified by the draggable source. In this case DraggableElementList provides by default serialized items to the data property.

### Control what is being rendered upon dropping an element into a droppable area

Rendering a custom component on drop is easy to do with the onDrop callback option. Like the allowDrop callback, you register the onDrop callback when setting the droppable container.

Here is an example that shows how to set up an onDrop callback, with default behavior, where you are just inserting the dragged element.

```js
return {
  initialized: function () {
    dragAndDrop.droppable(this.DropArea.el, {
      allowDrop: this.allowDrop,
      onDrop: this.onDrop
    });
  },

  allowDrop: function (dragInfo) {
    var item = dragInfo.data;
    if (item.$itemId === "{1D9AF632-6B7B-4BD7-ADE1-3ED00A4C7741}") {
      return false;
    }
    return true;
  },

  onDrop: function (dragInfo) {
    return dragInfo.el;
  }
}
```

Advancing the scenario, we can now try to return custom elements to be inserted instead based on the `dragInfo` provided.

```js
onDrop: function (dragInfo) {
  var rendering,
    data = dragInfo.data;
  
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
      
      dragAndDrop.droppable(rendering.querySelector(".myapp-droppable"), {
        allowDrop: this.allowDrop,
        onDrop: this.onDrop
      });
      break;
    }
    default: {
      throw new Error("Don't know how to render item with id " + data.$itemId);
    }
  }

  return rendering;
}
```

Note: Noticed how we mark one of the custom renderings as droppable? The drag and drop module supports nested droppables!

## Walk-through: How to register a draggable area

Imagine that you already have a droppable area defined. Lets create a list of elements, that you can drag to that area.

The drag and drop module works on the DOM and doesn't know anything about SPEAK. Thus we can drag a SPEAK elements DOM element, or any other DOM element. For this demo I will setup a simple fictional SPEAK `SimpleList` component, that just renders a static list of 5 elements.

Here's the markup you would see in the `.cshtml` file for the SPEAK component:

```html
<ul @Model.HtmlAttributes>
  <li>Element 1</li>
  <li>Element 2</li>
  <li>Element 3</li>
  <li>Element 4</li>
  <li>Element 5</li>
</ul>
```

The Speak component JS file, loading the drag and drop module as a dependency:

```js
(function (speak) {
  speak.component(["bclDragAndDrop"], function (dragAndDrop) {

    return {
      name: "SimpleList",
      initialized: function () {
        // code here..
      }
    };
  });

})(Sitecore.Speak);
```

Now with the module in place, we can now mark the root DOM element as a `draggable` container by adding the following code to our `initialized` method:

```js
initialized: function () {
  dragAndDrop.draggable(this.el);
}
```

That is all that is required to enable dragging from a draggable to an already defined droppable.

### How to drag a copy, instead of moving the original element

You can initiate the dragging a copy instead of moving the element from the original place by setting the `copy` option. Here is an example on how to set the copy option:

```js
initialized: function () {
  dragAndDrop.draggable(this.el, {
    copy: true
  });
}
```

### How to provide additional data to the drop areas `onDrop` and `allowDrop` callbacks

The drag and drop module provides a callback for draggables, that once a drag is initiated, will ask the draggable if there is any data associated with the element being dragged. Providing more data than just the element being dragged, is an easy way for the droppable to make decisions if they should accept the content to be dropped in that area.

The `allowDrop` and `onDrop` callbacks already get a lot of info, like what the target, source and the element being dragged is, as well as if it is a copy or it is being moved.

Here is an example where we provide the elements index as additional info:

```js
initialized: function () {
  dragAndDrop.draggable(this.el, {
    copy: true,
    getDragData: this.getDragData,
  });
},

getDragData: function (element) {
  var nodeList = Array.prototype.slice.call( element.parent.children );
  return { index: nodeList.indexOf(element) };
}
```

In a more real scenario, you probably want to provide something like a Sitecore item id, or an object representation of a Sitecore item. The DraggableElementList provides an item object containing all relevant information from the configuration of the list.