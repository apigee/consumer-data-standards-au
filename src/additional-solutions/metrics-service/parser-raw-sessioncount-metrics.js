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
 * parser-raw-sessioncount-metrics.js
 * Helper function to parse the raw session count metrics returned by Apigee API..
 */
/*  Utility function. Parses the raw session count metrics returned by Apigee API.
    Fills any missing gaps with a default value
    * Sample response:
    * {
    "environments": [{
        "dimensions": [{
            "metrics": [{
                "name": "sum(message_count)",
                "values": [{
                    "timestamp": 1581948000000,
                    "value": "1.0"
                }, {
                    "timestamp": 1581429600000,
                    "value": "1.0"
                }]
            }],
            "name": "oidc"
        }],
        "name": "dev"
    }],
    "metaData": {
        "errors": [],
        "notices": ["Source:Big Query", "Table used: uap-aus-se1.edge.edge_api_smbaxgroup003_fact", "query served by:f08d1bc9-d9d8-499b-821d-814d395dffa3"]
    }
}
    * 
    * 
    * Sample returned metric:
    * 
    * [{
    "date_au": "2020-02-18",
    "value": 1
}, {
    "date_au": "2020-02-17",
    "value": 0
}, {
    "date_au": "2020-02-16",
    "value": 0
}, {
    "date_au": "2020-02-15",
    "value": 0
}, {
    "date_au": "2020-02-14",
    "value": 0
}, {
    "date_au": "2020-02-13",
    "value": 0
}, {
    "date_au": "2020-02-12",
    "value": 1
}, {
    "date_au": "2020-02-11",
    "value": 0
}, {
    "date_au": "2020-02-10",
    "value": 0
}]
    * 
    */

const format = require('date-fns-tz/format');
const utcToZonedTime = require('date-fns-tz/utcToZonedTime');
const metricsServiceUtils = require('./metrics-service-utils');
const metricsRequestConfig = require('./metrics-requests-config');
const defaultOptions = metricsRequestConfig.defaultOptions;

exports.parse = function (rawSessionCountMetrics, fromDate, toDate) {
    var valuesArray;
    try { valuesArray = rawSessionCountMetrics.environments[0].dimensions[0].metrics[0].values; }
    catch (err) {
        // If no data returned, set values array to an empty array
        valuesArray = [];
    }
    if ((valuesArray === null) || (typeof valuesArray === 'undefined')) {
        valuesArray = [];
    }
    var computedSessionCountMetric = [];
    // Iterate over values array. 
    for (let i = 0; i < valuesArray.length; i++) {
        const currElem = valuesArray[i];
        // defaultOptions.debug && console.log("--Iterating over values. CurrElem = " + JSON.stringify(currElem));
        const currTimestamp = currElem.timestamp.toString();
        const currTimestampInDefaultTZ = utcToZonedTime(new Date(parseInt(currTimestamp)), defaultOptions.timeZone);
        let metricEntry = {};
        metricEntry.date_au = format(currTimestampInDefaultTZ, 'yyyy-MM-dd', { timeZone: defaultOptions.timeZone });;
        metricEntry.value = parseInt(currElem.value); // Convert value to integer
        computedSessionCountMetric.push(metricEntry);
    }
    computedSessionCountMetric = metricsServiceUtils.fillDateGapsInMetricsArray(computedSessionCountMetric, metricsRequestConfig.defaultMetricsValues.daily.sessionCount, fromDate, toDate);
    defaultOptions.debug && console.log("sessionCountMetric = " + JSON.stringify(computedSessionCountMetric));
    return computedSessionCountMetric;
}