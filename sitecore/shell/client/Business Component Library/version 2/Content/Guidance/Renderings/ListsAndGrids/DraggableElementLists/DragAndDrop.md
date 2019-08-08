# The drag and drop module

The SPEAK 2 `DragAndDrop` module adds support for drag and drop operations to SPEAK 2 applications.  The module supports both native SPEAK 2 and integrated components implemented using other frameworks (such as Angular 2 or React).  

The module introduces the concepts of a `draggable` object and a `droppable` container.  The SPEAK 2 BCL provides a `DraggableElementList` component, which provides a standard interface for a drag and drop toolbox.  Applications use this module to register one or more containers as droppable areas, and the module automatically manages drop area highlighting when a user drags an element.

## Known performance issues
*NOTE: The are known performance issues in Firefox and Internet Explorer. If you encounter these performance issues, we would like to hear from you. Please contact the Platform UI team, so we can learn more.*

## API reference

### droppable(container, [options])

Enabling a container element to allow draggable elements to be dropped. By default we allow to drag newly dropped elements by also marking the droppable as a draggable container.

| Property  | Type  | Description  |
|---|---|---|
| container | Element | The DOM Element that can recieve droppable elements.
| options | object | Optional hooks to control droppable behavior.
| options.allowDrop | allowDropCallback | Callback to determine if element to be dragged to a droppable.
| options.onDrop | onDropCallback | Callback to provide custom rendering instead of dropped element.
| options.disableDraggableChildren | boolean | By default all dropped elements can be moved around. Setting this to true, once an element is dropped, it can no longer be dragged.

#### allowDropCallback(dragInfo) -> boolean

| Property  | Type  | Description  |
|---|---|---|
| dragInfo | object |
| dragInfo.copy | boolean |Is dragged element cloned or moved.
| dragInfo.el | Element | The element currently being dragged.
| dragInfo.target | Element | The container marked as droppable, that we ask if we are allowed drop the dragged element to.
| dragInfo.source | Element | The container marked as draggable, where the dragged element is dragged from.
| dragInfo.data | any | Data defined by draggable handler.
| returns | boolean | When true, droppable accept dragged element to be added to the target.

#### onDropCallback(dragInfo) -> Element

| Property  | Type  | Description  |
|---|---|---|
| dragInfo | object |
| dragInfo.copy | boolean |Is dragged element cloned or moved.
| dragInfo.el | Element | The element currently being dragged.
| dragInfo.target | Element | The container marked as droppable, that we ask if we are allowed drop the dragged element to.
| dragInfo.source | Element | The container marked as draggable, where the dragged element is dragged from.
| dragInfo.data | any | Data defined by draggable handler.
| returns | Element | Return the element you whish to be rendered on drop.

### draggable(container, [options])

Enabling all children of a container element to be draggable.

| Property  | Type  | Description  |
|---|---|---|
| container | Element | The DOM Element that should enable child elements to be drag and droppable.
| options | object | Optional parameters to control draggable behavior.
| options.copy | boolean | When true, ensures element is cloned instead of moved.
| options.getDragData | getDragDataCallback | Based on the dragged element, return some useful data to be used by droppable area, in the `onDrop` and `allowDrop` callbacks. Defaults to return the dragged element.

#### getDragDataCallback(element) -> any

Given the dragged element, give some data to the droppable handlers (i.e. allowDrop and onDrop).

| Property  | Type  | Description  |
|---|---|---|
| element | Element | The DOM Element currently being dragged.
| returns | any | You should return a value, that has value for the droppable area. As an example the DraggableElementList uses this callback to return the Sitecore item associated with the drag. Droppable callback handlers from `onDrop` and `allowDrop` will recieve this data.

### unregister(container) -> boolean

Unregister a draggable or droppable from the drag and drop module.

| Property  | Type  | Description  |
|---|---|---|
| container | Element | Container to remove from the drag and drop module. Elements can no longer be dragged or dropped to/from the container. Undoing any calls to `draggable` or `droppable`.
| returns | boolean | True if container was registered by module, false if not found.

### remove(container) -> boolean

Delete a draggable or droppable element from the DOM safely. This method is a helper method, to ensure that unregister is called after removing the element from the DOM, to avoid memory leaks.

| Property  | Type  | Description  |
|---|---|---|
| container | Element | Container to remove from DOM and the drag and drop module.
| returns | boolean | True if container was registered by module, false if not found.

### setActiveDragArea(element)

By default when you start dragging, the drag and drop module will immidiately ask all droppables if the element is allowed to be dropped in that container. We do this to paint the highlighting of accepted droppable areas.

This feaute allows you to postpone that highlighting and allowDrop call until the drag is over a certain DOM element. For example only call once the drag enters your workspace area.

| Property  | Type  | Description  |
|---|---|---|
| element | Element | Element that should trigger highlighting once entered on mouse drag.

### clearActiveDragArea()

Remove the active drag area. Once removed default behavior is restored. `allowDrop` and highlighting will happen immidiately on drag start again. Undoing `setActiveDragArea`.