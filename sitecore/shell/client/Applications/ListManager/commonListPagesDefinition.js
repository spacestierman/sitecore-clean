(function() {
    var dependencies = (typeof window !== "undefined")
        ? [
            "sitecore", "/-/speak/v1/listmanager/commonPagesDefinition.js",
            "/-/speak/v1/listmanager/listsActoinsManager.js", "/-/speak/v1/listmanager/storageMediator.js",
            "/-/speak/v1/listmanager/dialogs.js"
        ]
        : [null, "./commonPagesDefinition", "./listsActoinsManager", "./storageMediator", null];

    define(dependencies,
        function(sitecore, commonPagesDefinition, listsActionsManager, storageMediator, dialogs) {
            var global = {},
                fakeLocation = {
                    replace: function(path) {
                    }
                },
                keyUpKeyCode = 13,
                self;
            if (typeof window !== "undefined") {
                global = window;
            } else {
                global.location = fakeLocation;
            }

            var extensionObject = {
                location: {},
                listActionUrls: {
                    ContactList: "/sitecore/api/ssc/ListManagement/ContactList",
                    SegmentedList: "/sitecore/api/ssc/ListManagement/SegmentedList"
                },
                initialized: function() {
                    self = this;
                    this.location = global.location;
                    this.ListsActionsManager = listsActionsManager;

                    this.initializeActions();
                    this.initializeSpecificControls();
                    this.initializeConstants();
                    this.ListsActionsManager.init(this.contactListType, this.segmentedListType);
                    this.bindData(this.baseStructures);
                },
                initializeActions: function() {
                    this.on("convert:list", this.onConvert, this);
                    this.on("delete:list", this.onDeleteList, this);
                    this.on("move:list", this.onMoveList, this);
                    this.on("export:csv", this.onExportToCsv, this);
                    this.initializeActionsExtended();
                },
                initializeActionsExtended: function() {
                },
                initializeSpecificControls: function() {
                    this.baseStructures = [
                        {
                            control: this.ListControl,
                            dataSource: this.ListsDataSource,
                            actionsDataSource: this.ActionsDataSource,
                            actionControl: this.ActionControl,
                        }
                    ];

                    this.ListsSearchButtonTextBox.viewModel.$el.keyup(this.listsSearchButtonTextBoxKeyUp);
                    this.initializeSpecificControlsExtended();
                },
                initializeSpecificControlsExtended: function() {
                },
                initializeConstants: function() {
                    this.contactListType = this.baseStructures[0].dataSource.get("contactListType").toLowerCase();
                    this.segmentedListType = this.baseStructures[0].dataSource.get("segmentedListType").toLowerCase();
                    this.contactListPagePattern = this.baseStructures[0].dataSource.get("contactListPagePattern");
                    this.segmentedListPagePattern = this.baseStructures[0].dataSource.get("segmentedListPagePattern");
                    this.searchExpressionKey = "searchExpression";
                    this.pageIndexKey = "pageIndex";
                    this.languageKey = "language";
                    this.filterParameterKey = "filter";
                    this.pageSizeKey = "pageSize";
                },
                bindData: function(baseStructures) {
                    var current = commonPagesDefinition.defaultIfValueIsUndefinedOrNull(self, this);
                    Array.prototype.forEach.call(baseStructures,
                        function(baseStructure) {
                            current.initializeDataSource(baseStructure);
                            current.bindDataExtended(baseStructure);
                        });
                },
                bindDataExtended: function(baseStructure) {
                    var current = commonPagesDefinition.defaultIfValueIsUndefinedOrNull(self, this);
                    current.ListsActionsManager.addBaseStructure(baseStructure);
                },
                initializeDataSource: function(baseStructure) {
                    var current = commonPagesDefinition.defaultIfValueIsUndefinedOrNull(self, this);
                    current.initializeDataSourceExtended(baseStructure);
                },
                initializeDataSourceExtended: function(baseStructure) {
                },
                onConvert: function(parameters) {
                    var current = commonPagesDefinition.defaultIfValueIsUndefinedOrNull(self, this);
                    var targetControl = current.getTargetControl(parameters);
                    if (typeof targetControl !== "undefined" && targetControl !== null) {
                        var selectedItemId = targetControl.get("selectedItemId");
                        if (selectedItemId !== "") {
                            var selectedItem = targetControl.get("selectedItem");
                            var selectedItemType = selectedItem.get("Type");
                            if (selectedItemType.toString().toLowerCase() === current.segmentedListType) {
                                current.callController(parameters,
                                    "/" + selectedItemId + "/ConvertList/",
                                    current.onConvertSuccess,
                                    function(status, statusText) {
                                        current
                                            .showDefaultError(status,
                                                statusText,
                                                current.StringDictionary.get("List is not converted."),
                                                current.ListMessageBar);
                                    });
                            }
                        }
                    }
                },
                onConvertSuccess: function(data) {
                    var current = commonPagesDefinition.defaultIfValueIsUndefinedOrNull(self, this);
                    current.location.href = current.contactListPagePattern + data + "&action=convert";
                },
                onDeleteList: function(parameters) {
                    var current = commonPagesDefinition.defaultIfValueIsUndefinedOrNull(self, this);
                    var types = [current.segmentedListType, current.contactListType];

                    var alertText =
                        "The list will be deleted and all the associations to the list will be removed. This cannot be undone. Do you want to continue?";

                    var targetControl = current.getTargetControl(parameters);
                    if (typeof targetControl === "undefined" || targetControl === null) {
                        return;
                    }

                    var selectedItemId = targetControl.get("selectedItemId");
                    if (selectedItemId === "") {
                        return;
                    }
                    var selectedItem = targetControl.get("selectedItem");
                    var selectedItemType = selectedItem.get("Type");
                    if (types.indexOf(selectedItemType.toString().toLowerCase()) === -1) {
                        return;
                    }

                    if (!confirm(current.StringDictionary.get(alertText))) {
                        return;
                    }

                    var url = current.listActionUrls[selectedItemType];
                    current.callControllerDirectly(
                        url,
                        JSON.stringify(selectedItem),
                        function() {
                            current.onActionSuccess("The list has been deleted.", targetControl);
                        },
                        function(status, statusText) {
                            current.showDefaultError(status,
                                statusText,
                                current.StringDictionary.get("The list has not been deleted."),
                                current.ListMessageBar);
                        },
                        "application/json",
                        "DELETE");
                },
                onActionSuccess: function(message, targetControl) {
                    var current = commonPagesDefinition.defaultIfValueIsUndefinedOrNull(self, this);
                    Array.prototype.forEach.call(current.baseStructures,
                        function(baseStructure) {
                            baseStructure.dataSource.refresh();
                        });
                    current.showNotification(current.StringDictionary.get(message), current.ListMessageBar);
                    targetControl.set("selectedItemId", "");
                    targetControl.set("selectedItem", "");
                },
                onExportToCsv: function(parameters) {
                    var current = commonPagesDefinition.defaultIfValueIsUndefinedOrNull(self, this);
                    var targetControl = current.getTargetControl(parameters);
                    if (typeof targetControl !== "undefined" && targetControl !== null) {
                        var selectedItem = targetControl.get("selectedItem");
                        var selectedItemId = selectedItem.get("Id");
                        if (selectedItemId !== "") {
                            var actionData = current.extractActionData(parameters);
                            var fileUrl = actionData.url + "/" + selectedItemId + "/export";
                            current.downloadFile(fileUrl, current.onExportError);
                        }
                    }
                },
                onExportError: function(message) {
                    var current = commonPagesDefinition.defaultIfValueIsUndefinedOrNull(self, this);
                    current.showError(message, current.ListMessageBar);
                },
                listsSearchButtonTextBoxKeyUp: function(e) {
                    if (e.keyCode === keyUpKeyCode) {
                        var current = this;
                        current.findLists();
                    }
                },
                findLists: function() {
                    var current = this;
                    var searchText = current.ListsSearchButtonTextBox.get("text");
                    var baseStructure = current.baseStructures[0];
                    baseStructure.dataSource.set(current.searchExpressionKey, searchText);
                    baseStructure.dataSource.refresh();
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
                }
            };

            return commonPagesDefinition.mergeListPages(commonPagesDefinition, extensionObject);
        });
})();