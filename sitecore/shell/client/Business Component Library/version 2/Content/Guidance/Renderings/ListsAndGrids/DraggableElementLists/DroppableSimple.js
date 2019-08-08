(function (speak) {

  speak.pageCode([
    "bclDragAndDrop",
    ], function (dragAndDrop) {
    return {
      initialized: function () {
        dragAndDrop.droppable(this.ScrollablePanel1.el);
      },
     
	}
  } );

})(Sitecore.Speak);