(function (speak) {
    speak.component(["itemJS", "/-/speak/v1/formsbuilder/assets/formservices.js"],
       function (itemManager, formServices) {
           var editors = {};

           var getItem = function (guid, callBack, options) {
               options = options || {};
               options.language = speak.Context.current().Language;

               itemManager.fetch(guid, options, function (data, result) {
                   if (result.statusCode === 401) {
                       speak.module("bclSession").unauthorized();
                       return;
                   }

                   if (data === null) {
                       throw "Item is not found: " + guid;
                   }

                   callBack(data);
               });
           };

           var extendAction = function (action, originalAction) {
               originalAction = originalAction || {};
               action.displayName = originalAction.displayName || action.name;
               action.icon = originalAction.icon || "/sitecore/images/blank.gif";
               action.editor = originalAction.editor;
           }

           return {
               initialized: function () {
                   this.SubmitActionsItems = [];
                   this.defineProperty("EditActionsDialog");

                   formServices.getSubmitActions().then(function (data) {
                       this.OptionsListControl.reset(data);
                   }.bind(this));

                   this.OptionsListControl.on({
                       "itemsChanged": this.updatedSubmitActions,
                       "change:SelectedValue": this.addOptionClicked
                   }, this);

                   this.Add.on("change:IsOpen", this.optionsListControlToggled, this);
                   this.SubmitActionsListControl.on({
                       "change:SelectedValue": this.updateButtonEnabledState,
                       "itemsChanged": this.updateState
                   }, this);

                   this.on({
                       "change:SubmitActionsItems": this.updatedSubmitActionsItems
                   }, this);

                   this.updateButtonEnabledState();

                   this.$el = $(this.el);
               },

               optionsListControlToggled: function () {
                   if (!this.Add.IsOpen) {
                       return;
                   }

                   var $dropDown = this.$el.find(".sc-dropdownbutton-contentpanel");
                   var $submitActions = this.$el.find(".sc-listcontrol[data-sc-id='SubmitActionsListControl']");
                   var $addButton = this.$el.find(".sc-dropdownbutton[data-sc-id='Add']");
                   $dropDown.css('top', $dropDown.height() < $submitActions.height() ? $addButton.height() : -$dropDown.height());
               },

               updatedSubmitActions: function () {
                   var items = this.SubmitActionsListControl.Items;
                   if (items && items.length) {
                       items.forEach(function (submitActionItem) {
                           var submitAction = this.OptionsListControl.getByValue(submitActionItem.submitActionId);
                           extendAction(submitActionItem, submitAction);
                       }, this);
                   }

                   var currentIsDirty = this.IsDirty;
                   this.IsDirty = true;
                   this.SubmitActionsListControl.trigger("itemsChanged", items);
                   this.IsDirty = currentIsDirty;
               },

               updatedSubmitActionsItems: function () {
                   if (this.SubmitActionsItems !== this.SubmitActionsListControl.Items) {
                       this.IsDirty = true;
                       this.SubmitActionsListControl.reset(this.SubmitActionsItems);
                       this.updatedSubmitActions();
                       this.IsDirty = false;
                   }
               },

               editActionCompleted: function (action) {
                   var existingAction = this.SubmitActionsListControl.getByValue(action.itemId);
                   if (!existingAction) {
                       this.SubmitActionsListControl.add(action);
                   } else {
                       this.SubmitActionsListControl.trigger("itemsChanged", this.SubmitActionsListControl.Items);
                   }
               },

               updateState: function () {
                   if (this.IsDirty) {
                       return;
                   }

                   this.updateButtonEnabledState();
                   if (this.SubmitActionsItems !== this.SubmitActionsListControl.Items) {
                       this.SubmitActionsItems = this.SubmitActionsListControl.Items;
                   }
               },

               updateButtonEnabledState: function () {
                   var position = this.SubmitActionsListControl.indexOf(this.SubmitActionsListControl.SelectedItem);
                   this.Up.IsEnabled = position > 0;
                   this.Down.IsEnabled = ~position && position < this.SubmitActionsListControl.Items.length - 1;

                   this.Edit.IsEnabled = this.SubmitActionsListControl.SelectedItem &&
                       this.SubmitActionsListControl.SelectedItem.editor;
               },

               addOptionClicked: function () {
                   if (!this.OptionsListControl.SelectedValue) {
                       return;
                   }

                   var options = {
                       submitActionId: this.OptionsListControl.SelectedValue
                   };

                   formServices.getSubmitActionDefinition(options)
                       .then(this.addAction.bind(this, this.OptionsListControl.SelectedItem));

                   this.OptionsListControl.SelectedValue = "";
                   this.Add.IsOpen = false;
               },

               addAction: function (originalAction, action) {
                   if (action != null) {
                       extendAction(action, originalAction);
                       if (action.editor) {
                           this.editAction(action);
                       } else {
                           this.SubmitActionsListControl.add(action);
                       }
                   }
               },

               removeAction: function () {
                   if (this.SubmitActionsListControl.SelectedItem) {
                       this.SubmitActionsListControl.remove(this.SubmitActionsListControl.SelectedItem);
                   }
               },

               editAction: function (action) {
                   var actionDefinition = action || this.SubmitActionsListControl.SelectedItem;
                   if (this.EditActionsDialog && actionDefinition) {
                       var editor = actionDefinition.editor;
                       if (!speak.utils.is.a.guid(editor)) {
                           this.EditActionsDialog.show(editor, actionDefinition, this.editActionCompleted.bind(this));
                       }
                       else if (editors.hasOwnProperty(editor)) {
                           this.EditActionsDialog.show(editors[editor], actionDefinition, this.editActionCompleted.bind(this));
                       }
                       else {
                           getItem(editor,
                               function (item) {
                                   if (item != null) {
                                       editors[editor] = item.$path;
                                       this.EditActionsDialog.show(editors[editor], actionDefinition, this.editActionCompleted.bind(this));
                                   }
                               }.bind(this));
                       }
                   }
               },

               moveAction: function (isUpwards) {
                   var items = this.SubmitActionsListControl.Items;
                   var position = this.SubmitActionsListControl.indexOf(this.SubmitActionsListControl.SelectedItem) - (isUpwards || 0);
                   items.splice(position, 2, items[position + 1], items[position]);
                   this.SubmitActionsListControl.trigger("itemsChanged", items);
               }
           };
       },
       "SubmitActionsManager");
})(Sitecore.Speak);