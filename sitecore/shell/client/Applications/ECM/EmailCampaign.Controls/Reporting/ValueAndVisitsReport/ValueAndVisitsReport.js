define([
    'sitecore',
    '/-/speak/v1/ecm/ReportingBlockBaseTabs.js',
    '/-/speak/v1/ecm/ReportDataService.js',
    "/-/speak/v1/ecm/MathHelper.js",
    "/-/speak/v1/ecm/constants.js"
], function (sitecore, ReportingBlockBaseTabs, ReportDataService, MathHelper) {
    var model = sitecore.Definitions.Models.ControlModel.extend({});

    var view = ReportingBlockBaseTabs.view.extend({
        childComponents: [
            'Tabs',
            'TabContent0',
            'TabContent1',
            'EngagementChart',
            'ValueAndVisitsChart'
        ]
    });

    sitecore.Factories.createComponent("ValueAndVisitsReport", model, view, ".sc-ValueAndVisitsReport");
    return { view: view, model: model };
});