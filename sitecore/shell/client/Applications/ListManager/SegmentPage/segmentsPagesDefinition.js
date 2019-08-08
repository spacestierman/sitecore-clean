(function() {
    var dependencies = (typeof window !== "undefined")
        ? [
            "sitecore", "/-/speak/v1/listmanager/commonPagesDefinition.js",
            "/-/speak/v1/listmanager/SegmentsActionsManager.js", "/-/speak/v1/listmanager/storageMediator.js",
            "/-/speak/v1/listmanager/dialogs.js"
        ]
        : [null, "../commonPagesDefinition", "./segmentsActionsManager", "../storageMediator", null];

    define(dependencies,
        function (sitecore, commonPagesDefinition, segmentsActionsManager, storageMediator, dialogs) {
            var global = {},
                fakeLocation = {
                    replace: function(path) {
                    }
                },
                keyUpKeyCode = 13,
                self,

                deleteSegmentWarningMessage =
                    "When you edit or delete a segment, the segment is updated or removed everywhere that it is used in Sitecore. Do you want to continue?",
                confirm = "Confirm";
            if (typeof window !== "undefined") {
                global = window;
            } else {
                global.location = fakeLocation;
            }

            var extensionObject = {
                location: {},
                initialized: function () {
                    this.dialogs = dialogs;
                    self = this;
                    this.location = global.location;

                    this.initializeBaseStructure();

                    if (this.SegmentsActionsManager !== "undefined") {
                        this.SegmentsActionsManager = segmentsActionsManager;
                        this.SegmentsActionsManager.init();
                        this.initializeActions();
                    }

                    this.initializeConstants();
                    this.subscribeControlHandlers();
                    this.bindData(this.baseStructures);
                },
                onSelectSegment: function (input) {
                  var obj = $(input), selectedItemId = obj.attr("data-id");
                  location.href = this.SegmentsDataSource.get("segmentPagePattern") + selectedItemId;
                },
                initializeActions: function () {
                    this.on("delete:segment", this.onDeleteSegment, this);
                    sitecore.on("select:segment", this.onSelectSegment, this);
                },
                initializeBaseStructure: function () {
                    this.baseStructures = [
                        {
                            control: this.SegmentListControl,
                            dataSource: this.SegmentsDataSource,
                            actionsDataSource: this.ActionsDataSource,
                            actionControl: this.ActionControl
                        }
                    ];
                },
                subscribeControlHandlers: function() {
                    this.SegmentsSearchButtonTextBox.viewModel.$el.keyup(this.onSegmentsSearchButtonTextBoxKeyUp);
                },
                initializeConstants: function() {
                    this.segmentPagePattern = this.baseStructures[0].dataSource.get("segmentPagePattern");
                    this.searchExpressionKey = "searchExpression";
                    this.pageIndexKey = "pageIndex";
                    this.languageKey = "language";
                    this.pageSizeKey = "pageSize";
                },
                bindData: function(baseStructures) {
                    var current = commonPagesDefinition.defaultIfValueIsUndefinedOrNull(self, this);
                    Array.prototype.forEach.call(baseStructures,
                        function(baseStructure) {
                            if (current.SegmentsActionsManager) {
                                current.SegmentsActionsManager.addBaseStructure(baseStructure);
                            }
                        });
                },
                onDeleteSegment: function(parameters) {
                    var current = commonPagesDefinition.defaultIfValueIsUndefinedOrNull(self, this);

                    var targetControl = current.getTargetControl(parameters);
                    if (typeof targetControl === "undefined" || targetControl === null) {
                        return;
                    }

                    var selectedItemId = targetControl.get("selectedItemId");
                    if (selectedItemId === "") {
                        return;
                    }
                    var selectedItem = targetControl.get("selectedItem");

                    var dialogParams = {
                        dialogHeader: current.StringDictionary.get(confirm),
                        message: current.StringDictionary.get(deleteSegmentWarningMessage),
                        success: function () {
                            var actionData = current.extractActionData(parameters);
                            current.callControllerDirectly(
                                actionData.url,
                                JSON.stringify(selectedItem),
                                function () {
                                    current.onActionSuccess("The segment has been deleted.", targetControl);
                                },
                                function (status, statusText) {
                                    current.showDefaultError(status,
                                        statusText,
                                        current.StringDictionary.get("The segment has not been deleted."),
                                        current.SegmentsMessageBar);
                                },
                                "application/json",
                                "DELETE");
                        },
                        error: function (error) {
                            // in case if cancelation should be logged
                        }
                    };

                    current.dialogs.showDialog(this.dialogs.Ids.OkCancelDialog, dialogParams);
                },
                onActionSuccess: function(message, targetControl) {
                    var current = commonPagesDefinition.defaultIfValueIsUndefinedOrNull(self, this);
                    Array.prototype.forEach.call(current.baseStructures,
                        function(baseStructure) {
                            baseStructure.dataSource.refresh();
                        });
                    current.showNotification(current.StringDictionary.get(message), current.SegmentsMessageBar);
                    targetControl.set("selectedItemId", "");
                    targetControl.set("selectedItem", "");
                },
                segmentsSearchButtonTextBoxKeyUp: function(e) {
                    if (e.keyCode === keyUpKeyCode) {
                        var current = this;
                        current.findSegments();
                    }
                },
                addSourceCallback: function(itemId, item, pagePattern) {
                    if (typeof item !== "undefined" && item !== null) {
                        var items = [];
                        items.push(item);
                        storageMediator.addToStorage("items", items);
                        location.href = pagePattern + "?action=fromexisting";
                    } else {
                        location.href = pagePattern;
                    }
                },
                findSegments: function () {
                    var current = this;
                    var searchText = current.SegmentsSearchButtonTextBox.get("text");
                    var baseStructure = current.baseStructures[0];
                    baseStructure.dataSource.set(current.searchExpressionKey, searchText);
                    baseStructure.dataSource.refresh();
                }
            };

            return commonPagesDefinition.mergeListPages(commonPagesDefinition, extensionObject);
        });
})();