MessageMemo = new function()
{
  this.PasteText = function(id, text)
  {
    var obj = document.getElementById(id);
    if (obj != null)
    {
      obj.focus();

      if (document.selection)//IE
        obj.document.selection.createRange().text = text;
      else
      {
        if (obj.selectionStart != null)//Gecko
        {
          var start = obj.selectionStart;
          var end = obj.selectionEnd;
          obj.value = obj.value.substr(0, start) + text + obj.value.substr(end);
          obj.setSelectionRange(end, end);
        }
      }
    }
  }
}