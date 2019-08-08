(function() {
    var dependencies = (typeof window !== "undefined")
        ? ["/-/speak/v1/listmanager/commonPagesDefinition.js"]
        : ["./commonPagesDefinition"];
    define(dependencies,
        function(commonPagesDefinition) {
            var self;
            return {
                _deleteList: [
                    "1FCB1E17C92741E89BD049A4FC109826", "043A34CE15BF4FB7BAF6005E8BAC2803",
                    "225FAAB86B4C4DD38186642AFA32026C", "979EE2381BF04161835DDE2192D70E77"
                ],
                _exportList: [
                    "C98460C183544D2AAC2B78C67E06E184", "C09D2914E7814B5C88A312FEF18B462F",
                    "59083A283E3545FBA2FA8D8E310B2C73", "75E580D3C4D744D998A4DFD8A4DE1A31"
                ],
                _convertList: [
                    "E6547DF0124A4C0194A82DE47456433C", "6BFD8CF5C94A44A28C8594F0A7746D0A",
                    "6690ED2A688244EB89AEBE30D9A48C74", "B254CE3315CB43258D05ED467B9616AB"
                ],

                init: function(contactListType, segmentedListType) {
                    self = this;
                    this._segmentedListType = segmentedListType;
                    this._contactListType = contactListType;
                },

                addBaseStructure: function(baseStructure) {
                    // for unit-testing purposes
                    var current = commonPagesDefinition.defaultIfValueIsUndefinedOrNull(self, this);
                    baseStructure.control.on("change:selectedItem",
                        function() { current.setAvailableActions(baseStructure); },
                        this);
                    this.setAvailableActions(baseStructure);
                },

                setAvailableActions: function(baseStructure) {
                    var availableActions;
                    var selectedItem = baseStructure.control.get("selectedItem");

                    if (typeof selectedItem === "undefined" || selectedItem === null || selectedItem === "") {
                        availableActions = [];
                    } else {
                        var itemType = selectedItem.get("Type").toString().toLowerCase();
                        availableActions = [].concat(this._deleteList, this._exportList, this._moveList);
                        if (itemType === this._segmentedListType.toLowerCase()) {
                            availableActions.push.apply(availableActions, this._convertList);
                        }
                    }

                    Array.prototype.forEach.call(baseStructure.actionControl.viewModel.actions(),
                        function(el) {
                            if (availableActions.indexOf(el.id()) < 0) {
                                el.disable();
                            } else {
                                el.enable();
                            }
                        });
                }
            };
        });
})();