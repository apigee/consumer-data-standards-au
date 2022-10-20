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
 * parser-raw-avgtps-metrics.js
 * Helper function to parse the raw average tps metrics returned by Apigee API..
 */
/*  Utility function. Parses the raw average tps metrics returned by Apigee API.
    Fills any missing gaps with a default value
    * Sample response:
    * {
    "environments": [{
        "metrics": [{
            "name": "tps",
            "values": [{
                "timestamp": 1581948000000,
                "value": "2.0833333333333332E-4"
            }, {
                "timestamp": 1581861600000,
                "value": "0.02547453703703704"
            }, {
                "timestamp": 1581429600000,
                "value": "3.8194444444444446E-4"
            }, {
                "timestamp": 1581256800000,
                "value": "1.1574074074074073E-5"
            }]
        }],
        "name": "dev"
    }],
    "metaData": {
        "errors": [],
        "notices": ["Source:Postgres", "Table used: edge.api.smbaxgroup003.agg_api", "PG Host:uap-aus-se1:australia-southeast1:rgsy1uappg01s", "query served by:f08d1bc9-d9d8-499b-821d-814d395dffa3"]
    }
}
}
    * 
    * 
    * Sample returned metric:
    * 
    * [{
    "date_au": "2020-02-18",
    "value": 0.00020833333333333332
}, {
    "date_au": "2020-02-17",
    "value": 0.02547453703703704
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
    "value": 0.00038194444444444446
}, {
    "date_au": "2020-02-11",
    "value": 0
}, {
    "date_au": "2020-02-10",
    "value": 0.000011574074074074073
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
    
    try { 
        valuesArray = rawSessionCountMetrics.environments[0].metrics[0].values;
    }
    catch (err) {
        // If no data returned, set values array to an empty array
        valuesArray = [];
    }
    if ((valuesArray === null) || (typeof valuesArray === 'undefined')) {
        valuesArray = [];

    }
    //    defaultOptions.debug && console.log("valuesArray array length = " + valuesArray.length);
    var computedAvgTpsMetric = [];
    // Iterate over values array. 
    for (i = 0; i < valuesArray.length; i++) {
        let currElem = valuesArray[i];
        let currTimestamp = currElem.timestamp.toString();
        let currTimestampInDefaultTZ = utcToZonedTime(new Date(parseInt(currTimestamp)), defaultOptions.timeZone);
        metricEntry = {};
        metricEntry.date_au = format(currTimestampInDefaultTZ, 'yyyy-MM-dd', { timeZone: defaultOptions.timeZone });;
        metricEntry.value = parseFloat(currElem.value); // Convert value to float (Sometimes metrics return scientific notation)
        computedAvgTpsMetric.push(metricEntry);

    }
    computedAvgTpsMetric = metricsServiceUtils.fillDateGapsInMetricsArray(computedAvgTpsMetric, metricsRequestConfig.defaultMetricsValues.daily.sessionCount, fromDate, toDate);
    defaultOptions.debug && console.log("--- avgTPSComputedMetric = " + JSON.stringify(computedAvgTpsMetric));
    return computedAvgTpsMetric;

}