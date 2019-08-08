(function() {
    var dependencies = (typeof window !== "undefined")
        ? ["sitecore", "/-/speak/v1/listmanager/SegmentPage/segmentsPagesDefinition.js"]
        : ["sitecore", "./segmentsPagesDefinition"];
    define(dependencies,
        function(sitecore, segmentsPageDefinition) {
            return sitecore.Definitions.App.extend(segmentsPageDefinition);
        });
})();