define([
    "sitecore",
    "/-/speak/v1/listmanager/commonPagesDefinition.js",
    "/-/speak/v1/listmanager/segmentsPagesDefinition.js"
],
    function (sitecore, commonPagesDefinition, segmentsPage) {
        var global = {},
            fakeLocation = {
                replace: function (path) {
                }
            },
            self;
        if (typeof window !== "undefined") {
            global = window;
        } else {
            global.location = fakeLocation;
        }
        var extensionObject = {
            initialized: function () {
                self = this;
                this.on("app:loaded",
                    function () {
                        sitecore.trigger("dialog:loaded", self);
                        self.location = global.location;
                        self.initializeBaseStructure();
                        self.initializeConstants();
                        self.subscribeControlHandlers();
                        self.bindData(self.baseStructures);
                        self.updateSegmentListControlHeight();
                    }, this);
                this.OkButton.on("click", this.onOkClicked, this);
                this.CancelButton.on("click", this.hideDialog, this);
                this.SegmentsDataSource.on("itemsChanged", this.excludeSelectedSegments, this);
                this.SegmentsDataSource.on("itemsReady", function () {
                    this.SelectSegmentDialog.show();
                    this.SegmentListControl.set("selectedItem", "");
                }, this);
            },
            updateSegmentListControlHeight: function () {
                // Max Height is found by an empirical way (change and see is it works)
                self.SegmentListControl.set("maxHeight", 500);
            },
            onOkClicked: function () {
                this.hideDialog();

                var selectedSegmentid = this.getSelectedItemId({ control: "SegmentListControl" });
                if (selectedSegmentid !== "undefined") {
                    this.success(selectedSegmentid);
                } else {
                    this.error(selectedSegmentid);
                }
            },
            showDialog: function (parameters) {
                this.success = parameters.success;
                this.error = parameters.error;
                this.entityId = parameters.entityId;
                this.segmentsToExclude = parameters.segmentsToExclude;                      
                this.SegmentsDataSource.refresh();                        
            },
            hideDialog: function () {
                this.SelectSegmentDialog.hide();
            },
            excludeSelectedSegments: function () {
                var self = this;
                if (self.segmentsToExclude !== "undefined" &&
                    this.segmentsToExclude != null &&
                    this.segmentsToExclude !== "") {
                        var items = this.SegmentsDataSource.get("items");
                    
                        items = items.filter(function (el) {
                            return self.segmentsToExclude.indexOf(el.Id) < 0;
                        });

                        this.SegmentsDataSource.set("items", items);
                        this.SegmentsDataSource.trigger("itemsReady");
                }
            },
        };
        return sitecore.Definitions.App.extend(
            commonPagesDefinition.mergeListPages(segmentsPage, extensionObject));
    });