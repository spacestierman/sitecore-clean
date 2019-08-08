define(["sitecore", "/-/speak/v1/ExperienceEditor/ExperienceEditor.js", "/-/speak/v1/ExperienceEditor/DOMHelper.js"], function (Sitecore, ExperienceEditor, DOMHelper) {

    var insertPagePageCode = Sitecore.Definitions.App.extend({

        parentItemId: null,

        initialized: function () {
            //change contentLanguage for all children items
            this.ItemTreeView.attributes.contentLanguage = ExperienceEditor.RibbonApp.getApp().currentContext.language;
            this.runAction("getRoot").visit(function (node) {
                //rewrite display name of a root node with the correct language
                jQuery.ajax({
                    url: "/sitecore/api/ssc/item/" + node.data.key + "?language=" + ExperienceEditor.RibbonApp.getApp().currentContext.language + "&fields=DisplayName",
                    success: function (response) {
                        if (response && response.DisplayName) {
                            node.data.title = response.DisplayName;
                            node.render();
                        }
                    },
                    type: "GET",
                    async: false
                });

                node.expand(true);
            });
            this.setWarningMessage();
            this.setInsertButtonClick();
            this.setCancelButtonClick();
            this.setButtonRules();
            this.initializeStructure();
            this.initializeTree(this);
            var insertPagePageCode = this;

            $("div[class='dialog-content']").bind("selectOptionPressed", function (event, element) {
                var displayName = element.attributes["data-sc-displayname"].value;
                insertPagePageCode.ItemNameText.viewModel.$el.val(displayName);

                var selectedItemId = element.attributes["data-sc-itemid"].value;
                insertPagePageCode.templateId = selectedItemId;
                insertPagePageCode.InsertOptions.set("selectedItemId", selectedItemId);
                insertPagePageCode.InsertOptions.set("selectedDisplayName", element.attributes["data-sc-displayname"].value);

                $.each(this, function () {
                    if (this.attributes === undefined || this.componentName !== "SelectOptionsItem")
                        return;
                    this.set("isPressed", this.cid === element.cid);
                });
                insertPagePageCode.enableInsertButton();
            });
        },
        
        getCurrentItemId: function() {
            return ExperienceEditor.Web.getUrlQueryStringValue("itemId");
        },

        runAction: function (action) {
            return $("div[data-sc-id='ItemTreeView']").dynatree(action);
        },

        initializeTree: function (context) {
            this.runAction({
                onActivate: function (node) {
                    if (context.defaultSelectedNode) {
                        $(context.defaultSelectedNode.span).removeClass("dynatree-active");
                        context.defaultSelectedNode = null;
                    }

                    context.InsertOptions.viewModel.disableInsertAbility();

                    var eeContext = ExperienceEditor.RibbonApp.getAppContext();
                    eeContext.currentContext.itemId = node.data.key;
                    var canInsert = true;
                    ExperienceEditor.Web.postServerRequest("ExperienceEditor.Insert.CanInsert", eeContext.currentContext, function(response) {
                        canInsert = response.responseValue.value;
                        context.setWarningMessage(response.responseValue.abortMessage);
                    });

                    if (canInsert) {
                        context.parentItemId = node.data.itemUri.itemId;
                        context.InsertOptions.viewModel.refreshInsertOptions(context.parentItemId);
                    }
                },

                onCreate: function (node) {
                },

                onRender: function (node) {
                    var currentItemId = context.getCurrentItemId();
                    if (node.data.key == currentItemId) {
                        node.data.addClass = "dynatree-active";
                        context.parentItemId = node.data.key;
                        context.defaultSelectedNode = node;
                    } else {
                        context.checkExpandingStatus(node, context.structure, currentItemId);
                    }
                }
            });
        },

        initializeStructure: function () {
            var context = ExperienceEditor.RibbonApp.getAppContext();
            context.currentContext.itemId = this.getCurrentItemId();
            var that = this;

            ExperienceEditor.PipelinesUtil.generateRequestProcessor("ExperienceEditor.Breadcrumb.GetStructure", function (response) {
                if (!response.responseValue.value) {
                    return;
                }

                that.structure = response.responseValue.value;
            }).execute(context);
        },


        checkExpandingStatus: function (node, structure, currentItemId) {
            var itemExistsInStructure = this.isItemExistsInStructure(node.data.key, structure);
            if (!itemExistsInStructure) {
                return;
            }
            node.expand(true);
        },

        isItemExistsInStructure: function (itemId, structure) {
            for (var i = 0; i < structure.length; i++) {
                if (structure[i].ItemId == itemId) {
                    return true;
                }
            }

            return false;
        },

        setWarningMessage: function (text) {
            var warningMessageBorderElement = this.WarningMessageBorder.viewModel.$el[0];

            if (!text || text.length === 0) {
                this.WarningMessage.viewModel.$el.hide();
                $(warningMessageBorderElement).height(0);
            } else {
                this.WarningMessage.viewModel.$el.show();
                $(warningMessageBorderElement).height(300);
                $(this.WarningMessage.viewModel.$el[0]).text(text);
            }
        },

        setButtonRules: function () {
            this.itemNameElement().context = this;
            this.itemNameElement().onkeyup = this.enableInsertButton;
            this.ItemNameText.on("change", this.enableInsertButton, this);
        },

        itemNameElement: function () {
            return this.ItemNameText.viewModel.$el[0];
        },

        enableInsertButton: function () {
            var context = this.value || this.value == "" ? this.context : this;
            if (!context) {
                return;
            }

            if (context.templateId
              && context.itemNameElement().value.trim()) {
                context.InsertButton.viewModel.enable();
                return;
            }
            context.InsertButton.viewModel.disable();
        },

        setInsertButtonClick: function () {
            this.on("button:insert", function () {
                var newName = this.ItemNameText.get("text").trim();
                if (!newName || !this.templateId) {
                    return;
                }

                this.context = {
                    value: newName,
                    templateItemId: this.templateId,
                    app: this,
                    parentItemId: this.parentItemId || this.getCurrentItemId()
            };

                ExperienceEditor.PipelinesUtil.generateRequestProcessor("ExperienceEditor.Insert.ValidateNewName", function (response) {
                    response.context.app.closeDialog(response.context.templateItemId + ',' + response.context.value + ',' + response.context.parentItemId);
                }, this.context).execute(this.context);
            }, this);

        },
        setCancelButtonClick: function () {
            this.on("button:cancel", function () {
                this.closeDialog(null);
            }, this);
        },
        getSelectedItem: function (eventTarget) {
            var id = DOMHelper.findId(eventTarget);
            if (id === undefined)
                return undefined;
            return this[id];
        },

        //[Obsolete]
        findId: function (target) {
            console.log("Obsolete. This method is no longer supported use  DOMHelper.findId(target) instead");
            return DOMHelper.findId(target);
        }
    });
    return insertPagePageCode;
});