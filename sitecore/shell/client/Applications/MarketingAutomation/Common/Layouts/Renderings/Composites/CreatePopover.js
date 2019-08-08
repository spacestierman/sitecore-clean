(function (Speak) {
    Speak.component([], function () {
        return {
            initialized: function () {
                this.CPPopover.$el.addClass('sc-createpopover-overlay');
                this.CPSwitcherListControl.on('change:SelectedItem', this.switchView, this);

                /* it's a workaround for issue #141031. 
                 * When it is fixed, we will remove this line of code.
                 */ 
                this.CPGenericDataSource.on('change:ServiceUrl', this.CPGenericDataSource.loadData);
            },

            tileClick: function () {
                if (this.CPListControl.ClickedItem.$url) {
                    window.location.href = this.CPListControl.ClickedItem.$url;
                }
            },

            switchView: function (item) {
                this.CPDropDownButton.viewModel.toggle();
                this.CPDropDownButton.Icon = item.$icon;
                this.CPListControl.ViewMode = item.Text;
            },

            searchData: function () {
                this.CPGenericDataSource.loadData({
                    parameters: {
                        'search': this.CPSearch.Value || ''
                    }
                });
            }
        };
    }, 'CreatePopover');
})(Sitecore.Speak);