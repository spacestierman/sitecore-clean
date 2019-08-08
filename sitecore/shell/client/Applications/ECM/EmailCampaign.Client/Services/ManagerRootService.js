define(["jquery"], function($) {
  var ManagerRootService =  {
    getManagerRootList: function () {
      var roots = [];
      var id = "root-id";
      $.each($('div[data-sc-id="EmailManagerRoot"]:first').find('*[data-' + id + ']'), function () {
          var el = $(this);
          var selected = el.parent("li").hasClass("selected");
          roots.push({
              title: el.text(),
              id: el.data(id),
              selected: selected
          });
      });
      return roots;
    },
    getSelectedRoot: function() {
        var roots = ManagerRootService.getManagerRootList(),
            rootId = null;
        if (roots && roots.length) {
            var root = _.findWhere(roots, { selected: true });
            rootId = root ? root.id : null;
        }
        return rootId;
    }
  }
  return ManagerRootService;
})