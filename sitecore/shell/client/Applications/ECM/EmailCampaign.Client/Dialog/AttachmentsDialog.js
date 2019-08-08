define([
  "sitecore",
  "/-/speak/v1/ecm/ServerRequest.js",
  "/-/speak/v1/ecm/DialogBase.js",
  "/-/speak/v1/ecm/DialogService.js"
],
function (
  sitecore,
  ServerRequest,
  DialogBase,
  DialogService
  ) {
  return DialogBase.extend({
    initialized: function () {
      this._super();
      this.on({
        "action:addattachment": function () {
          this.detachHandlers();
          this.DialogWindow.hide();
          DialogService.show('addAttachment', {
            data: {
              messageId: this.options.data.MessageContext.get("messageId"),
              language: this.options.data.MessageContext.get("language")
            },
            on: {
              complete: _.bind(function () {
                // Need to wait until current call queue will be executed(_.defer is used), to prevent bootstrap modals conflicts
                _.defer(_.bind(function () {
                  this.DialogWindow.show();
                  this.attachHandlers();
                }, this));
              }, this)
            }
          });
        },
        "action:deleteattachment": function () { this.removeSelectedAttachments(); }
      }, this);
      sitecore.on("change:messageContext", function () {
        this.AttachmentsListControl.set("items", this.options.data.MessageContext.get("attachments"));
      }, this);
      this.AttachmentsListControl.on("change:selectedItemId change:checkedItemIds change:items", this.setAttachmentActionsEnabled, this);
    },

    showDialog: function (options) {
      this._super(options);
      this.AttachmentsListControl.set("items", this.options.data.MessageContext.get("attachments"));
      this.setAttachmentActionsEnabled();
    },

    attachHandlers: function() {
      this._super();
      if (this.options.data.MessageContext) {
        this.options.data.MessageContext.on("change:isReadOnly", this.setAttachmentActionsEnabled, this);
      }
    },

    detachHandlers: function () {
      this._super();
      if (this.options.data.MessageContext) {
        this.options.data.MessageContext.off("change:isReadOnly", this.setAttachmentActionsEnabled);
      }
    },

    setAttachmentActionsEnabled: function () {
      var list = this.AttachmentsListControl;
      var areActionsEnabled = !this.options.data.MessageContext.get("isReadOnly");
      var areAttachmentsSelected = list.get("selectedItemId") !== "" || (list.get("checkedItemIds").length > 0 && list.get("items").length > 0);

      this.AddAttachmentButton.set("isEnabled", areActionsEnabled);
      this.RemoveAttachmentButton.set("isEnabled", areActionsEnabled && areAttachmentsSelected);

      /* This is workaround to disable/enable checkboxes in ListControl
       * SPEAK doesn't have functionality to disable checkboxes which are related to MultiSelectList behaviour in ListControl
       */
      $.each(this.AttachmentsListControl.viewModel.$el.find('input[type=checkbox], .cb'), function(i, checkbox) {
          checkbox.disabled = !areActionsEnabled;
      });
    },

    removeSelectedAttachments: function () {
      if (!this.options.data.MessageContext) {
        return;
      }

      var checkedItemIds = this.AttachmentsListControl.get("checkedItemIds");

      if (!checkedItemIds || checkedItemIds.length === 0) {
        var selectedItemId = this.AttachmentsListControl.get("selectedItemId");

        if (selectedItemId === "") {
          return;
        }

        checkedItemIds = [selectedItemId];
      }

      var context = {
        attachmentIds: checkedItemIds,
        messageId: this.options.data.MessageContext.get("messageId"),
        language: this.options.data.MessageContext.get("language"),
        messageBar: this.MessageBar
      };

      sitecore.Pipelines.RemoveAttachment.execute({ app: this.options.data, currentContext: context });
      this.AttachmentsListControl.set("selectedItemId", "");
    }
  });
});
