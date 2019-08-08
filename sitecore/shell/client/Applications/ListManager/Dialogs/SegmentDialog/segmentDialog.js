define([
    "sitecore",
    "/-/speak/v1/listmanager/commonPagesDefinition.js",
    "/-/speak/v1/listmanager/SegmentDefinition.js"],
    function (sitecore, commonPagesDefinition, segmentDefinition) {
        var self;
        var extensionObject = {
            initialized: function () {
                self = this;
                this.on("app:loaded",
                    function () {
                        sitecore.trigger("dialog:loaded", self);
                        self.initializeDataSources();
                        self.initializeActions();
                        self.SegmentEntityDataSource.on("change:entity", self.updateSegmentUi, self);
                        self.initializeChangeTracking();
                        self.initializeAdditionalFields();
                    }, this);
                this.SaveButton.on("click", this.saveSegment, this);
                this.CancelButton.on("click", this.hideDialog, this);
            },
            showDialog: function (parameters) {
                this.success = parameters.success;
                this.error = parameters.error;
                this.entityId = parameters.entityId;
                this.dialogHeader = parameters.dialogHeader;
                this.SegmentBuilder.viewModel.once("iFrameLoaded", this.initializeSegment, self);
                this.SegmentDialog.show();
            },
            hideDialog: function () {
                this.SegmentDialog.hide();
            },
            initializeActions: function () {
                this.on("taskpage:segmentaccordion:add:new:condition", this.onAddNewCondition, this);
            },
            initializeSegment: function () {
                self.SegmentDialog.viewModel.$el.find(".sc-dialogWindow-header-title").text(self.dialogHeader);
                self.emptyRulesPanel();

                if (typeof (self.entityId) !== "undefined" &&
                    self.entityId !== null &&
                    self.entityId !== "") {
                    self.SegmentEntityDataSource.unset("entityID", { silent: true });
                    self.SegmentEntityDataSource.set("entityID", self.entityId);
                } else {
                    self.SegmentEntityDataSource.unset("entityID");
                    self.GeneralInformationNameValue.set("text", "");
                    self.GeneralInformationDescriptionValue.set("text", "");
                    self.GeneralInformationNameValue.viewModel.focus();
                }
            },
            emptyRulesPanel: function() {
                self.SegmentBuilder.viewModel.cleanConditions();
            },
            updateSegmentUi: function (dataSource, model) {
                var current = commonPagesDefinition.defaultIfValueIsUndefinedOrNull(self, this);
                model.Name && current.GeneralInformationNameValue.set("text", model.Name);
                model.Description && current.GeneralInformationDescriptionValue.set("text", model.Description);
                model.RulesXml && current.updateRulesPanel(model);
                current.SaveButton.set("isEnabled", false);
            },
            showErrorWhenSegmentNameEmpty: function () {
                this.GeneralInformationNameValue.viewModel.focus();
            },
            notify: function (model) {
                var current = commonPagesDefinition.defaultIfValueIsUndefinedOrNull(self, this);
                current.success(model);
                current.hideDialog();
            },
            updateEntityAndNotify: function (model) {
                var current = commonPagesDefinition.defaultIfValueIsUndefinedOrNull(self, this);
                current.success(current.model);
                current.hideDialog();
            },
            notifyAboutError: function (error) {
                var current = commonPagesDefinition.defaultIfValueIsUndefinedOrNull(self, this);
                current.error(error);
            }
        };
        return sitecore.Definitions.App.extend(
            commonPagesDefinition.mergeListPages(segmentDefinition, extensionObject));
    });