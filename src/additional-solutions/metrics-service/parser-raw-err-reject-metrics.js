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
                    "timestamp": 1603720800000,
                    "value": "4.0"
                }, {
                    "timestamp": 1603634400000,
                    "value": "0.0"
                }]
            }],
            "name": "429,highPriority"
        }, {
            "metrics": [{
                "name": "sum(message_count)",
                "values": [{
                    "timestamp": 1603720800000,
                    "value": "3.0"
                }, {
                    "timestamp": 1603634400000,
                    "value": "0.0"
                }]
            }],
            "name": "429,unauthenticated"
        }, {
            "metrics": [{
                "name": "sum(message_count)",
                "values": [{
                    "timestamp": 1603720800000,
                    "value": "0.0"
                }, {
                    "timestamp": 1603634400000,
                    "value": "1.0"
                }]
            }],
            "name": "500,unattended"
        }, {
            "metrics": [{
                "name": "sum(message_count)",
                "values": [{
                    "timestamp": 1603720800000,
                    "value": "0.0"
                }, {
                    "timestamp": 1603634400000,
                    "value": "1.0"
                }]
            }],
            "name": "504,highPriority"
        }],
        "name": "dev"
    }],
    "metaData": {
        "errors": [],
        "notices": ["query served by:82562c27-3537-453b-a365-73885b9c6a32", "Source:Big Query", "Table used: uap-aus-se1.edge.edge_api_smbaxgroup003_fact"]
    }
}
    * 
    * 
    * Sample returned metric:
    *  (2 arrays, one for errors, one for rejections)
    * [{
    "date_au": "2020-10-27",
    "value": 0
}, {
    "date_au": "2020-10-26",
    "value": 2
}],
[{
    "date_au": "2020-10-27",
    "value": {
        "authenticated": 4,
        "unauthenticated": 3
    }
}, {
    "date_au": "2020-10-26",
    "value": {
        "authenticated": 0,
        "unauthenticated": 0
    }
}]
    * 
    */

const format = require('date-fns-tz/format');
const utcToZonedTime = require('date-fns-tz/utcToZonedTime');
const metricsServiceUtils = require('./metrics-service-utils');
const metricsRequestConfig = require('./metrics-requests-config');
const defaultOptions = metricsRequestConfig.defaultOptions;

exports.parse = function (rawErrRejectMentrics, fromDate, toDate) {
    var rejectionCountPerTS = {};
    var errCountPerTS = {};
    var metricEntry;
    let dimensionsArray;
    try { dimensionsArray = rawErrRejectMentrics.environments[0].dimensions }
    catch (err) {
        // If no data returned, set dimensionsArray array to an empty array
        dimensionsArray = [];
    }
    if ((dimensionsArray === null) || (typeof dimensionsArray === 'undefined')) {
        dimensionsArray = [];
    }
    // Iterate over dimensions array. 
    // Each dimension is a unique http_status_code,performancetier combination.
    // Aggregate the count of 5xx errors together, regardless of performance tier.
    // For 429 aggregate them by unauthenticated and authenticated (the rest)

    for (i = 0; i < dimensionsArray.length; i++) {
        currDimension = dimensionsArray[i].name;
        const dimSplitArray = currDimension.split(',');
        const curStatusCode = dimSplitArray[0];
        const curPerfTier = dimSplitArray[1];
        const curRejectionAggr = (curPerfTier == 'unauthenticated') ? 'unauthenticated' : 'authenticated'
        if (curStatusCode == "429") {    
            for (j = 0; j < dimensionsArray[i].metrics[0].values.length; j++) {
                const currElem = dimensionsArray[i].metrics[0].values[j];
                const currTimestamp = currElem.timestamp.toString();
                const currValue = Number(currElem.value);
                if (!(rejectionCountPerTS.hasOwnProperty(currTimestamp))) {
                    // Create an entry for this timestamp, with default 0 counts in every dimension . Deep copy the default value so we can modify    
                    rejectionCountPerTS[currTimestamp] = JSON.parse(JSON.stringify(metricsRequestConfig.defaultMetricsValues.daily.rejections));
                }
                rejectionCountPerTS[currTimestamp][curRejectionAggr] += currValue;
            }
        }
        else if (curStatusCode.startsWith('5')) {
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
        errorMetric.push(metricEntry);
    }

    // Now iterate over all the timestamp values in rejectionCountPerTS
    var rejectionMetric = [];
    for (var curTS in rejectionCountPerTS) {
        currTimestampInDefaultTZ = utcToZonedTime(new Date(parseInt(curTS)), defaultOptions.timeZone);
        curDateAU = format(currTimestampInDefaultTZ, 'yyyy-MM-dd', { timeZone: defaultOptions.timeZone });
        metricEntry = {};
        metricEntry.date_au = curDateAU;
        metricEntry.value = rejectionCountPerTS[curTS];;
        rejectionMetric.push(metricEntry);
    }

    rejectionMetric = metricsServiceUtils.fillDateGapsInMetricsArray(rejectionMetric, metricsRequestConfig.defaultMetricsValues.daily.rejections, fromDate, toDate);
    errorMetric = metricsServiceUtils.fillDateGapsInMetricsArray(errorMetric, metricsRequestConfig.defaultMetricsValues.daily.errors, fromDate, toDate);
    defaultOptions.debug && console.log("--- errorMetric = " + JSON.stringify(errorMetric));
    defaultOptions.debug && console.log("--- rejectionMetric = " + JSON.stringify(rejectionMetric));
    return [errorMetric, rejectionMetric];

}