(function (speak) {
    var parentApp = window.parent.Sitecore.Speak.app.findApplication('EditActionSubAppRenderer');
    var outcomeTemplateId = "{EE43C2F0-6277-4144-B144-8CA2CEFCCF12}";

    speak.pageCode([], function () {
        return {
            initialized: function () {
                this.on({
                    "loaded": this.loadDone
                }, this);

                this.initializeCurrencyDropDown();

                this.ItemTreeView.on("change:SelectedItem", this.changedSelectedItemId, this);
                this.CurrencyDropList.on("change:SelectedValue", this.changedSelectedItemId, this);

                if (parentApp) {
                    parentApp.loadDone(this, this.HeaderTitle.Text, this.HeaderSubtitle.Text);
                }
            },

            initializeCurrencyDropDown: function() {
                var currencies,
                    currentCulture = _sc.globalize.currentCulture || "en";

                $.each(__speak_config_culture, function(i, ele) {
                    var currencyObject = (((ele.main || {})[currentCulture] || {}).numbers || {}).currencies;
                    currencyObject && (currencies = currencyObject);
                    return !currencies;
                });

                var currencyData = _.map(currencies,function(currency, currencyCode) {
                    return { currencyCode: currencyCode, text: currencyCode + " " + currency.displayName };
                });

                currencyData.unshift({ currencyCode: "", text: "" });
                this.CurrencyDropList.DynamicData = currencyData;
            },

            changedSelectedItemId: function () {
                var isSelectable = this.ItemTreeView.SelectedItem.$templateId === outcomeTemplateId && this.CurrencyDropList.SelectedValue;
                parentApp.setSelectability(this, isSelectable, this.ItemTreeView.SelectedItemId);
            },

            loadDone: function (parameters) {
                this.Parameters = parameters || {};
                this.ItemTreeView.SelectedItemId = this.Parameters.referenceId;
                this.CurrencyDropList.SelectedValue = this.Parameters.currencyCode;
            },

            getData: function () {
                this.Parameters.referenceId = this.ItemTreeView.SelectedItemId;
                this.Parameters.currencyCode = this.CurrencyDropList.SelectedValue;
                return this.Parameters;
            }
        };
    });
})(Sitecore.Speak);