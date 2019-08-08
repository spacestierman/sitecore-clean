(function () {
    var dependencies = (typeof window !== "undefined")
        ? ["/-/speak/v1/listmanager/commonPagesDefinition.js"]
        : ["./commonPagesDefinition"];
    define(dependencies,
        function (commonPagesDefinition) {
            var self;
            return {
                _deleteSegment: [
                    "DF275EB6359E4BEAB62DD295A53A29B5"
                ],

                init: function () {
                    self = this;
                },

                addBaseStructure: function (baseStructure) {
                    // for unit-testing purposes
                    var current = commonPagesDefinition.defaultIfValueIsUndefinedOrNull(self, this);
                    baseStructure.control.on("change:selectedItem",
                        function () { current.setAvailableActions(baseStructure); },
                        this);
                    this.setAvailableActions(baseStructure);
                },

                setAvailableActions: function (baseStructure) {
                    var availableActions;
                    var selectedItem = baseStructure.control.get("selectedItem");

                    if (typeof selectedItem === "undefined" || selectedItem === null || selectedItem === "") {
                        availableActions = [];
                    } else {
                        availableActions = [].concat(this._deleteSegment);
                    }

                    Array.prototype.forEach.call(baseStructure.actionControl.viewModel.actions(),
                        function (el) {
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