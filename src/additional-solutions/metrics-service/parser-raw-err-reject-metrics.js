/*
 Copyright 2020 Google Inc.

 Licensed under the Apache License, Version 2.0 (the "License");
 you may not use this file except in compliance with the License.
 You may obtain a copy of the License at

 https://www.apache.org/licenses/LICENSE-2.0

 Unless required by applicable law or agreed to in writing, software
 distributed under the License is distributed on an "AS IS" BASIS,
 WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 See the License for the specific language governing permissions and
 limitations under the License.
 */

/**
 * @file
 * parser-raw-err-reject-metrics.js
 * Helper function to parse the raw error and rejection metrics returned by Apigee API..
 */
/*  Utility function. Parses the raw error and rejection metrics returned by Apigee API.
    Fills any missing gaps with a default value
    * Sample response:
    * {
    "environments": [{
        "dimensions": [{
            "metrics": [{
                "name": "sum(message_count)",
                "values": [{
                    "timestamp": 1581948000000,
                    "value": "8.0"
                }, {
                    "timestamp": 1581861600000,
                    "value": "0.0"
                }, {
                    "timestamp": 1581429600000,
                    "value": "6.0"
                }, {
                    "timestamp": 1581256800000,
                    "value": "0.0"
                }]
            }],
            "name": "302"
        }, {
            "metrics": [{
                "name": "sum(message_count)",
                "values": [{
                    "timestamp": 1581948000000,
                    "value": "8.0"
                }, {
                    "timestamp": 1581861600000,
                    "value": "2201.0"
                }, {
                    "timestamp": 1581429600000,
                    "value": "14.0"
                }, {
                    "timestamp": 1581256800000,
                    "value": "1.0"
                }]
            }],
            "name": "200"
        }, {
            "metrics": [{
                "name": "sum(message_count)",
                "values": [{
                    "timestamp": 1581948000000,
                    "value": "2.0"
                }, {
                    "timestamp": 1581861600000,
                    "value": "0.0"
                }, {
                    "timestamp": 1581429600000,
                    "value": "0.0"
                }, {
                    "timestamp": 1581256800000,
                    "value": "0.0"
                }]
            }],
            "name": "400"
        }, {
            "metrics": [{
                "name": "sum(message_count)",
                "values": [{
                    "timestamp": 1581948000000,
                    "value": "0.0"
                }, {
                    "timestamp": 1581861600000,
                    "value": "0.0"
                }, {
                    "timestamp": 1581429600000,
                    "value": "13.0"
                }, {
                    "timestamp": 1581256800000,
                    "value": "0.0"
                }]
            }],
            "name": "401"
        }],
        "name": "dev"
    }],
    "metaData": {
        "errors": [],
        "notices": ["Source:Postgres", "query served by:11ea5e9f-c78e-4a1f-ae1d-7c6ef1159c75", "PG Host:uap-aus-se1:australia-southeast1:rgsy1uappg01s", "Table used: edge.api.smbaxgroup003.agg_target"]
    }
}
    * 
    * 
    * Sample returned metric:
    * 
    * [{
    "date_au": "2020-02-18",
    "value": 0.8888888888888888
}, {
    "date_au": "2020-02-17",
    "value": 1
}, {
    "date_au": "2020-02-16",
    "value": 1
}, {
    "date_au": "2020-02-15",
    "value": 1
}, {
    "date_au": "2020-02-14",
    "value": 1
}, {
    "date_au": "2020-02-13",
    "value": 1
}, {
    "date_au": "2020-02-12",
    "value": 1
}, {
    "date_au": "2020-02-11",
    "value": 1
}, {
    "date_au": "2020-02-10",
    "value": 1
}]
    * 
    */

const format = require('date-fns-tz/format');
const utcToZonedTime = require('date-fns-tz/utcToZonedTime');
const metricsServiceUtils = require('./metrics-service-utils');
const metricsRequestConfig = require('./metrics-requests-config');
const defaultOptions = metricsRequestConfig.defaultOptions;

exports.parse = function (rawErrRejectMentrics, fromDate, toDate) {
    var rejectionMetric = [];
    var errCountPerTS = {};
    var metricEntry;
    var dimensionsArray = rawErrRejectMentrics.environments[0].dimensions;
    if ((dimensionsArray === null) || (typeof dimensionsArray === 'undefined')) {
        dimensionsArray = [];
    }
    // Iterate over dimensions array. Only take into account dimensions where name is 429 or 5xx. 
    // Aggregate the count of 5xx errors together. 
    for (i = 0; i < dimensionsArray.length; i++) {
        currDimension = dimensionsArray[i].name;
        if (currDimension == "429") {
            for (j = 0; j < dimensionsArray[i].metrics[0].values.length; j++) {
                currElem = dimensionsArray[i].metrics[0].values[j];
                currTimestamp = currElem.timestamp.toString();
                currTimestampInDefaultTZ = utcToZonedTime(new Date(parseInt(currTimestamp)), defaultOptions.timeZone);
                curDateAU = format(currTimestampInDefaultTZ, 'yyyy-MM-dd', { timeZone: defaultOptions.timeZone });
                currValue = Number(currElem.value);
                metricEntry = {};
                metricEntry.date_au = curDateAU;
                metricEntry.value = parseInt(currElem.value);
                rejectionMetric.push(metricEntry);
            }
        }
        else if (currDimension.startsWith('5')) {
            for (j = 0; j < dimensionsArray[i].metrics[0].values.length; j++) {
                currElem = dimensionsArray[i].metrics[0].values[j];
                currTimestamp = currElem.timestamp.toString();
                currValue = parseInt(currElem.value);
                if (errCountPerTS.hasOwnProperty(currTimestamp)) {
                    errCountPerTS[currTimestamp] += currValue;
                }
                else {
                    errCountPerTS[currTimestamp] = currValue;
                }
            }
        }
    }
    var errorMetric = [];
    // Now iterate over all the timestamp values in errCountPerTS
    for (var curTS in errCountPerTS) {
        currTimestampInDefaultTZ = utcToZonedTime(new Date(parseInt(curTS)), defaultOptions.timeZone);
        curDateAU = format(currTimestampInDefaultTZ, 'yyyy-MM-dd', { timeZone: defaultOptions.timeZone });
        metricEntry = {};
        metricEntry.date_au = curDateAU;
        metricEntry.value = errCountPerTS[curTS];;
        defaultOptions.debug && console.log("-- Curr err Metric Entry = " + JSON.stringify(metricEntry));
        errorMetric.push(metricEntry);
    }
    rejectionMetric = metricsServiceUtils.fillDateGapsInMetricsArray(rejectionMetric, metricsRequestConfig.defaultMetricsValues.daily.rejections, fromDate, toDate);
    errorMetric = metricsServiceUtils.fillDateGapsInMetricsArray(errorMetric, metricsRequestConfig.defaultMetricsValues.daily.errors, fromDate, toDate);
    defaultOptions.debug && console.log("--- errorMetric = " + JSON.stringify(errorMetric));
    defaultOptions.debug && console.log("--- rejectionMetric = " + JSON.stringify(rejectionMetric));
    return [errorMetric, rejectionMetric];

}