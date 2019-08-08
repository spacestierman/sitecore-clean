﻿define([], function() {
    return {
        ReportDataConfig: {
            byMessage: {
                keyFieldNames: ['managerRootId', 'messageId', 'messageName', 'event', 'language', 'isProductive', 'isBrowsed'],
                    dateGrouping: 'by-month',
                }
            },
                keyFieldNames: ['managerRootId', 'messageId', 'url', 'event'],
            },
                keyFieldNames: ['managerRootId', 'messageId', 'event', 'country', 'region', 'city'],
            },
                keyFieldNames: ['managerRootId', 'messageId', 'event', 'deviceType', 'deviceModel', 'browser', 'os'],
            },
            byHour: {
                keyFieldNames: ['managerRootId', 'messageId', 'event', 'dayOfWeek', 'hour'],
            }
        }
    }
});