define(["sitecore", "/-/speak/v1/ExperienceEditor/ExperienceEditor.js"], function (Sitecore, ExperienceEditor) {
  Sitecore.Factories.createBaseComponent({
    name: "PageEditBar",
    base: "ControlBase",
    selector: ".sc-pageeditbar",
    attributes: [
        { name: "itemId", defaultValue: "" },
        { name: "database", defaultValue: "" },
        { name: "deviceId", defaultValue: "" },
        { name: "isHome", defaultValue: "" },
        { name: "isLocked", defaultValue: "false" },
        { name: "isLockedByCurrentUser", defaultValue: "false" }
    ],
    initialize: function () {
      this._super();
      this.model.set("itemId", this.$el.data("sc-itemid"));
      this.model.set("deviceId", this.$el.data("sc-deviceid"));
      this.model.set("isHome", this.$el.data("sc-ishome"));
      this.model.set("database", this.$el.data("sc-database"));
      this.model.set("language", this.$el.data("sc-language"));
      this.model.set("version", this.$el.data("sc-version"));
      this.model.set("isFallback", this.$el.data("sc-isfallback"));
      this.model.set("isLocked", this.$el.data("sc-islocked"));
      this.model.set("isLockedByCurrentUser", this.$el.data("sc-islockedbycurrentuser"));
      this.model.set("canLock", this.$el.data("sc-canlock"));
      this.model.set("canUnlock", this.$el.data("sc-canunlock"));
      this.model.set("url", this.$el.data("sc-url"));
      this.model.set("siteName", this.$el.data("sc-sitename"));
      this.model.set("isReadOnly", this.$el.data("sc-isreadonly"));
      this.model.set("trackingEnabled", this.$el.data("sc-trackingenabled"));
      this.model.set("requireLockBeforeEdit", this.$el.data("sc-requirelockbeforeedit"));
      this.model.set("virtualFolder", this.$el.data("sc-virtualfolder"));
      this.model.set("isInFinalWorkflow", this.$el.data("sc-isinfinalworkflow"));
      this.model.set("canEdit", this.$el.data("sc-canedit"));
      this.model.set("canReadLanguage", this.$el.data("sc-canreadlanguage"));
      this.model.set("canWriteLanguage", this.$el.data("sc-canwritelanguage"));
      this.model.set("isEditAllVersionsAllowed", this.$el.data("sc-iseditallversionsallowed"));
      this.model.set("isEditAllVersionsTicked", this.$el.data("sc-iseditallversionsticked"));
      this.model.set("canSelectVersion", this.$el.data("sc-canselectversion"));
      this.model.set("latestVersionResponse", this.$el.data("sc-latestversionresponse"));
      this.model.set("itemNotifications", this.$el.data("sc-itemnotifications"));
      this.generateTabs();

      ExperienceEditor.Common.addOneTimeEvent(function (that) {
        return ExperienceEditor.getContext().isFrameLoaded;
      }, function (that) {
        that.set({ isVisible: true });
       ExperienceEditor.getContext().isRibbonRendered = true;
       var loadingIndicator = ExperienceEditor.getPageEditingWindow().document.getElementById("ribbonPreLoadingIndicator");
        if (loadingIndicator) {
          loadingIndicator.style.display = "none";
        }
      }, 50, this);
    },
    generateTabs: function () {
      var strips = jQuery(".sc-ribbon-strips");
      var stripLabels = strips.find("h3");
      var tabs = "";
      stripLabels.each(function () {
        tabs += "<li><a>" + jQuery(this).text() + "</a></li>";
      });
      var quickbarList = jQuery(".sc-quickbar-button-list");
      quickbarList.append(tabs);
    }
  });
});