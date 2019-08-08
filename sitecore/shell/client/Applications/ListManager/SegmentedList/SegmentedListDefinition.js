(function () {
    // The trick to test in node and in browser.
    var dependencies = (typeof window !== "undefined")
        ? ["/-/speak/v1/listmanager/ContactListDefinition.js", "/-/speak/v1/listmanager/urlParser.js"]
        : ["../ContactList/ContactListDefinition", "../urlParser"];
    define(dependencies,
        function (contactListDefinition, urlParser) {
            var contactListPagePattern = "/sitecore/client/Applications/List Manager/Taskpages/Contact list?id=",
                saveSegmentNotification = "The segment has been created and added to this list.",
                createSegmentHeader = "Create segment",
                editSegmentHeader = "Edit segment",
                confirm = "Confirm",
                editSegmentWarningMessage =
                    "When you edit or delete a segment, the segment is updated or removed everywhere that it is used in Sitecore. Do you want to continue?",
                extensionObject = {
                    listType: "SegmentedList",
                    initializeSpecificListActions: function () {
                        this.on("taskpage:convert:list", this.onConvertList, this);

                        this.on("taskpage:segmentedlist:segmentation:add:new",
                            function () {
                                this.onAddNewCondition();
                            },
                            this);
                        this.on("taskpage:segmentedlist:segmentation:add:existing",
                            function () {
                                this.onAddExistingSegment();
                            },
                            this);

                        this.SegmentsView.on("segment:edit", this.onEditSegment, this);
                    },
                    initializeAdditionalFields: function () {
                        $("[data-sc-id='SegmentationAccordion'] > div.sc-advancedExpander-body")
                            .css({ "border-left": "0", "border-right": "0" });

                        var mode = urlParser.getParameterFromLocationSearchByName("alldatabase");
                        if (mode == "1") {
                            this.updateUiForSources({
                                Source: "{ \"AllDatabase\" : true, \"IncludedLists\" : [], \"ExcludedLists\" : []}",
                                PredefinedText: ""
                            });
                        }
                        if (mode != "") {
                            urlParser.removeQueryParameter("alldatabase");
                        }

                        this.SegmentsView.on("segment:added segment:removed segment:updated", function () {
                            this.updateSaveButtonUi(this.SegmentsView,
                                this.SegmentsView.getSegmentIds(),
                                "Query");
                        }, this);

                        this.SegmentsView.on("segment:added segment:removed", function () {
                            this.SpaceBeforeSegments.set("isVisible", this.SegmentsView.getSegmentIds().length > 0);
                        }, this);
                    },
                    save: function () {
                        this.saveList();
                    },
                    onConvertList: function (parameters) {
                        this.executeAction(parameters, "ConvertList", this.onConvertListFinished, false);
                    },
                    onConvertListFinished: function (dataSource, current) {
                        var newListId = dataSource;
                        current.location.href = contactListPagePattern + newListId + "&action=convert";
                    },
                    saveAdditionalFields: function (model) {
                        model.SegmentIds = this.SegmentsView.getSegmentIds();
                        return model;
                    },
                    updateUiForAdditionalFields: function (model) {
                        if (model.SegmentIds) {
                            this.SpaceBeforeSegments.set("isVisible", model.SegmentIds.length > 0);
                            var segmentIds = model.SegmentIds.underlying || model.SegmentIds;                            
                            this.addSegmentsToViewInOrder(segmentIds);
                        }
                    },
                    onAddNewCondition: function () {
                        var current = this;
                        current.showSegmentDialog();
                    },
                    onAddExistingSegment: function () {
                        var current = this;
                        var dialogParams = {
                            success: function (segmentDefinitionId) {
                                current.addSegmentToView(segmentDefinitionId);
                            },
                            error: function (error) {
                                current.showNotification(
                                    error.message,
                                    current.ContactListMessageBar);
                            },
                            segmentsToExclude: this.SegmentsView.getSegmentIds()
                        };
                        this.dialogs.showDialog(this.dialogs.Ids.SelectSegmentDialog, dialogParams);
                    },

                    onEditSegment: function(segment) {
                        var current = this;
                        var dialogParams = {
                            message: current.StringDictionary.get(editSegmentWarningMessage),
                            success: function() {
                                current.showSegmentDialog(segment);
                            }
                        };

                        this.dialogs.showDialog(this.dialogs.Ids.OkCancelDialog, dialogParams);
                    },

                    showSegmentDialog: function (segment) {
                        var current = this;
                        var dialogHeader, entityId, segmentViewFunction;

                        if (segment == undefined) {
                            dialogHeader = current.SegmentStringDictionary.get(createSegmentHeader);
                            entityId = undefined;
                            segmentViewFunction = function(segmentDefinition) {
                                current.SegmentsView.addSegment({
                                    id: segmentDefinition.Id,
                                    name: segmentDefinition.Name,
                                    xmlRules: segmentDefinition.RulesXml
                                });
                                current.showNotification(
                                    current.SegmentStringDictionary.get(saveSegmentNotification),
                                    current.ContactListMessageBar);
                            };
                        } else {
                            dialogHeader = current.SegmentStringDictionary.get(editSegmentHeader);
                            entityId = segment.get("id");
                            segmentViewFunction = function(segmentDefinition) {
                                current.SegmentsView.updateSegment({
                                    id: segmentDefinition.Id,
                                    name: segmentDefinition.Name,
                                    xmlRules: segmentDefinition.RulesXml
                                });;
                            }
                        }

                        var dialogParams = {
                            dialogHeader: dialogHeader,
                            entityId: entityId,
                            success: segmentViewFunction,
                            error: function (error) {
                                current.showNotification(
                                    error.message,
                                    current.ContactListMessageBar);
                            }
                        }

                        current.dialogs.showDialog(this.dialogs.Ids.SegmentDialog, dialogParams);
                    },
                    getSegmentById: function (segmentDefinitionId) {
                        var dfd = $.Deferred();
                        var url = "/sitecore/api/ssc/ListManagement/Segment?id={" + encodeURI(segmentDefinitionId).toUpperCase() + "}";
                        var contentType = "application/json; charset=utf-8";
                        this.callControllerDirectly(url, null, function (result) {
                            dfd.resolve({ id: result.Id, name: result.Name, xmlRules: result.RulesXml });
                        }, function (errorStatus) {
                            if (errorStatus == 404) {
                                dfd.resolve({ id: segmentDefinitionId, isRemoved: true });
                            }

                            dfd.reject(errorStatus)
                        }, contentType, "GET");                        

                        return dfd.promise();
                    },
                    addSegmentToView: function (segmentId, silent) {
                        var current = this;
                        current.getSegmentById(segmentId).then(
                            function (segment) {
                                current.SegmentsView.addSegment(segment, silent);
                            });
                    },
                    addSegmentsToViewInOrder: function (segmentIds) {
                        var current = this;
                        var getSegmentPromises = [];
                        for (var i in segmentIds) {
                            if (!segmentIds.hasOwnProperty(i)) {
                                continue;
                            }

                            var getSegmentPromise = this.getSegmentById(segmentIds[i]).then(
                                function (segment) {                                    
                                    return segment;
                                },
                                function (error) {                                    
                                    return null;
                                }
                            );

                            getSegmentPromises.push(getSegmentPromise);                            
                        }

                        $.when.apply($, getSegmentPromises).then(function () {
                            for (var j = 0; j < arguments.length; j++) {
                                if (arguments[j]) {
                                    current.SegmentsView.addSegment(arguments[j], true);
                                }
                            }
                        });
                    }
                }

            return contactListDefinition.mergeListPages(contactListDefinition, extensionObject);
        });
})();