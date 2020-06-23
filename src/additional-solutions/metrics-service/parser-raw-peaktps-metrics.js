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
 * parser-raw-peaktps-metrics.js
 * Helper function to parse the raw peak tps metrics returned by Apigee API..
 * This metric is approximated by returning the avgTPS on a minute by minute period
 */
/*  Utility function. Parses the raw peak tps metrics returned by Apigee API.
    Fills any missing gaps with a default value
    * Sample response:
    * {
    "environments": [{
        "metrics": [{
            "name": "tps",
            "values": [{
                    "timestamp": 1581985740000,
                    "value": "0.26666666666666666"
                },
                {
                    "timestamp": 1581985680000,
                    "value": "0.03333333333333333"
                },
                {
                    "timestamp": 1581909480000,
                    "value": "5.85"
                },
                {
                    "timestamp": 1581909420000,
                    "value": "8.766666666666667"
                },
                {
                    "timestamp": 1581909360000,
                    "value": "0.05"
                },
                {
                    "timestamp": 1581909300000,
                    "value": "0.05"
                },
                {
                    "timestamp": 1581909240000,
                    "value": "0.05"
                },
                {
                    "timestamp": 1581909180000,
                    "value": "0.05"
                },
                {
                    "timestamp": 1581909120000,
                    "value": "0.06666666666666667"
                },
                {
                    "timestamp": 1581909060000,
                    "value": "0.05"
                },
                {
                    "timestamp": 1581909000000,
                    "value": "0.05"
                },
                {
                    "timestamp": 1581908940000,
                    "value": "0.03333333333333333"
                },
                {
                    "timestamp": 1581908880000,
                    "value": "0.05"
                },
                {
                    "timestamp": 1581908820000,
                    "value": "0.05"
                },
                {
                    "timestamp": 1581908760000,
                    "value": "0.05"
                },
                {
                    "timestamp": 1581908700000,
                    "value": "0.1"
                },
                {
                    "timestamp": 1581908640000,
                    "value": "7.683333333333334"
                },
                {
                    "timestamp": 1581908580000,
                    "value": "10.383333333333333"
                },
                {
                    "timestamp": 1581907440000,
                    "value": "3.3333333333333335"
                },
                {
                    "timestamp": 1581907320000,
                    "value": "0.016666666666666666"
                },
                {
                    "timestamp": 1581483240000,
                    "value": "0.03333333333333333"
                },
                {
                    "timestamp": 1581483120000,
                    "value": "0.26666666666666666"
                },
                {
                    "timestamp": 1581481620000,
                    "value": "0.016666666666666666"
                },
                {
                    "timestamp": 1581462300000,
                    "value": "0.016666666666666666"
                },
                {
                    "timestamp": 1581460560000,
                    "value": "0.016666666666666666"
                },
                {
                    "timestamp": 1581460500000,
                    "value": "0.016666666666666666"
                },
                {
                    "timestamp": 1581460440000,
                    "value": "0.016666666666666666"
                },
                {
                    "timestamp": 1581460380000,
                    "value": "0.016666666666666666"
                },
                {
                    "timestamp": 1581460260000,
                    "value": "0.03333333333333333"
                },
                {
                    "timestamp": 1581460200000,
                    "value": "0.016666666666666666"
                },
                {
                    "timestamp": 1581460020000,
                    "value": "0.016666666666666666"
                },
                {
                    "timestamp": 1581459960000,
                    "value": "0.016666666666666666"
                },
                {
                    "timestamp": 1581459720000,
                    "value": "0.016666666666666666"
                },
                {
                    "timestamp": 1581459660000,
                    "value": "0.016666666666666666"
                },
                {
                    "timestamp": 1581459600000,
                    "value": "0.03333333333333333"
                },
                {
                    "timestamp": 1581308820000,
                    "value": "0.016666666666666666"
                }
            ]
        }],
        "name": "dev"
    }],
    "metaData": {
        "errors": [],
        "notices": [
            "Source:Postgres",
            "Table used: edge.api.smbaxgroup003.agg_api",
            "PG Host:uap-aus-se1:australia-southeast1:rgsy1uappg01s",
            "query served by:e13925bd-05c4-4133-a6fa-046b6b372ad9"
        ]
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
    try { valuesArray = rawSessionCountMetrics.environments[0].metrics[0].values; }
    catch (err) {
        // If no data returned, set values array to an empty array
        valuesArray = [];
    }
    if ((valuesArray === null) || (typeof valuesArray === 'undefined')) {
        // defaultOptions.debug && console.log("Resetting valuesArray array...");
        valuesArray = [];

    }
    var peakTPS = {};
    // Iterate over values array. Keep track of maxTPS seen for each date
    for (i = 0; i < valuesArray.length; i++) {
        const currElem = valuesArray[i];
        const currTimestamp = currElem.timestamp.toString();
        const currTimestampInDefaultTZ = utcToZonedTime(new Date(parseInt(currTimestamp)), defaultOptions.timeZone);
        const curTSDate = format(currTimestampInDefaultTZ, 'yyyy-MM-dd', { timeZone: defaultOptions.timeZone });
        const curTPS = parseFloat(currElem.value);
        if ((peakTPS[curTSDate] !== null) && (peakTPS[curTSDate] !== undefined)) {
            // If there's already an entry for the current date, update if the current TPS is higher than recorded. 
            if (curTPS > peakTPS[curTSDate]) {
                peakTPS[curTSDate] = curTPS;
            }
        }
        else {
            peakTPS[curTSDate] = curTPS;
        }
    }
    var computedPeakTpsMetric = [];
    var newEntry;
    // Now convert this into the standard normalised metric format and sort
    for (curDate in peakTPS) {
        newEntry = {};
        newEntry.date_au = curDate;
        newEntry.value = peakTPS[curDate];
        computedPeakTpsMetric.push(newEntry);

    }
    computedPeakTpsMetric.sort(metricsServiceUtils.compareByDateDesc);
    computedPeakTpsMetric = metricsServiceUtils.fillDateGapsInMetricsArray(computedPeakTpsMetric, metricsRequestConfig.defaultMetricsValues.daily.sessionCount, fromDate, toDate);
    defaultOptions.debug && console.log("--- peakTPSComputedMetric = " + JSON.stringify(computedPeakTpsMetric));
    return computedPeakTpsMetric;

}