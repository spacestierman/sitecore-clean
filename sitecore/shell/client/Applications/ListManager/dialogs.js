define((typeof window !== "undefined") ? ["sitecore"] : [null],
    function(sitecore) {
        var self;
        return {
            sc: sitecore,
            Ids: {
                SelectListDialog: "{43D7456E-C098-4F42-8805-7D905BA283D9}",
                ImportDialog: "{664BD429-0733-4E60-A41C-1D1F434DC96B}",
                AddNewContactDialog: "{B82E195E-1B74-4DA6-8AE2-56C87838F035}",
                SegmentDialog: "{9CE2569D-8D2C-4678-89AB-8663857D6EF1}",
                SelectSegmentDialog: "{51F5EA51-38E0-4CCD-AE21-8740621D1C60}",
                OkCancelDialog: "{3C52625E-3F14-4050-8012-1A7666636742}"
            },
            init: function(panel) {
                self = this;
                self.DialogsLoadOnDemandPanel = panel;

                self.sc.on("dialog:loaded",
                    function(dialog) {
                        self.DialogsLoadOnDemandPanel.set("isBusy", false);
                        dialog.showDialog(self.CurrentDialogParams);
                        self.CurrentDialog = dialog;
                    });
            },
            showDialog: function(dialogId, dialogParams) {
                var panel = self.DialogsLoadOnDemandPanel;
                if (!panel.get("isBusy")) {
                    if (panel.viewModel.itemId() === dialogId && panel.viewModel.isLoaded()) {
                        self.CurrentDialog.showDialog(dialogParams);
                    } else {
                        panel.set("isBusy", true);
                        panel.set("itemId", dialogId);
                        self.CurrentDialogParams = dialogParams;
                        panel.refresh();
                    }
                }
            },
        };
    });