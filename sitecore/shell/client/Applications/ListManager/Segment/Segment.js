(function() {
    var dependencies = (typeof window !== "undefined")
        ? ["sitecore", "/-/speak/v1/listmanager/SegmentDefinition.js"]
        : ["sitecore", "./SegmentDefinition"];
    define(dependencies,
        function(sitecore, segmentDefinition) {
            return sitecore.Definitions.App.extend(segmentDefinition);
        });
})();