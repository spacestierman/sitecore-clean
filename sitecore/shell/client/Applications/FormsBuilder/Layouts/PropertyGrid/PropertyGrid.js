(function (speak) {

    speak.pageCode([], function () {
        var self,
            defaultIconUrl,
            defaultIconColor,
            propertyGridFormUrl = "/sitecore/client/Applications/FormsBuilder/Components/Layouts/PropertyGridForm",
            generalTabGuid = "{3DBF3675-80E8-4189-AB6D-0DDAC4697D21}",
            performanceTabGuid = "{92274085-6B97-4B19-AE3A-CE6CE2BA8F99}";

        var tabIsSelectable = function (item) {
            return item && item["IsHidden"] !== "1" && item["IsDisabled"] !== "1";
        };

        return {
            initialized: function () {
                this.defineProperty("FormId", "");
                this.defineProperty("ContextItem", null);
                this.defineProperty("SettingsId", "");
                this.defineProperty("ReloadPropertiesPanelApps", []);

                this.on({
                    "change:FormId": this.fillPerformanceTab,
                    "change:ContextItem": this.initProperties,
                    "properties:ApplyChanges": this.applyChanges,
                    "properties:ApplyChangesCompleted": this.applyChangesCompleted,
                    "properties:Cancel": this.cancelChanges
                }, this);

                this.PropertyGridTabControl.isSelectable = tabIsSelectable;
                this.PropertyGridTabControl.on({
                    "loaded:FieldPerformance": this.fillPerformanceTab,
                    "change:SelectedValue": this.tabsSwitched
                }, this);
                this.tabsSwitched();
                this.parent.ContextToggle.on("change:IsOpen", this.updatePerformanceAppIsActive, this);

                self = this;
                defaultIconUrl = this.parent.ContextForPropertyGrid.HeaderIcon;
                defaultIconColor = this.parent.ContextForPropertyGrid.HeaderIconColor;
            },

            initProperties: function () {
                this.PropertiesPanel.off("loaded");

                var hasContextItem = speak.utils.is.a.object(this.ContextItem) && speak.utils.is.a.object(this.ContextItem.model);

                this.parent.PropertyGridApplyChangesButton.IsEnabled = hasContextItem;

                this.fillPerformanceTab();

                if (!hasContextItem) {
                    if (this.PropertiesPanelapp) {
                        this.PropertiesPanelapp.ContextItem = null;
                    }
                    return;
                }

                // TODO: get image from toolbox item or decide where to get it from
                this.parent.ContextForPropertyGrid.HeaderIcon = this.ContextItem.renderingSettings.fieldTypeIcon || defaultIconUrl;
                this.parent.ContextForPropertyGrid.HeaderIconColor = (this.ContextItem.renderingSettings.fieldTypeBackgroundColor || defaultIconColor).toLowerCase();
                this.parent.ContextForPropertyGrid.HeaderTitle = this.ContextItem.renderingSettings.fieldTypeDisplayName;

                var propertyDesignerId = speak.utils.is.a.guid(this.ContextItem.renderingSettings.propertyDesigner) ? this.ContextItem.renderingSettings.propertyDesigner : this.DefaultPropertyDesignerId.Value;

                var settingHasChanged = propertyDesignerId !== this.SettingsId || this.ReloadPropertiesPanelApps.indexOf(propertyDesignerId) !== -1;

                if (this.PropertiesPanelapp) {
                    this.PropertiesPanelapp.AllowedValidations = this.ContextItem.renderingSettings.allowedValidations || [];
                    this.PropertiesPanelapp.ContextItem = settingHasChanged ? null : this.ContextItem;
                }

                if (settingHasChanged) {
                    this.PropertiesPanel.Height = 100;
                    this.ProgressIndicatorPanel.IsBusy = true;
                    this.SettingsId = propertyDesignerId;

                    var options = {
                        settingsid: this.SettingsId
                    };
                    var sourceUrl = speak.Helpers.url.addQueryParameters(propertyGridFormUrl, options);
                    $(this.PropertiesPanel.el).get(0).contentWindow.location.replace(sourceUrl);

                } else {
                    this.resizePropertiesPanel();
                }
            },

            loadDone: function (subApp, alwaysReload) {
                if (!this.ContextItem) {
                    return;
                }

                if (alwaysReload && this.SettingsId && this.ReloadPropertiesPanelApps.indexOf(this.SettingsId) === -1) {
                    this.ReloadPropertiesPanelApps.push(this.SettingsId);
                }

                this.PropertiesPanelapp = subApp;
                this.PropertiesPanelapp.trigger("loaded");
                this.PropertiesPanelapp.AllowedValidations = this.ContextItem.renderingSettings.allowedValidations || [];
                this.PropertiesPanelapp.ContextItem = this.ContextItem;

                this.ProgressIndicatorPanel.IsBusy = false;

                this.resizePropertiesPanel();
                this.initializeResizingListeners();
            },

            initializeResizingListeners: function () {
                var observer = new MutationObserver(function () {
                    this.resizePropertiesPanel();
                }.bind(this));

                observer.observe(this.PropertiesPanelapp.el, { attributes: true, childList: true, subtree: true });
            },

            resizePropertiesPanel: function () {
                if (this.PropertiesPanelapp) {
                    this.PropertiesPanel.Height = this.PropertiesPanelapp.PropertiesForm.el.scrollHeight + 15;
                }
            },

            fillPerformanceTab: function () {
                var hasContextItem = speak.utils.is.a.object(this.ContextItem) && speak.utils.is.a.object(this.ContextItem.model);
                if (hasContextItem) {
                    var hasTrackingField = this.ContextItem.model.hasOwnProperty("isTrackingEnabled"),
                        performanceTab = this.PropertyGridTabControl.getByValue(performanceTabGuid),
                        isTabEnabled = performanceTab.IsDisabled !== "1";

                    var shouldDisableTab = !hasTrackingField &&
                       (this.FieldPerformanceApp ? this.FieldPerformanceApp.FieldPerformance.IsAnalyticsEnabled : true);
                    performanceTab.IsDisabled = shouldDisableTab ? "1" : "";

                    if (this.PropertyGridTabControl.SelectedValue === performanceTabGuid &&
                        isTabEnabled &&
                        !shouldDisableTab) {
                        this.PropertyGridTabControl.select(this.PropertyGridTabControl.getDefaultSelection());
                    }
                }

                if (!this.FieldPerformanceApp)
                    return;

                this.FieldPerformanceApp.FieldPerformance.FormId = this.FormId;
                this.FieldPerformanceApp.FieldPerformance.FieldId = hasContextItem ? this.ContextItem.itemId : "";
                this.updatePerformanceAppIsActive();
            },
            
            updatePerformanceAppIsActive: function () {
                if (this.FieldPerformanceApp) {
                    this.FieldPerformanceApp.FieldPerformance.IsActive = !!this.ContextItem && this.parent.ContextToggle.IsOpen && this.PropertyGridTabControl.SelectedValue === performanceTabGuid;
                }
            },

            tabsSwitched: function () {
                this.parent.ContextForPropertyGrid.IsFooterHidden = this.PropertyGridTabControl.SelectedValue !== generalTabGuid;
                this.resizePropertiesPanel();
                this.updatePerformanceAppIsActive();
            },

            hasChanged: function() {
                    return this.PropertiesPanelapp && this.PropertiesPanelapp.hasChanged();
            },

            applyChanges: function () {
                if (this.PropertiesPanelapp) {
                    this.PropertiesPanelapp.trigger("properties:ApplyChanges");
                }
            },

            applyChangesCompleted: function () {
                speak.trigger("propertyGrid:Apply", this.ContextItem);
            },

            cancelChanges: function () {
                speak.trigger("propertyGrid:Close");
            }
        };
    }, "PropertyGrid");
})(Sitecore.Speak);
