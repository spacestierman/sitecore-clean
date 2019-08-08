(function (speak) {
    speak.component(["bclCollection"],
        function (Collection) {
            return speak.extend({},
                Collection.prototype,
                {
                    updateSelectionFromItems: function (option, object) {
                        if (!object || !option) {
                            return;
                        }

                        option.title = object.value;

                        var objectInItems = _.findWhere(this.Items, { itemId: object.itemId });
                        if (objectInItems && objectInItems.selected) {
                            this.Selection.push(object.itemId);
                            this.off("change:Selection", this.updatedSelection, this);
                            this.Selection = this.Selection.slice(0);
                            this.on("change:Selection", this.updatedSelection, this);
                        }
                    },

                    isTrustedEvent: function (e) {
                        return e.originalEvent || e.isTrusted;
                    },

                    changeFieldName: function (e, property) {
                        if (this.isTrustedEvent(e)) {
                            this[property] = e.target.value;
                        }
                    },

                    updatedSelection: function () {
                        for (var i = 0; i < this.Items.length; i++) {
                            this.Items[i].selected = this.Selection.indexOf(this.Items[i][this.ValueFieldName]) !== -1;
                        }
                    },

                    clickHandler: function (e) {
                        var invocation = this.ButtonTextBoxClick;

                        if (!this.IsEnabled) {
                            e.preventDefault();
                            return;
                        }

                        if (e.keyCode === 13) {
                            this.Value = this.$el.find("input").val();
                        }

                        if (invocation) {
                            var i = invocation.indexOf(":");
                            if (i <= 0) {
                                throw "Invocation is malformed (missing 'handler:')";
                            }

                            speak.module("pipelines").get("Invoke").execute({
                                control: this,
                                app: this.app,
                                handler: invocation.substr(0, i),
                                target: invocation.substr(i + 1)
                            });
                        }

                        this.trigger("click", this.el);
                    },

                    afterRenderField: function (dataScId, property) {
                        this.$el.find('[data-sc-id="' + dataScId + '"]').val(this[property]);
                    },

                    updateOptionFields: function (currentFieldName, optionField, optionDataScId) {
                        if (this[currentFieldName] && !_.findWhere(this.Fields, { value: this[currentFieldName] })) {
                            var fields = this.Fields.slice(0);
                            var currentField = {
                                text: !this.LabelForValueNotInList ? this[currentFieldName] : this[currentFieldName] + " - " + this.LabelForValueNotInList,
                                value: this[currentFieldName]
                            };
                            fields.unshift(currentField);
                            this[optionField] = fields;
                            this.$el.find('[data-sc-id="' + optionDataScId + '"] option').eq(1).css("font-style", "italic");
                        } else {
                            this[optionField] = this.Fields;
                        }
                    },

                    changeFields: function () {
                        this.updateOptionFields("CurrentDisplayFieldName", "DisplayFields", "sc-displayFieldSelect");
                        this.updateOptionFields("CurrentValueFieldName", "ValueFields", "sc-valueFieldSelect");
                    },

                    clearDatasource: function () {
                        this.DataSourceGuid = "";
                    },

                    initialized: function () {
                        Collection.prototype.initialized.call(this);
                        this.$el = $(this.el);

                        this.defineProperty("Fields", []);
                        this.defineProperty("Selection", []);
                        this.defineProperty("ValueFields", []);
                        this.defineProperty("DisplayFields", []);

                        this.on("itemsChanged", this.updatedSelection, this);
                        this.on("change:Selection", this.updatedSelection, this);
                        this.on("change:Fields", this.changeFields, this);
                        this.on("change:CurrentDisplayFieldName", this.afterRenderField.bind(this, "sc-displayFieldSelect", "CurrentDisplayFieldName"));
                        this.on("change:CurrentValueFieldName", this.afterRenderField.bind(this, "sc-valueFieldSelect", "CurrentValueFieldName"));
                    }
                });
        }, "DynamicDatasource");
})(Sitecore.Speak);


