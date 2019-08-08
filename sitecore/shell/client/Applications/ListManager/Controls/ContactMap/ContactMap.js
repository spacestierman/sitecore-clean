define(["sitecore", "backbone", "jquery"],
    function(sitecore, backbone, $) {

        var mapToRow = backbone.LayoutManager.extend({
            template: "importmapto-row",
            initialize: function(options) {
                this.parent = options.parent;
            },
            afterRender: function() {
                this.sync();
            }
        });

        return sitecore.Factories.createBaseComponent({
            name: "ContactMap",
            base: "ControlBase",
            selector: ".sc-importMapTo",
            rowSelector: ".sc-importmaptobody",
            manualMapSelector: ".sc-importmaptomanualmap",
            identifierSourceMapSelector: ".sc-identifiersourcemap",
            initialize: function() {
                this.originalModel = this.$el.data("sc-importmodel") ? this.$el.data("sc-importmodel") : [];
                this.mapToRows = [];
                this.MappingModel = [];
                this.RequiredModel = [];
                this.unselectedValue = "";
                this.emailDataField = "Email";
                this.identifierSourceDataField = "IdentifierSource";
            },
            onSelectChange: function(val, $el) {
                var self = this;
                var value = typeof val !== "undefined" && val !== null ? val : self.unselectedValue;
                var mappingModelIndex = $el.attr("data-position");
                var dataField = $el.attr("data-datafield");
                var autoMap = $el.attr("data-automap");
                var required = $el.attr("data-required") === "true";
                var isVisible = $el.is(":visible");

                if (typeof mappingModelIndex !== "undefined" && self.MappingModel[mappingModelIndex]) {
                    self.MappingModel[mappingModelIndex].isVisible = isVisible;
                    if (autoMap === "true") {
                        if (isVisible === false) {
                            var emailFields = self.MappingModel.filter(function(m) {
                                return m.isEmail === true;
                            });
                            if (emailFields.length > 0) {
                                value = emailFields[0].value;
                                self.setAutoValue(self.MappingModel, value);
                                $el.val(value);
                            }
                        }
                    }
                    self.MappingModel[mappingModelIndex].value = value;
                    if (dataField === self.emailDataField) {
                        self.MappingModel[mappingModelIndex].isEmail = true;
                        self.setAutoValue(self.MappingModel, value);
                    }
                    self.MappingModel[mappingModelIndex].required = required;
                }
                self.model.trigger("add:contact:field:changed");
            },
            setAutoValue: function(arr, value) {
                arr.forEach(function(model) {
                    if (model.autoMap === true && model.isVisible === false) {
                        model.value = value;
                    }
                });
            },
            addRows: function() {
                var self = this;
                var baseSelector = self.$el.find(this.rowSelector);
                var manualMap = self.$el.find(this.manualMapSelector);
                var identifierSourceMap = self.$el.find(this.identifierSourceMapSelector);
                var autoMappedElements = [];
                var identifierSourceElements = [];

                Array.prototype.filter.call(self.originalModel,
                    function(originalModelFieldValue) {
                        if (originalModelFieldValue.Required) {
                            self.RequiredModel.push(originalModelFieldValue);
                        }
                    });

                for (var i = 0; i < self.originalModel.length; i++) {
                    var fieldValue = self.originalModel[i];
                    var mapping = { key: fieldValue.DataField, value: this.unselectedValue };

                    var fieldModel = backbone.Model.extend({
                        defaults: {
                            fieldName: "",
                            dataField: "",
                            required: false,
                            position: "",
                            autoMap: false,
                            maxLength: ""
                        }
                    });

                    var field = new fieldModel({
                        fieldName: fieldValue.FieldName,
                        dataField: fieldValue.DataField,
                        required: fieldValue.Required,
                        position: i,
                        autoMap: fieldValue.AutoMap,
                        maxLength: fieldValue.MaxLength
                    });
                    var mapToRowPanel = new mapToRow({
                        model: field,
                        parent: self,
                        app: self.app,
                        serialize: field.toJSON()
                    });

                    self.mapToRows.push(mapToRowPanel);
                    baseSelector.append(mapToRowPanel.el);
                    mapToRowPanel.render();

                    var textBox = mapToRowPanel.$el.find("input[type='text']");
                    textBox.on("keyup",
                        function() {
                            self.onSelectChange(this.value, $(this));
                        });

                    if (fieldValue.AutoMap === true) {
                        mapToRowPanel.$el.hide();
                        autoMappedElements.push(mapToRowPanel.$el);
                        mapping.autoMap = true;
                        mapping.isVisible = false;
                    }
                    if (fieldValue.DataField === this.identifierSourceDataField) {
                        mapToRowPanel.$el.hide();
                        identifierSourceElements.push(mapToRowPanel.$el);
                        mapping.isVisible = false;
                    }
                    self.MappingModel.push(mapping);
                }

                manualMap.on("change",
                    function() {
                        autoMappedElements.forEach(function(el) {
                            self.toggleField(el, self);
                        });
                    });
                identifierSourceMap.on("change",
                    function () {
                        identifierSourceElements.forEach(function($el) {
                            self.toggleField($el, self);
                        });
                    });
            },
            resetRows: function() {
                var self = this;
                Array.prototype.filter.call(self.mapToRows,
                    function(mapToRowPanel) {
                        mapToRowPanel.remove();
                        mapToRowPanel.render();
                    });
                self.mapToRows = [];
                self.RequiredModel = [];
                self.MappingModel = [];
                var baseSelector = self.$el.find(this.rowSelector);
                if (baseSelector) {
                    baseSelector.empty();
                }
                var manualMap = self.$el.find(this.manualMapSelector);
                if (manualMap) {
                    manualMap.off();
                    manualMap.attr("checked", false);
                }
                var identifierSourceMap = self.$el.find(this.identifierSourceMapSelector);
                if (identifierSourceMap) {
                    identifierSourceMap.off();
                    identifierSourceMap.attr("checked", false);
                }
            },
            allRequiredSelected: function() {
                var self = this;
                var returnValue = true;
                for (var j = 0; j < self.RequiredModel.length; j++) {
                    var selected = false;
                    for (var i = 0; i < self.MappingModel.length; i++) {
                        if (self.MappingModel[i].key === self.RequiredModel[j].DataField) {
                            if (self.MappingModel[i].key === self.identifierSourceDataField &&
                                self.MappingModel[i].isVisible === false) {
                                selected = true;
                            } else {
                                selected = self.MappingModel[i].value.trim() !== this.unselectedValue;
                            }
                            break;
                        }
                    }
                    if (!selected) {
                        returnValue = false;
                        break;
                    }
                }
                return returnValue;
            },
            getMappingModel: function() {
                var self = this;
                var returnModel = [];
                Array.prototype.filter.call(self.MappingModel,
                    function(mapping) {
                        if (mapping.key !== "") {
                            returnModel.push(mapping);
                        }
                    });

                return returnModel;
            },
            toggleField: function ($el, ctx) {
                $el.toggle();
                var text = $el.find("input[type='text']");
                var $text = $(text);
                var isVisible = $text.is(":visible");
                if (isVisible) {
                    $text.val(ctx.unselectedValue);
                }
                ctx.onSelectChange($text.val(), $text);
            }
        });
    });