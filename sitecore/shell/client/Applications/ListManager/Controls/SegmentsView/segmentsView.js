define(["sitecore", "backbone", "jquery", "underscore", "/-/speak/v1/controls/searchdatasource.js"],
    function (Sitecore, Backbone, $, _) {
        var Segment = Backbone.Model.extend({
            defaults: {
                "id": "",
                "name": "",
                "xmlRules": "",
                "isRemoved": false
            },
            initialize: function () {
                this.on("change:xmlRules", function (model, value) {
                    this.loadRulesRendering(value);
                });
                this.on("change", function (model) {
                    if (this.isReady) {
                        this.trigger("redraw", model);
                    }
                });

                this.loadRulesRendering(this.get("xmlRules"));
            },
            loadRulesRendering: function (xmlRules) {
                if (this.get("isRemoved")) {
                    return;
                }

                xmlRules = encodeURI(xmlRules);
                var url = this.get("renderUrl") + xmlRules;
                var self = this;
                this.isReady = false;
                $.get(url).always(function () { self.isReady = true })
                    .done(function (rules) {
                        self.set("rules", rules);
                    });
            }
        });

        var SegmentList = Backbone.Collection.extend({
            model: Segment,
            initialize: function () {
                this.on("remove",
                    function (model, collection) {
                        var removedIndex = model.get("index");
                        for (var i = removedIndex - 1; i < collection.length; i++) {
                            collection.models[i].set("index", i + 1);
                        }
                    });
                this.on("add",
                    function (model, collection) {
                        model.set("index", collection.length, { silent: true });
                    });
            }
        });

        var SegmentView = Backbone.LayoutManager.extend({
            isOpen: true,
            template: "segment-view",
            initialize: function (options) {
                this.parent = options.parent;
                this.listenTo(this.model, "redraw", function () {
                    this.render();
                });
            },
            afterRender: function () {
                this.$el.find(".scRule").each(function (i) {
                    $(this).text("Rule " + (i + 1));
                });
                this.$el.find("[align='center']").addClass("sc-empty-rules").attr("align", "left");
            },
            data: function () {
                var model = this.model.toJSON();
                if (!model.rules) {
                    model.rules = "";
                }

                return this.encodeName(model);
            },
            encodeName: function (obj) {
                var helpElem = $("<div/>");
                obj.name = helpElem.text(obj.name).html();
                return obj;
            },
            events: {
                "click .sc-accordion-chevron-link": "toggleAccordion",
                "click .sc-listmanagement-remove-condition": "removeSegment",
                "click .sc-listmanagement-edit-rules": "editSegment"
            },
            toggleAccordion: function () {
                if (this.isOpen) {
                    this.closeAccordion();
                } else {
                    this.openAccordion();
                }
            },
            closeAccordion: function () {
                this.isOpen = false;
                this.$el.find('.sc-accordion-chevron-link').find('span')
                    .removeClass("sc-accordion2-header-chevron-glyph-open");
                this.$el.find('.sc-accordion-body').toggle(false);
            },

            openAccordion: function () {
                this.isOpen = true;
                this.$el.find('.sc-accordion-chevron-link').find('span')
                    .addClass("sc-accordion2-header-chevron-glyph-open");
                this.$el.find('.sc-accordion-body').toggle(true);
            },
            removeSegment: function () {
                this.parent.removeSegment(this.model);
                this.$el.remove();
                this.stopListening();
            },
            editSegment: function () {
                this.parent.editSegment(this.model);
            }
        });

        var controlModel = Sitecore.Definitions.Models.ComponentModel.extend({
            initialize: function () {
                this.segments = new SegmentList;
            },
            addSegment: function (segmentData, silent) {
                segmentData.renderUrl = this.get("renderRuleUrl");
                this.segments.add(segmentData);

                if (!silent) {
                    this.trigger("segment:added")
                }
            },
            updateSegment: function (segmentData) {
                segmentData.renderUrl = this.get("renderRuleUrl");
                this.segments.add(segmentData, { merge: true });
                this.trigger("segment:updated");
            },
            removeSegment: function (segment) {
                this.segments.remove(segment);
                this.trigger("segment:removed");
            },
            getSegmentIds: function () {
                return this.segments.pluck("id");
            }
        });

        var controlView = Sitecore.Definitions.Views.ComponentView.extend({
            initialize: function () {
                this.model.set("renderRuleUrl", this.$el.attr("data-sc-renderrule-url"));
                this.listenTo(this.model.segments, "add", this.addSegmentView);
            },
            addSegmentView: function (segment) {
                var segm = new SegmentView({ model: segment, parent: this, app: this.app });
                this.$el.append(segm.el);
                segm.render();
            },
            removeSegment: function (segment) {
                this.model.removeSegment(segment);
            },
            editSegment: function (segment) {
                this.model.trigger("segment:edit", segment);
            }
        });

        return Sitecore.Factories.createComponent("SegmentsView", controlModel, controlView, ".sc-SegmentsView");
    });