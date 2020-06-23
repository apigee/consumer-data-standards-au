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
 * parser-raw-invocation-resp-metrics.js
 * Helper function to parse the raw invocation and average response metrics returned by Apigee API..
 */
/*  Utility function. Parses the raw invocation and average response metrics returned by Apigee API.
    Fills any missing gaps with a default value
    * Sample response:
    * {
    "environments": [{
        "dimensions": [{
            "metrics": [{
                "name": "sum(message_count)",
                "values": [{
                    "timestamp": 1581948000000,
                    "value": "9.0"
                }, {
                    "timestamp": 1581861600000,
                    "value": "0.0"
                }, {
                    "timestamp": 1581429600000,
                    "value": "23.0"
                }]
            }, {
                "name": "avg(total_response_time)",
                "values": [{
                    "timestamp": 1581948000000,
                    "value": "1291.8889"
                }, {
                    "timestamp": 1581861600000,
                    "value": "0.0"
                }, {
                    "timestamp": 1581429600000,
                    "value": "65.478264"
                }]
            }, {
                "name": "global-avg-total_response_time",
                "values": ["410.40625"]
            }],
            "name": "unattended"
        }, {
            "metrics": [{
                "name": "sum(message_count)",
                "values": [{
                    "timestamp": 1581948000000,
                    "value": "0.0"
                }, {
                    "timestamp": 1581861600000,
                    "value": "2201.0"
                }, {
                    "timestamp": 1581429600000,
                    "value": "1.0"
                }]
            }, {
                "name": "avg(total_response_time)",
                "values": [{
                    "timestamp": 1581948000000,
                    "value": "0.0"
                }, {
                    "timestamp": 1581861600000,
                    "value": "5.452522"
                }, {
                    "timestamp": 1581429600000,
                    "value": "19.0"
                }]
            }, {
                "name": "global-avg-total_response_time",
                "values": ["5.458673932788374"]
            }],
            "name": "unauthenticated"
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
                    "value": "2.0"
                }]
            }, {
                "name": "avg(total_response_time)",
                "values": [{
                    "timestamp": 1581948000000,
                    "value": "0.0"
                }, {
                    "timestamp": 1581861600000,
                    "value": "0.0"
                }, {
                    "timestamp": 1581429600000,
                    "value": "32.0"
                }]
            }, {
                "name": "global-avg-total_response_time",
                "values": ["32.0"]
            }],
            "name": "highPriority"
        }],
        "name": "dev"
    }],
    "metaData": {
        "errors": [],
        "notices": ["Source:Big Query", "Metric with Avg of total_response_time was requested. For this a global avg was also computed with name global-avg-total_response_time", "Table used: uap-aus-se1.edge.edge_api_smbaxgroup003_fact", "query served by:f08d1bc9-d9d8-499b-821d-814d395dffa3"]
    }
}
    * 
    * 
    * Sample returned metric:
    *  (2 arrays, one for invocations, one for averageResponse)
    * [
    [{
        "date_au": "2020-02-18",
        "value": {
            "largePayload": 0,
            "highPriority": 0,
            "lowPriority": 0,
            "unattended": 9,
            "unauthenticated": 0
        }
    }, {
        "date_au": "2020-02-17",
        "value": {
            "largePayload": 0,
            "highPriority": 0,
            "lowPriority": 0,
            "unattended": 0,
            "unauthenticated": 2201
        }
    }, {
        "date_au": "2020-02-16",
        "value": {
            "largePayload": 0,
            "highPriority": 0,
            "lowPriority": 0,
            "unattended": 0,
            "unauthenticated": 0
        }
    }, {
        "date_au": "2020-02-15",
        "value": {
            "largePayload": 0,
            "highPriority": 0,
            "lowPriority": 0,
            "unattended": 0,
            "unauthenticated": 0
        }
    }, {
        "date_au": "2020-02-14",
        "value": {
            "largePayload": 0,
            "highPriority": 0,
            "lowPriority": 0,
            "unattended": 0,
            "unauthenticated": 0
        }
    }, {
        "date_au": "2020-02-13",
        "value": {
            "largePayload": 0,
            "highPriority": 0,
            "lowPriority": 0,
            "unattended": 0,
            "unauthenticated": 0
        }
    }, {
        "date_au": "2020-02-12",
        "value": {
            "largePayload": 0,
            "highPriority": 2,
            "lowPriority": 0,
            "unattended": 23,
            "unauthenticated": 1
        }
    }, {
        "date_au": "2020-02-11",
        "value": {
            "largePayload": 0,
            "highPriority": 0,
            "lowPriority": 0,
            "unattended": 0,
            "unauthenticated": 0
        }
    }, {
        "date_au": "2020-02-10",
        "value": {
            "largePayload": 0,
            "highPriority": 0,
            "lowPriority": 0,
            "unattended": 0,
            "unauthenticated": 0
        }
    }],
    [{
        "date_au": "2020-02-18",
        "value": {
            "largePayload": 0,
            "highPriority": 0,
            "lowPriority": 0,
            "unattended": 1291.8889,
            "unauthenticated": 0
        }
    }, {
        "date_au": "2020-02-17",
        "value": {
            "largePayload": 0,
            "highPriority": 0,
            "lowPriority": 0,
            "unattended": 0,
            "unauthenticated": 5.452522
        }
    }, {
        "date_au": "2020-02-16",
        "value": {
            "largePayload": 0,
            "highPriority": 0,
            "lowPriority": 0,
            "unattended": 0,
            "unauthenticated": 0
        }
    }, {
        "date_au": "2020-02-15",
        "value": {
            "largePayload": 0,
            "highPriority": 0,
            "lowPriority": 0,
            "unattended": 0,
            "unauthenticated": 0
        }
    }, {
        "date_au": "2020-02-14",
        "value": {
            "largePayload": 0,
            "highPriority": 0,
            "lowPriority": 0,
            "unattended": 0,
            "unauthenticated": 0
        }
    }, {
        "date_au": "2020-02-13",
        "value": {
            "largePayload": 0,
            "highPriority": 0,
            "lowPriority": 0,
            "unattended": 0,
            "unauthenticated": 0
        }
    }, {
        "date_au": "2020-02-12",
        "value": {
            "largePayload": 0,
            "highPriority": 32,
            "lowPriority": 0,
            "unattended": 65.478264,
            "unauthenticated": 19
        }
    }, {
        "date_au": "2020-02-11",
        "value": {
            "largePayload": 0,
            "highPriority": 0,
            "lowPriority": 0,
            "unattended": 0,
            "unauthenticated": 0
        }
    }, {
        "date_au": "2020-02-10",
        "value": {
            "largePayload": 0,
            "highPriority": 0,
            "lowPriority": 0,
            "unattended": 0,
            "unauthenticated": 0
        }
    }]
]
    * 
    */

const format = require('date-fns-tz/format');
const utcToZonedTime = require('date-fns-tz/utcToZonedTime');
const metricsServiceUtils = require('./metrics-service-utils');
const metricsRequestConfig = require('./metrics-requests-config');
const defaultOptions = metricsRequestConfig.defaultOptions;

exports.parse = function (rawInvocationAvgRespMetrics, fromDate, toDate) {
    let computedAvgRespMetrics = {};
    computedAvgRespMetrics.invocations = {};
    computedAvgRespMetrics.averageResponse = {};

    let dimensionsArray;
    try { dimensionsArray = rawInvocationAvgRespMetrics.environments[0].dimensions }
    catch (err) {
        // If no data returned, set dimensionsArray array to an empty array
        dimensionsArray = [];
    }
    if ((dimensionsArray === null) || (typeof dimensionsArray === 'undefined')) {
        dimensionsArray = [];
    }
    // Iterate over dimensions array. For each dimension value and metric, make sure there is a (default metric entry) for the
    // corresponding date and metric, and update the metric for the dimension (performanceTier) 
    for (i = 0; i < dimensionsArray.length; i++) {
        let currDimension = dimensionsArray[i].name;
        for (j = 0; j < dimensionsArray[i].metrics.length; j++) {
            let curMetric = dimensionsArray[i].metrics[j];
            let curMetricName = curMetric.name;
            if (curMetricName != "global-avg-total_response_time") {
                // We're only interested in invocations or averageResponse
                curRealMetricName = (curMetricName == 'sum(message_count)') ? 'invocations' : 'averageResponse';
                for (k = 0; k < curMetric.values.length; k++) {
                    let currElem = curMetric.values[k];
                    // defaultOptions.debug && console.log("---  Iterating over values. CurrElem = " + JSON.stringify(currElem));
                    let currTimestamp = currElem.timestamp.toString();
                    let currValue = Number(currElem.value);
                    if ((computedAvgRespMetrics[curRealMetricName][currTimestamp] === null) || (typeof computedAvgRespMetrics[curRealMetricName][currTimestamp] === 'undefined')) {
                        // Create a new attribute in the computedMetrics for the timestamp, if it doesn't yet exist. Fill it with default values (Deep copy, so they can be modified)
                        computedAvgRespMetrics[curRealMetricName][currTimestamp] = JSON.parse(JSON.stringify(metricsRequestConfig.defaultMetricsValues.daily[curRealMetricName]));
                    }
                    computedAvgRespMetrics[curRealMetricName][currTimestamp][currDimension] = currValue;
                }
            }
        }
    }
    // We now need to convert both computedMetrics.invocations and computedMetrics.averageResponse into arrays of the expected value, with any gaps filled
    var computedInvRespMetricsArray = [];
    ['invocations', 'averageResponse'].forEach(curMetricName => {
        var curMetricObject = computedAvgRespMetrics[curMetricName];
        computedInvRespMetricsArray[curMetricName] = [];
        for (curTS in curMetricObject) {
            currTimestampInDefaultTZ = utcToZonedTime(new Date(parseInt(curTS)), defaultOptions.timeZone);
            curDateAU = format(currTimestampInDefaultTZ, 'yyyy-MM-dd', { timeZone: defaultOptions.timeZone });
            metricEntry = {};
            metricEntry.date_au = curDateAU;
            metricEntry.value = curMetricObject[curTS];
            computedInvRespMetricsArray[curMetricName].push(metricEntry);
        }
        // Now fill in the gaps
        computedInvRespMetricsArray[curMetricName] = metricsServiceUtils.fillDateGapsInMetricsArray(computedInvRespMetricsArray[curMetricName], metricsRequestConfig.defaultMetricsValues.daily[curMetricName], fromDate, toDate);
    });
    defaultOptions.debug && console.log("--- invocationMetrics array = " + JSON.stringify(computedInvRespMetricsArray.invocations));
    defaultOptions.debug && console.log("--- avgRespMetrics array = " + JSON.stringify(computedInvRespMetricsArray.averageResponse));
    return [computedInvRespMetricsArray.invocations, computedInvRespMetricsArray.averageResponse];

}