var showConflict = function (contextLength, viewType) {
  var $txtSource = window.jQuery('input[id$=SourceFile]');
  var $txtTarget = window.jQuery('input[id$=TargetFile]');
  var diffoutputdiv = window.jQuery('div[id$=diffcontainer]');

  if ($txtSource.length > 0 && $txtTarget.length > 0 && diffoutputdiv.length > 0) {
    var $source = difflib.stringAsLines($txtSource[0].value);
    var $target = difflib.stringAsLines($txtTarget[0].value);

    var sm = new difflib.SequenceMatcher($source, $target);
    var opcodes = sm.get_opcodes();

    while (diffoutputdiv.firstChild) {
      diffoutputdiv.removeChild(diffoutputdiv.firstChild);
    }

    diffoutputdiv[0].appendChild(
      diffview.buildView({
        baseTextLines: $source,
        newTextLines: $target,
        opcodes: opcodes,
        viewType: viewType,
        contextSize: contextLength,
        showTitle: false
        }));


    var tableDiffElement = $(".diff");
    var diffWrapperMargin = 20;
      
    $(".diff-progress").css('background-image', 'none');
    $(".diff-progress").height(0);
    if (viewType == 0) {
        var newElementsHeight = tableDiffElement.height() < 500 ? tableDiffElement.height() : 750;
        $("#diffcontainer").height(newElementsHeight);
        $(".diff-wrapper").height(newElementsHeight + diffWrapperMargin);
    } else {
        var newElementsHeight = tableDiffElement.height() < 500 ? tableDiffElement.height() : 500;
        $("#diffcontainer").height(newElementsHeight);
        $(".diff-wrapper").height(newElementsHeight + diffWrapperMargin);
    }	
  }
};