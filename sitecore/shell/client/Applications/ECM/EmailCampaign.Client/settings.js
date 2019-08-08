define([], function() {
    return {
        ReportDataConfig: {
            byMessage: {
                keyFieldNames: ['managerRootId', 'messageId', 'messageName', 'event', 'language', 'isProductive', 'isBrowsed'],                serverDimensionId: '7558FC89-C25F-4606-BBC5-43B91A382AC9',                requestParams: {
                    dateGrouping: 'by-month',                    pademptydates: true
                }
            },            byUrl: {
                keyFieldNames: ['managerRootId', 'messageId', 'url', 'event'],                serverDimensionId: 'C1745F34-F2B9-4AC3-A6DE-FAEE8CE62AE1'
            },            byLocation: {
                keyFieldNames: ['managerRootId', 'messageId', 'event', 'country', 'region', 'city'],                serverDimensionId: '1F031117-B5A9-41EA-B0CB-6D8A759E8968'
            },            byDevice: {
                keyFieldNames: ['managerRootId', 'messageId', 'event', 'deviceType', 'deviceModel', 'browser', 'os'],                serverDimensionId: '0FC2E978-1623-4723-A747-DF4A56EA8518'
            },
            byHour: {
                keyFieldNames: ['managerRootId', 'messageId', 'event', 'dayOfWeek', 'hour'],                serverDimensionId: '399D686D-16B6-46E3-89E9-44FB9535C2B2'
            }
        }
    }
});