define(["sitecore", "/-/speak/v1/ExperienceEditor/ExperienceEditor.js"], function (Sitecore, ExperienceEditor) {
  var navigationTreeViewPageCode = Sitecore.Definitions.App.extend({
    structure: [],

    currentItemId: '',

    rootItemId: "{0DE95AE4-41AB-4D01-9EB0-67441B7C2450}",

    navigationTreeView: null,

    initialized: function () {
      var that = this;

      this.runAction("getRoot").visit(function (node) {
        window.setInterval(function() { node.expand(true); }, 50);
      });

      this.currentItemId = ExperienceEditor.RibbonApp.getApp().currentContext.itemId;


      this.initializeStructure();
      this.initializeTree(that);
      navigationTreeView = this.NavigationTreeView;
    },

    runAction: function (action) {
      return $("div[data-sc-id='NavigationTreeView']").dynatree(action);
    },

    initializeStructure: function() {
      var context = ExperienceEditor.RibbonApp.getAppContext();
      context.currentContext.itemId = this.currentItemId;

      var that = this;

        ExperienceEditor.PipelinesUtil.generateRequestProcessor("ExperienceEditor.Breadcrumb.GetStructure", function (response) {
        if (!response.responseValue.value) {
          return;
        }

        that.structure = response.responseValue.value;
      }).execute(context);
    },

    initializeTree: function(context) {
      this.runAction({
        onActivate: function (node) {
          if (node.data.isDisabledState) { 
            return;
          }

          context.navigateToItem(node.data.key);
        },

        onCreate: function (node) {
          context.setNodeActiveStatus(node, decodeURIComponent(context.currentItemId));
          context.checkExpandingStatus(node, context.structure, decodeURIComponent(context.currentItemId));
        },

        onRender: function(node) {
          if (node.data.key == context.rootItemId) {
            var rootElement = node.span;
            if (!rootElement) {
              return;
            }

            var $root = $(rootElement);
            $root.addClass("disabledItem");

            node.data.isDisabledState = true;
          }
        }
      });
    },

    setNodeActiveStatus: function (node, currentItemId) {

      function setHasPresentation(node) {
        //if it's not undefined, and it equals false
        if (node.parent.ChildrenPresentations[node.data.key] === true) {
          node.data.addClass = "";
          node.data.isDisabledState = false;
          if (node.data.key == currentItemId) {
            node.data.addClass = "dynatree-active";
          }
          node.render();
        }
      }

      node.data.isDisabledState = true;
      node.data.addClass = "disabledItem";
      if (!node.parent.ChildrenPresentations) {
        node.parent.ChildrenPresentations = "inProgress";
        var context = ExperienceEditor.RibbonApp.getAppContext();
        context.currentContext.itemId = node.parent.data.key;

        ExperienceEditor.PipelinesUtil
          .generateRequestProcessor("ExperienceEditor.Item.CheckItemChildrenHasPresentations",
            function (response) {
              navigationTreeView.attributes.isBusy = true;
              node.parent.ChildrenPresentations = response.responseValue.value;

              $.each(node.parent.childList, function () {
                setHasPresentation(this);
              });

            }, null, true)
          .execute(context);
      }
    },

    checkExpandingStatus: function (node, structure, currentItemId) {
      var itemExistsInStructure = this.isItemExistsInStructure(node.data.key, structure);
      if (!itemExistsInStructure) {
        return;
      }

      var nodeIsCurrentItem = node.data.key == currentItemId;

      if (nodeIsCurrentItem) {
        node.data.addClass = "dynatree-active";

        return;
      }
      node.expand(true);
    },

    isItemExistsInStructure: function(itemId, structure) {
      for (var i = 0; i < structure.length; i++) {
        if (structure[i].ItemId == itemId) {
          return true;
        }
      }

      return false;
    },

    navigateToItem: function (itemId) {
       ExperienceEditor.handleIsModified();
       ExperienceEditor.navigateToItem(itemId);
    }
  });

  return navigationTreeViewPageCode;
});