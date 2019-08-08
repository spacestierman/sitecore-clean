define(["sitecore", "/-/speak/v1/listmanager/dialogs.js", "/-/speak/v1/listmanager/storageMediator.js", "css!/-/speak/v1/listmanager/navigationmenu.css"],
    function (sitecore, dialogs, storageMediator) {
        var App = sitecore.Definitions.App.extend({
            initialized: function () {
                dialogs.init(this.NavigationDialogsOnDemandPanel);
                this.initializeActions();
                this.addClickToBorder(this.ImportNewContactsBorder);
                this.addClickToBorder(this.CreateSegmentBorder);
                this.addClickToBorder(this.CreateListsBorder);
                this.CreateListFromFileHyperlinkButton.on("click", this.closePopover, this);
                this.ContactListFromExistingListHyperlinkButton.on("click", this.closePopover, this);
                this.CreateSegmentHyperlinkButton.on("click", this.closePopover, this);
                this.AddContactsToDatabaseHyperlinkButton.on("click", this.closePopover, this);
                this.SegmentedListFromExistingListHyperlinkButton.on("click", this.closePopover, this);
            },
            closePopover: function() {
                this.CreateButton.viewModel.$el.click();
            },
            addClickToBorder: function(border) {
                border.viewModel.$el.find("> div").css('cursor', 'pointer').on("click",
                    function() {
                        $(this).find(".sc-hyperlinkbutton")[0].click();
                    });
                border.viewModel.$el.find(".sc-hyperlinkbutton").on("click",
                    function(event) {
                        event.stopPropagation();
                    });
            },
            initializeActions: function () {
              sitecore.on("create:lists:from:existing",
                  function (linkPattern) {
                  var dialogParams = {
                    callback: function (item, itemId) {
                      this.addSourceCallback(item, itemId, linkPattern);
                    },
                    filter: "getContactLists"
                  };
                  dialogs.showDialog(dialogs.Ids.SelectListDialog, dialogParams);
                },
                this);

              sitecore.on("create:lists:segmented:from:existing",
                function (linkPattern) {
                  var dialogParams = {
                    callback: function (item, itemId) {
                        this.addSourceCallback(item, itemId, linkPattern);
                    },
                    filter: "getContactLists"
                  };
                  dialogs.showDialog(dialogs.Ids.SelectListDialog, dialogParams);
                },
                this);

              sitecore.on("import:new:contacts:dialog:create:list:from:file",
                function () {
                    dialogs.showDialog(dialogs.Ids.ImportDialog,
                    { mode: "ImportContactsAndCreateList" });
                },
                this);

              sitecore.on("import:new:contacts:dialog:add:contacts:to:database",
                function () {
                    dialogs.showDialog(dialogs.Ids.ImportDialog, { mode: "ImportContacts" });
                },
                this);
            },
            addSourceCallback: function (itemId, item, pagePattern) {
              if (typeof item !== "undefined" && item !== null) {
                var items = [];
                items.push(item);
                storageMediator.addToStorage("items", items);
                location.href = pagePattern + "?action=fromexisting";
              } else {
                location.href = pagePattern;
              }
            }
        });
        return App;
    });