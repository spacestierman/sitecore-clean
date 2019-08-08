(function (speak) {
    speak.component(["bclCollection", "bclDragAndDrop"],
        function (Collection, dragAndDrop) {

            var getKeyValuePairArray = function () {
                return _.reduce(this.Items,
                    function (memo, item) {
                        var displayName = this.getDisplayName(item);
                        var value = this.ValueModeSelection ? this.getValue(item) : displayName;
                        if (value) {
                            memo.push({
                                itemId: item.id,
                                text: displayName,
                                value: value,
                                selected: item.IsSelected === "1"
                            });
                        }
                        return memo;
                    },
                    [],
                    this);
            };

            var getItemsFromKeyValuePairArray = function () {
                var keyValuePairArray = _.map(this.KeyValuePairArray,
                    function (pair) {
                        var item = {};
                        item.id = pair.itemId,
                        item[this.DisplayFieldName] = pair.text;
                        item[this.ValueFieldName] = pair.value;
                        item.IsSelected = pair.selected ? "1" : "";
                        return item;
                    },
                    this);

                return keyValuePairArray;
            };

            return speak.extend({},
                Collection.prototype,
                {
                    updateKeyValueArray: function () {
                        if (!this.Items.length) {
                            this.Items.push({});
                        }

                        this.off("change:KeyValuePairArray", this.updateItems);
                        this.KeyValuePairArray = getKeyValuePairArray.call(this);
                        this.updateSelectionFromItems();
                        this.on("change:KeyValuePairArray", this.updateItems, this);
                    },

                    updateSelectionFromItems: function () {
                        var selection = [];
                        for (var i = 0; i < this.Items.length; i++) {
                            var item = this.Items[i];
                            if (item.IsSelected === "1") {
                                selection.push(item[this.ItemValueFieldName]);
                            }
                        }
                        this.off("change:Selection", this.updatedSelection, this);
                        this.Selection = selection;
                        this.on("change:Selection", this.updatedSelection, this);
                    },

                    updateValueModeSelectionFromItems: function () {
                        var hasCustomValue = this.find(function (item) {
                            return item[this.DisplayFieldName] !== item[this.ValueFieldName];
                        }.bind(this));

                        if (hasCustomValue) {
                            this.ValueModeSelection = 1;
                            this.ItemValueFieldName = this.ValueFieldName;
                        } else {
                            this.ValueModeSelection = 0;
                            this.ItemValueFieldName = this.DisplayFieldName;
                        }
                    },

                    updateItems: function () {
                        var items = getItemsFromKeyValuePairArray.call(this);

                        if (!items.length) {
                            items.push({});
                        }

                        this.off("itemsChanged", this.updateKeyValueArray, this);
                        this.reset(items);

                        this.updateValueModeSelectionFromItems();
                        this.updateSelectionFromItems();

                        this.on("itemsChanged", this.updateKeyValueArray, this);

                    },

                    textChanged: function (index, text, field) {
                        this.Items[index][this[field]] = text;
                        this.updateKeyValueArray();
                    },

                    removeItem: function (item) {
                        this.remove(item);
                    },

                    addItemAt: function (index) {
                        this.Items.splice(index, 0, {});
                        this.reset(this.Items);
                    },

                    changeValueModeSelection: function () {
                        this.ItemValueFieldName = this.ValueModeSelection ? this.ValueFieldName : this.DisplayFieldName;
                        this.updateKeyValueArray();
                    },

                    updatedSelection: function () {
                        if ($(this.el).find('.sc-selection-options-droplist option').length - !this.MultipleSelection !== this.Items.length || this.Items.length !== this.KeyValuePairArray.length) {
                            return;
                        }

                        for (var i = 0; i < this.Items.length; i++) {
                            if (this.Selection.indexOf(this.Items[i][this.ItemValueFieldName]) !== -1) {
                                this.Items[i].IsSelected = "1";
                                this.KeyValuePairArray[i].selected = true;
                            } else {
                                this.Items[i].IsSelected = "";
                                this.KeyValuePairArray[i].selected = false;
                            }
                        }
                    },

                    onDrop: function (event) {
                        var $el = $(event.el);
                        var currentIndex = event.el.getAttribute("data-sc-index");
                        var newIndex = $el.index();
                        setTimeout(function () {
                            $el.remove();
                            var element = this.Items[currentIndex];
                            this.Items.splice(currentIndex, 1);
                            this.Items.splice(newIndex, 0, element);
                            this.reset(this.Items);
                        }.bind(this), 0);

                        return event.el;
                    },

                    initialized: function () {
                        Collection.prototype.initialized.call(this);

                        var listIterator = this.el.querySelector(".sc-listIterator");
                        dragAndDrop.droppable(listIterator, {
                            onDrop: this.onDrop.bind(this)
                        });

                        this.defineComputedProperty("ValueModeOptions", function () {
                            return [
                            {
                                id: 0,
                                name: this.LabelForValueModeOptionSameAsLabels
                            },
                            {
                                id: 1,
                                name: this.LabelForValueModeOptionCustom
                            }
                            ];
                        });

                        this.defineProperty("ValueModeSelection", 0);
                        this.defineProperty("Selection", []);
                        this.defineProperty("ItemValueFieldName", this.DisplayFieldName);

                        this.on("itemsChanged", this.updateKeyValueArray, this);
                        this.on("change:ValueModeSelection", this.changeValueModeSelection, this);
                        this.on("change:KeyValuePairArray", this.updateItems, this);

                        this.updateKeyValueArray();

                        this.on("change:Selection", this.updatedSelection, this);
                    }
                });
        }, "KeyValuePairEditor");
})(Sitecore.Speak);

