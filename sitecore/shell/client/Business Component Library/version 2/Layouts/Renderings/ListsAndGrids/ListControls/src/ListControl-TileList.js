define("ListControl/TileList",
  [
    "handlebars",
    "ListControl/TemplateHelper",
    "ListControl/TileListHeightFactory",
    "bclUtils"
  ],

  function (handlebars, TemplateHelper, TileListHeightFactory, Utils) {
    var consts = {
      selectors: {
        check: ".sc-listcontrol-tile-check",
        item: ".sc-listcontrol-tile",
        items: ".sc-listcontrol-tiles",
        listpage: ".sc-associated-listpage"
      }
    };

    var View = function (viewModel, el) {
      this.setModelListeners(viewModel, el);

      // init    
      this.render(viewModel, el);
    };

    View.prototype.click = function (viewmodel, event) {
      viewmodel.click(Utils.dom.index(event.currentTarget));
    };

    View.prototype.setHeightHandler = function (el, viewModel, oldScrollPosition) {
      this.heightHandler = TileListHeightFactory.create(el, viewModel);
      this.heightHandler.heightChangedCallback = function () {
        viewModel.updateScroll();
        viewModel.setScrollElement(el.querySelector(consts.selectors.items));
        viewModel.scrollPosition(oldScrollPosition);

        this.setAssociatedListPage(el, viewModel);
      }.bind(this);

      this.heightHandler.render();
    };

    View.prototype.setAssociatedListPage = function (el, viewModel) {
      var scrollContainer = el.querySelector(consts.selectors.items),
        associatedListPageElement = el.querySelector(consts.selectors.listpage),
        associatedListPage = viewModel.associatedListPage(),
        link = el.querySelector(consts.selectors.listpage + " a");

      if (scrollContainer.offsetHeight < scrollContainer.scrollHeight) {
        link.href = associatedListPage;
        
        if (associatedListPage) {
          associatedListPageElement.classList.remove("hide");
          scrollContainer.classList.add("sc-hide-scrollbar");
        } else {
          associatedListPageElement.classList.add("hide");
          scrollContainer.classList.remove("sc-hide-scrollbar");
        }
      }
    };

    View.prototype.toggleCheck = function (viewmodel, event) {
      event.stopPropagation();
      viewmodel.toggleCheck(Utils.dom.index(event.currentTarget.parentNode));
    };

    View.prototype.toggleCheckOverSelect = function (viewmodel, event) {
      if (!viewmodel.isSelectionDisabled()) {
        viewmodel.toggleCheckOverSelect(Utils.dom.index(event.currentTarget));
      }
    };

    View.prototype.setChecked = function (componentElement, indexes) {
      var checkedItems = componentElement.querySelectorAll(consts.selectors.items + " > " + consts.selectors.item + ".checked");

      Utils.dom.nodeListToArray(checkedItems).forEach(function (item) {
        item.classList.remove("checked");
        item.querySelector(consts.selectors.check + " > input[type=checkbox]").checked = false;
      });

      if (indexes.length === 0) {
        return;
      }

      indexes.forEach(function (index) {
        var element = componentElement.querySelectorAll(consts.selectors.items + " > " + consts.selectors.item)[index];

        if (element) {
          element.classList.add("checked");
          element.querySelector(consts.selectors.check + " > input[type=checkbox]").checked = true;
        }
      });
    };

    View.prototype.setSelected = function (componentElement, index) {
      var selectedElements = componentElement.querySelectorAll(consts.selectors.items + " > div" + consts.selectors.item + ".selected");

      Utils.dom.nodeListToArray(selectedElements).forEach(function (item) {
        item.classList.remove("selected");
      });

      if (index === -1) {
        return;
      }

      var elements = componentElement.querySelectorAll(consts.selectors.items + " > div" + consts.selectors.item);
      if (elements[index] && !elements[0].classList.contains("sc-nodata-row")) {
          elements[index].classList.add("selected");
      }
    };

    View.prototype.getViewModeSettings = function (viewModel) {
      var tileWidth = viewModel.getTileWidth();

      return {
        Id: viewModel.getId(),
        TileList: {
          TileWidth: tileWidth ? tileWidth + "px" : "100%"
        },
        EmptyText: viewModel.getEmptyText(),
        IsCheckModeEnabled: viewModel.isCheckModeEnabled,
        AssociatedListPage: viewModel.associatedListPage()
      }
    };

    View.prototype.applyCss = function (viewModel) {
      var cssPath = viewModel.getTileCssPath();

      if (cssPath && !document.querySelector('link[href="' + cssPath + '"]')) {
        var link = document.createElement("link");
        link.type = "text/css";
        link.rel = "stylesheet";
        link.href = cssPath;
        document.getElementsByTagName("head")[0].appendChild(link);
      }
    };

    View.prototype.applyTemplate = function (viewModel, el, callback) {
      var templatePath = viewModel.getTileTemplatePath();
      var templateId = "template-tilelist-" + el.getAttribute("data-sc-id");

      if (handlebars.templates[templateId] === "loading") {
        return;
      }

      if (templatePath) {
        handlebars.templates[templateId] = "loading";

        if (handlebars.templates[templatePath]) {
          handlebars.templates[templateId] = handlebars.templates[templatePath];

          callback();

          return;
        }
        else {
          $.ajax(templatePath)
            .fail(function () {
              TemplateHelper.prototype.throwError("Tiletemplate \"" + templatePath + "\" was not found.");
            })
            .done(function (template) {
              handlebars.templates[templatePath] = handlebars.compile(template);
              handlebars.templates[templateId] = handlebars.templates[templatePath];

              callback();
            });

          return;
        }
      }

      TemplateHelper.prototype.throwError("TileTemplatePath was not defined.");
    };

    View.prototype.setModelListeners = function (viewModel, el) {
      // update view
      viewModel.off("change:CheckedItems change:SelectedItem change:HeightMode");
      viewModel.on("change:CheckedItems", this.setChecked.bind(this, el));
      viewModel.on("change:SelectedItem", this.setSelected.bind(this, el));
      viewModel.on("change:HeightMode", this.setHeightHandler.bind(this, el, viewModel));
    };

    View.prototype.setViewListeners = function (viewModel, el) {
      var $el = $(el);

      $el.off("click.listcontrol:click click.listcontrol:toggleCheckOverSelect click.listcontrol:toggleCheck");
      $el.on("click.listcontrol:click", consts.selectors.item, this.click.bind(this, viewModel));
      $el.on("click.listcontrol:toggleCheckOverSelect", consts.selectors.item, this.toggleCheckOverSelect.bind(this, viewModel));
      $el.on("click.listcontrol:toggleCheck", consts.selectors.check, this.toggleCheck.bind(this, viewModel));
    };

    View.prototype.updateDOM = function (oldScrollPosition, el, viewModel) {
      this.setHeightHandler.call(this, el, viewModel, oldScrollPosition);
      viewModel.setScrollElement(el.querySelector(consts.selectors.items));
      viewModel.scrollPosition(oldScrollPosition);
    };

    View.prototype.render = function (viewModel, el) {
      el.className = "sc-listcontrol sc-tilelist";
      TemplateHelper.prototype.setupTemplates(el);

      this.applyCss(viewModel);
      this.applyTemplate(viewModel, el, function () {
        var internalData = {
          Items: viewModel.getItems(),
          Settings: this.getViewModeSettings(viewModel)
        };

        //scroll position before (re-)render
        var oldScrollPosition = viewModel.scrollPosition();

        TemplateHelper.prototype.render("tilelist", internalData, el);
        viewModel.checkItems();

        this.updateDOM(oldScrollPosition, el, viewModel);

        // To prevent too many calculations at once
        var windowResizeHandler = _.debounce(function () {
          this.updateDOM(oldScrollPosition, el, viewModel);
        }, 100, false).bind(this);

        window.addEventListener("resize", windowResizeHandler);

        this.setSelected.call(this, el, viewModel.getSelectedIndex(), viewModel.isSelectionRequired());
        this.setViewListeners(viewModel, el);
      }.bind(this));
    };

    return View;
  });