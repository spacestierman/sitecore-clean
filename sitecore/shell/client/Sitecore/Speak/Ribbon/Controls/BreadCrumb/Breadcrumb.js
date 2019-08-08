define(
  [
    "sitecore",
    "/-/speak/v1/ExperienceEditor/ExperienceEditor.js"
  ],
function (Sitecore, ExperienceEditor) {
  Sitecore.Factories.createBaseComponent({
    name: "RibbonBreadcrumb",
    base: "ControlBase",
    selector: ".sc-breadcrumb",
    attributes: [
    ],

    breadcrumpStructure: [],

    selectedItem: null,

    isPreview: false,

    goText: "",
    editText: "",
    editTooltip: "",
    treeViewTooltip: "",
    structure: null,

    initialize: function () {
      //this._super();
      document.breadcrumbContext = this;
      ExperienceEditor.getPageEditingWindow().document.breadcrumbContext = this;

      var mode = ExperienceEditor.Web.getUrlQueryStringValue("mode");
      this.isPreview = mode != null && mode.toLowerCase() == "preview";

      this.goText = this.$el[0].attributes["data-sc-dic-go"].value;
      this.editText = this.$el[0].attributes["data-sc-dic-edit"].value;
      this.editTooltip = this.$el[0].attributes["data-sc-dic-edit-tooltip"].value;
      this.treeViewTooltip = this.$el[0].attributes["data-sc-dic-treeview-tooltip"].value;
      this.structure = JSON.parse(this.$el[0].attributes["data-sc-structure"].value);
      this.model.on("change:isVisible", this.onVisibleChange, this);
    },

    onVisibleChange: function (control, isVisible) {
      if (!isVisible) {
        return;
      }

      var itemId = control.viewModel.$el[0].attributes["data-sc-itemid"].value;
      this.renderNavigationBar(itemId);
    },

    renderNavigationBar: function (itemId) {
      this.selectedItem = itemId;
      this.requestBreadcrumpStructure(itemId, this);

      var items = this.breadcrumpStructure;
      var htmlSource = "";
      htmlSource += this.generateNavigationBarTreeViewButton(this.treeViewTooltip);
      var lastItem = null;
      for (var i = 0; i < items.length; i++) {
        var source = "";
        source += this.generateNavigationBarMenuItemHtml(items[i]);
        source += this.generateNavigationBarItemHtml(items[i]);
        htmlSource += this.generateNavigationBarBlockHtml(source);
        lastItem = items[i];
      }

      if (lastItem && lastItem.HasChildren) {
        lastItem.ParentId = lastItem.ItemId;
        htmlSource += this.generateNavigationBarBlockHtml(this.generateNavigationBarMenuItemHtml(lastItem));
      }

      var isItemValid = lastItem && this.selectedItem.ItemId != lastItem.ParentId;
      var enabled = isItemValid && lastItem.HasLayout;
      var canEdit = isItemValid && lastItem.CanEdit;
      htmlSource += "<div class=\"sc-breadcrumb-item\">";
      htmlSource += this.generateNavigationBarButtonHtml(enabled, this.goText, "javascript:document.breadcrumbContext.navigateToItem(document.breadcrumbContext.selectedItem);", "btn-primary", "");
      if (!this.isPreview) {
        htmlSource += this.generateNavigationBarButtonHtml(canEdit, this.editText, "javascript:document.breadcrumbContext.editItemInCE(document.breadcrumbContext.selectedItem);", "btn-default", this.editTooltip);
      }

      htmlSource += "</div>";
      var breadcrumbContent = ExperienceEditor.ribbonDocument().getElementById("breadcrumbContent" + this.$el[0].attributes["data-sc-itemid"].value);
      breadcrumbContent.innerHTML = htmlSource;

      this.hideMenu();
    },

    navigateToItem: function (itemId) {
      ExperienceEditor.navigateToItem(itemId);
    },

    editItemInCE: function (itemId) {
      ExperienceEditor.navigateToItemInCE(itemId);
    },

    generateNavigationBarButtonHtml: function (enabled, text, functionSource, buttonStyle, tooltip) {
      var onclickFunction = "#";
      var additionalClass = " scContentButtonDisabled";
      if (enabled) {
        onclickFunction = functionSource;
        additionalClass = "";
      } else {
        buttonStyle += " disabled";
      }

      var htmlSource = "";
      htmlSource += "<a class=\"scContentButton" + additionalClass + "\" href=\"" + onclickFunction + "\" title=\"" + tooltip + "\">";

      htmlSource += "<button data-sc-id='CancelButton' class='btn sc-button " + buttonStyle + "' type='button'>";
      htmlSource += "<span class='sc-button-text data-sc-registered' data-bind='text: text'>" + text + "</span>";
      htmlSource += "</button>";

      htmlSource += "</a>";
      return htmlSource;
    },

    generateNavigationBarTreeViewButton: function () {
      var functionDefinition = "javascript:document.breadcrumbContext.renderTreeViewIframe();";
      return "<div class='sc-breadcrumb-item' title='" + this.treeViewTooltip + "'><a id='navigationTreeViewButton' class='sc-breadcrumb-item-button' href='" + functionDefinition + "'><div class='sprite-speak-ribbon-clean-ee elements_tree'></div></a></div>";
    },

    generateNavigationBarBlockHtml: function (source) {
      return "<div class='sc-breadcrumb-item'>" + source + "</div>";
    },

    generateNavigationBarItemHtml: function (item) {
      var breadcrumbItemFunction = "javascript:document.breadcrumbContext.renderNavigationBar('" + item.ItemId + "');";
      return "<a class=\"sc-breadcrumb-item-path\" href=\"" + breadcrumbItemFunction + "\" title=\"Breadcrumb path\">" + item.DisplayName + "</a>";
    },

    generateNavigationBarMenuItemHtml: function (item) {
      var contextMenuFunction = "javascript:document.breadcrumbContext.renderContextMenu('" + item.ParentId + "');";
      return "<a id=\"breadcrumbMenuSubcontrol" + item.ParentId + "\" class=\"sc-breadcrumb-item-action\" href=\"" + contextMenuFunction + "\" title=\"Breadcrumb action\"><div class=\"sprite-speak-ribbon-clean-ee separator_7\"></div></a>";
    },

    requestBreadcrumpStructure: function (itemId, appContext) {
      var context = ExperienceEditor.generateDefaultContext();
      context.currentContext.itemId = itemId;
      if (this.structure) {
        appContext.breadcrumpStructure = this.structure;
        this.structure = null;
        return;
      }

      ExperienceEditor.PipelinesUtil.generateRequestProcessor("ExperienceEditor.Breadcrumb.GetStructure", function (response) {
        appContext.breadcrumpStructure = response.responseValue.value;
      }).execute(context);
    },

    renderContextMenu: function (id) {
      ExperienceEditor.getPageEditingWindow().document.addEventListener('click', function () {
        ExperienceEditor.getPageEditingWindow().document.breadcrumbContext.hideMenu();
      }, false);

      document.addEventListener('click', function () {
        ExperienceEditor.getPageEditingWindow().document.breadcrumbContext.hideMenu();
      }, false);

      var context = ExperienceEditor.generateDefaultContext();
      context.currentControl = this;
      context.currentContext.itemId = id;
      ExperienceEditor.PipelinesUtil.generateRequestProcessor("ExperienceEditor.Breadcrumb.GetChildItems", function (response) {
        var control = document.getElementById("breadcrumbMenuSubcontrol" + id);
        var position = control.getBoundingClientRect();
        var positionStyle = "top:" + (position.top + 35) + "px;" + "left:" + (position.left + 0 + ExperienceEditor.ribbonFrame().offsetLeft) + "px;";
        var menuControlId = "breadcrumbMenuSubcontrol_context_menu";
        var menuSource = "<nav id='" + menuControlId + "' style='position:fixed;z-index:10000;" + positionStyle + "' class=''>" + response.context.currentControl.generateContextMenuHtmlSource(response.responseValue.value) + "</nav>";
        var element = ExperienceEditor.getPageEditingWindow().document.getElementById(menuControlId);
        if (!element) {
          var iDiv = ExperienceEditor.getPageEditingWindow().document.createElement('nav');
          iDiv.id = menuControlId;
          iDiv.style.display = "none";
          ExperienceEditor.getPageEditingWindow().document.getElementsByTagName('body')[0].appendChild(iDiv);
          element = ExperienceEditor.getPageEditingWindow().document.getElementById(menuControlId);
        }
        element.outerHTML = menuSource;
        element.style.display = "";
      }).execute(context);
    },

    renderTreeViewIframe: function () {
      require(["/-/speak/v1/ExperienceEditor/LeftOverflowPanel.js"], function (LeftOverflowPanel) {

        var element = window.document.getElementById("navigationTreeViewButton");
        if (!element) {
          return;
        }

        if (ExperienceEditor.getPageEditingWindow().document.body.classList.contains('has-active-menu')) {
          var slideLeft = new LeftOverflowPanel({
            type: 'slide-left',
            maskId: '#c-mask'
          });
          slideLeft.close();
          return;
        }

        ExperienceEditor.Common.registerDocumentStyles(["/-/speak/v1/ribbon/Gallery.css"], ExperienceEditor.getPageEditingWindow().document);

        var wrapperDiv = document.createElement("div");
        wrapperDiv.id = "c-menu--slide-left";
        wrapperDiv.style.cssText = "top: " + ExperienceEditor.RibbonApp.getRibbonWindow().frameElement.getBoundingClientRect().bottom + "px;";
        wrapperDiv.className += " c-menu c-menu--slide-left";

        var mask = document.createElement("div");
        mask.id = "c-mask";
        mask.className = "c-mask";

        var iframeContentStyle = "display: none; overflow:auto; height: 100%; width: 100%;";
        var iframeContent = document.createElement("iframe");
        iframeContent.className = "scGalleryFrame";
        iframeContent.contentEditable = "true";
        iframeContent.style.cssText = iframeContentStyle;
        iframeContent.src = "/sitecore/client/Applications/ExperienceEditor/Pages/NavigationTreeView.aspx?lang=" + ExperienceEditor.RibbonApp.getApp().currentContext.language;
        iframeContent.id = "ee_iframeGallery";
        ExperienceEditor.getContext().openedFullContentIframe = wrapperDiv;


        wrapperDiv.appendChild(iframeContent);
        ExperienceEditor.getPageEditingWindow().document.body.appendChild(wrapperDiv);
        ExperienceEditor.getPageEditingWindow().document.body.appendChild(mask);

        var slideLeft = new LeftOverflowPanel({
          type: 'slide-left',
          maskId: '#c-mask'
      });

        iframeContent.onload = function () {
          iframeContent.style.display = "block";
          slideLeft.open();
        };

        //this will remove All menu html elements and masks, even if there are multiple such objects by some reason.
        slideLeft.addOnCloseAnimationFinishedEventHandler(function () {
          ExperienceEditor.Common.closeFullContentIframe(wrapperDiv);
          if (ExperienceEditor.getPageEditingWindow().document.body.contains(mask)) {
            ExperienceEditor.getPageEditingWindow().document.body.removeChild(mask);
          }
        });

        window.document.onclick = function () {
          //Update top position, because ribbon could chnage the collapsed mode and document.onclick will be triggered.
          //Do this with 0 timeout, so it will be ran after notifications are collapsed or expanded
          setTimeout(function () {
            wrapperDiv.style.cssText = "top: " + ExperienceEditor.RibbonApp.getRibbonWindow().frameElement.getBoundingClientRect().bottom + "px;";
          }, 0);
        };

        ExperienceEditor.getPageEditingWindow().document.onclick = function () {
          slideLeft.close();
        };

      });
    },

    hideMenu: function () {
      var menuControlId = "breadcrumbMenuSubcontrol_context_menu";
      var element = ExperienceEditor.getPageEditingWindow().document.getElementById(menuControlId);
      if (element && element.style) {
        element.style.display = "none";
      }
    },

    generateContextMenuHtmlSource: function (items) {
      var htmlSource = "<nav data-sc-id=\"RibbonBreadcrumb\" style=\"padding-top:0.3em;padding-bottom:0.3em;padding-left:0.3em;overflow-x:hidden; overflow-y:visible;\" class=\"sc-breadcrumb data-sc-registered sc-breadcrumb-item-rectangle sc\">";
      for (var i = 0; i < items.length; i++) {
        var contextMenuFunction = "javascript:document.breadcrumbContext.renderNavigationBar('" + items[i].ItemId + "');";
        htmlSource += "<a style=\"display: inline-flex !important; width:100%;height:16px;\" class=\"sc-breadcrumb-item-path\" href=\"" + contextMenuFunction + "\">";
        htmlSource += items[i].ImageUrl;
        htmlSource += "<span style='text-transform:none;font-size: 12px;font-family: Arial, Helvetica, sans-serif;vertical-align:text-top;height:16px;'>" + items[i].DisplayName + "</span>";
        htmlSource += "</a>";
        htmlSource += "<br style=\"height:0.1px;\"/>";
      }

      htmlSource += "</nav>";
      return htmlSource;
    },
  });
});