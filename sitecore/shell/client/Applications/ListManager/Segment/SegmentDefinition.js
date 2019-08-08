(function () {
    // The trick to test in node and in browser.
    var dependencies = (typeof window !== "undefined")
        ? [
            "/-/speak/v1/listmanager/commonPagesDefinition.js",
            "/-/speak/v1/listmanager/urlParser.js",
            "/-/speak/v1/listmanager/storageMediator.js",
            "/-/speak/v1/listmanager/dialogs.js"
        ]
        : ["../commonPagesDefinition", "../urlParser", "../storageMediator", null];

    define(dependencies,
        function(commonPagesDefinition, urlParser, storageMediator, dialogs) {
            var self,
                global = {},
                fakeLocation = {
                    replace: function(path) {
                    }
                },
                fakeDocument = {
                    title: ""
                },
                segmentWasNotRemoved = "The segment was not removed.",
                deleteSegmentWarningMessage =
                    "When you edit or delete a segment, the segment is updated or removed everywhere that it is used in Sitecore. Do you want to continue?",
                saveSegmentNotification = "The segment has been saved.",
                confirm = "Confirm";

            if (typeof window !== "undefined") {
                global = window;
            } else {
                global.location = fakeLocation;
                global.document = fakeDocument;
            }

            var extensionObject = {
                listType: "SegmentTask",
                location: {},
                initialized: function () {
                    self = this;
                    this.dialogs = dialogs;
                    this.location = global.location;
                    this.document = global.document;
                    this.UrlParser = urlParser;
                    this.StorageMediator = storageMediator;
                    this.initializeSegment();
                    this.initializeDataSources();
                    this.initializeActions();
                    this.SaveButton.on("click", this.saveButtonClick, this);
                    this.SegmentEntityDataSource.on("change:entity", this.updateSegmentUi, this);
                    this.initializeChangeTracking();
                    this.initializeAdditionalFields();
                    self.updateSaveButtonUi(self.updateSaveButtonUi,
                        self.GeneralInformationNameValue.viewModel.$el.val(),
                        "Name");
                    
                    this.dialogs.init(this.DialogsLoadOnDemandPanel);
                },
                saveButtonClick: function () {
                    this.save();
                },
                save: function () {
                    this.saveSegment();
                },
                initializeDataSources: function () {
                    this.refreshDeferredDataSource(this.SegmentEntityDataSource);
                },
                refreshDeferredDataSource: function (dataSource) {
                    dataSource.IsDeferred = true;
                    dataSource.refresh();
                    dataSource.IsDeferred = false;
                },
                initializeActions: function () {
                    this.on("taskpage:segmentaccordion:add:new:condition", this.onAddNewCondition, this);
                    this.on("taskpage:delete:segment", this.onDeleteSegment, this);
                    this.initializeSegmentActions();
                },
                initializeSegmentActions: function () {
                    var entityId = this.UrlParser.getParameterFromLocationSearchByName("id");
                    if (entityId === "") {
                        this.SegmentActions.set("isVisible", false);
                    }
                },
                initializeSegment: function () {
                    var entityId = this.UrlParser.getParameterFromLocationSearchByName("id");
                    if (entityId === "") {
                        this.GeneralInformationNameValue.viewModel.focus();
                    } else {
                        this.SegmentEntityDataSource.set("entityID", entityId);
                    }
                },
                defaultErrorCallback: function (status, statusText, errorMessage) {
                    var current = commonPagesDefinition.defaultIfValueIsUndefinedOrNull(self, this);
                    current.showDefaultError(status,
                        statusText,
                        current.StringDictionary.get(errorMessage),
                        current.SegmentMessageBar);
                },
                executeActionConfirm: function (message) {
                    return confirm(message);
                },
                onAddNewCondition: function () {
                    this.SegmentBuilder.viewModel.addNewCondition();
                },
                onDeleteSegment: function (parameters, isConfirm) {
                    var current = commonPagesDefinition.defaultIfValueIsUndefinedOrNull(self, this);

                    var deletingOfSegment = function() {
                        var model = current.SegmentEntityDataSource.get("entity");
                        var headers = { "X-Requested-With": "XMLHttpRequest" };
                        var csrfToken = current.getAntiForgeryToken();
                        headers[csrfToken.headerKey] = csrfToken.value;
                        model.options.headers = headers;
                        model.destroy().then(current.onDeleteSegmentFinished,
                            function (error) {
                                current.defaultErrorCallback(500, null, segmentWasNotRemoved);
                            });
                    }

                    var dialogParams = {
                        dialogHeader: current.StringDictionary.get(confirm),
                        message: current.StringDictionary.get(deleteSegmentWarningMessage),
                        success: function () {
                            deletingOfSegment();
                        }
                    };

                    if (this.getIsConfirm(isConfirm) === true) {
                        this.dialogs.showDialog(this.dialogs.Ids.OkCancelDialog, dialogParams);
                    } else {
                        deletingOfSegment();
                    }
                },
                onDeleteSegmentFinished: function () {
                    var current = commonPagesDefinition.defaultIfValueIsUndefinedOrNull(self, this);
                    current.location.href = current.Breadcrumb.get("prevPage");
                },
                updateSegmentUi: function (dataSource, model) {
                    var current = commonPagesDefinition.defaultIfValueIsUndefinedOrNull(self, this);

                    model.Name && this.setTitle(model.Name);
                    model.Name && this.GeneralInformationNameValue.set("text", model.Name);
                    model.Description && this.GeneralInformationDescriptionValue.set("text", model.Description);
                    model.Created && this.InfoSpotCreatedText.set("text", current.parseIsoDate(model.Created).toLocaleDateString());
                    model.Modified && this.InfoSpotModifiedText.set("text", current.parseIsoDate(model.Modified).toLocaleDateString());
                    model.CreatedBy && this.InfoSpotCreatedByText.set("text", model.CreatedBy);
                    this.updateRulesPanel(model);

                    if (model.Notification) {
                        current.showWarning(model.Notification, current.SegmentMessageBar, 0, true);
                    }
                    
                    this.SaveButton.set("isEnabled", false);
                },
                initializeAdditionalFields: function () {
                    $("[data-sc-id='SegmentationAccordion'] > div.sc-advancedExpander-body")
                        .css({ "border-left": "0", "border-right": "0" });

                    
                    var current = this;
                    current.SegmentBuilder.on("sc.listmanagement.segmentbuilder.rule.changed",
                        function () {
                            var rulesXml = current.SegmentBuilder.viewModel.getRulesXML();
                            current.SpaceBeforeSegmentBuilder.set("isVisible", !current.isRulesXmlEmpty());
                            current.updateSaveButtonUi(current.SegmentBuilder, rulesXml, "RulesXml");
                        });                    
                },
                updateRulesPanel: function (model, forceUpdate) {
                    if (this.SegmentBuilder && (forceUpdate || this.isRulesXmlEmpty())) {
                        this.SegmentBuilder.viewModel.setRulesXML(model.RulesXml);
                        var emptyRules = typeof model.RulesXml === "undefined" || model.RulesXml === null || model.RulesXml.length === 0 || model.RulesXml === "<ruleset />";
                        this.SpaceBeforeSegmentBuilder.set("isVisible", !emptyRules);
                    }
                },
                isRulesXmlEmpty: function () {
                    var result = this.SegmentBuilder.viewModel.getRulesXML();
                    return typeof result === "undefined" || result === null || result.length === 0 || result === "<ruleset />";
                },
                initializeChangeTracking: function () {
                    var current = commonPagesDefinition.defaultIfValueIsUndefinedOrNull(self, this);
                    current.GeneralInformationNameValue.viewModel.$el
                        .keyup(function () {
                            current.updateSaveButtonUi(current.updateSaveButtonUi,
                                current.GeneralInformationNameValue.viewModel.$el.val(),
                                "Name");
                        });
                    current.GeneralInformationDescriptionValue.viewModel.$el
                        .keyup(function () {
                            current.updateSaveButtonUi(current.GeneralInformationDescriptionValue,
                                current.GeneralInformationDescriptionValue.viewModel.$el.val(),
                                "Description");
                        });
                },
                setTitle: function (title) {
                    this.document.title = title;
                    this.HeaderTitle.set("text", title);
                },
                updateSaveButtonUi: function (control, value, property) {
                    var model = this.SegmentEntityDataSource.get("entity"),
                        enabled = true;
                    if (model !== null) {
                        if (property === "RulesXml") {
                            this.refreshRequired = true;
                        } else {
                            enabled = model[property] !== value ||
                                this.GeneralInformationNameValue.viewModel.$el.val() !== model["Name"] ||
                                this.GeneralInformationDescriptionValue.viewModel.$el.val() !== model["Description"] ||
                                this.refreshRequired;
                        }
                    }
                    enabled = enabled && this.GeneralInformationNameValue.viewModel.$el.val().trim().length > 0;
                    this.SaveButton.set("isEnabled", enabled);
                },
                saveSegment: function () {
                    this.SaveButton.set("isEnabled", false);

                    var segmentName = this.GeneralInformationNameValue.get("text");
                    if (segmentName !== "") {
                        var model,
                            description = this.GeneralInformationDescriptionValue.get("text"),
                            entityId = this.SegmentEntityDataSource.get("entityID") || "";
                        if (entityId === "") {
                            model = {};
                        } else {
                            model = this.SegmentEntityDataSource.get("entity");
                        }

                        model.Name = segmentName;
                        model.Description = description;
                        model = this.updateSegmentModelRules(model);

                        var headers = { "X-Requested-With": "XMLHttpRequest" };
                        var csrfToken = this.getAntiForgeryToken();
                        headers[csrfToken.headerKey] = csrfToken.value;

                        if (entityId === "") {
                            var id = this.SegmentEntityDataSource.Service.constructor.utils.guid.generate();
                            model.Id = id;
                            this.model = model;
                            var query = this.SegmentEntityDataSource.Service.create(model, { headers: headers });
                            var promise = query.execute();
                            promise.then(this.updateEntityAndNotify, this.notifyAboutError);
                        } else {
                            model.options.headers = headers;
                            model.save().then(this.notify, this.notifyAboutError);
                        }
                    } else {
                        this.showErrorWhenSegmentNameEmpty();
                    }
                },
                showErrorWhenSegmentNameEmpty: function() {
                    this.GeneralInformationNameValue.viewModel.focus();
                    this.showError(this.StringDictionary.get("The 'Segment name' field should be specified."),
                        this.SegmentMessageBar);
                },
                updateSegmentModelRules: function (model) {
                    model.RulesXml = this.SegmentBuilder.viewModel.getRulesXML();
                    return model;
                },
                notify: function (model) {
                    var current = commonPagesDefinition.defaultIfValueIsUndefinedOrNull(self, this);
                    current.showNotification(current.StringDictionary.get(saveSegmentNotification),
                        current.SegmentMessageBar);
                    if (current.refreshRequired === true) {
                        current.refreshRequired = false;
                    }
                    current.setTitle(model.Name);
                },
                updateEntityAndNotify: function (model) {
                    var current = commonPagesDefinition.defaultIfValueIsUndefinedOrNull(self, this);
                    current.SegmentEntityDataSource.set("entityID", model.Id);
                    current
                        .showNotificationWithPreviousMessage(current.StringDictionary.get(saveSegmentNotification),
                        current.SegmentMessageBar);
                    current.SegmentActions.set("isVisible", true);

                    current.UrlParser.appendQueryParameter("id", model.Id);
                    current.setTitle(model.Name);
                },
                notifyAboutError: function (error) {
                    var current = commonPagesDefinition.defaultIfValueIsUndefinedOrNull(self, this);
                    var message;
                    try {
                        var errorResponse = JSON.parse(error.message);
                        if (errorResponse.ModelState) {
                            message = [];
                            for (var key in errorResponse.ModelState) {
                                for (var i = 0; i < errorResponse.ModelState[key].length; i++) {
                                    message.push(errorResponse.ModelState[key][i]);
                                }
                            }
                        } else {
                            message = errorResponse.Message;
                        }
                    } catch (e) {
                        message = error.message;
                    }

                    if (message === "Authorization has been denied for this request.") {
                        current.location.reload();
                    } else {
                        current.showError(current.StringDictionary.get(message), current.SegmentMessageBar);
                    }
                }
            };
            return commonPagesDefinition.mergeListPages(commonPagesDefinition, extensionObject);

        });
})();