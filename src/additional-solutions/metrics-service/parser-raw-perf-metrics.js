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
 * parser-raw-perf-metrics.js
 * Helper function to parse the raw performance metrics returned by Apigee API..
 */
/*  Utility function. Parses the raw performance metrics returned by Apigee API.
    Fills any missing gaps with a default value
    * Sample response:
    * {
     "environments": [
       {
         "dimensions": [
           {
             "metrics": [
               {
                 "name": "sum(message_count)",
                 "values": [
                   {
                     "timestamp": 1581861600000,
                     "value": "2201.0"
                   },
                   {
                     "timestamp": 1581429600000,
                     "value": "26.0"
                   }
                 ]
               }
             ],
             "name": "true"
           }
         ],
         "name": "dev"
       }
     ],
     "metaData": {
       "errors": [],
       "notices": [
         "query served by:437b1024-560c-42af-909c-316ceffe553f",
         "Source:Big Query",
         "Table used: uap-aus-se1.edge.edge_api_smbaxgroup003_fact"
       ]
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

exports.parse = function (rawPerformanceMetrics, fromDate, toDate) {

  let totalCountPerTS = {};
  let meetsPerfCountPerTS = {};
  let dimensionsArray = rawPerformanceMetrics.environments[0].dimensions;
  if ((dimensionsArray === null) || (typeof dimensionsArray === 'undefined')) {
    // defaultOptions.debug && console.log("Resetting dimensions array...");
    dimensionsArray = [];
  }
  // Iterate over dimensions array. For each dimension value, aggregate the
  // count per timestamp. Also keep track of the count per timestamp where dimension = true (ie: meets the Performace SLO)
  for (i = 0; i < dimensionsArray.length; i++) {
    currDimension = dimensionsArray[i].name;
    for (j = 0; j < dimensionsArray[i].metrics[0].values.length; j++) {
      const currElem = dimensionsArray[i].metrics[0].values[j];
      const currTimestamp = currElem.timestamp.toString();
      const currValue = Number(currElem.value);
      if (totalCountPerTS.hasOwnProperty(currTimestamp)) {
        totalCountPerTS[currTimestamp] += currValue;
      }
      else {
        totalCountPerTS[currTimestamp] = currValue;
      }
      if (currDimension == "true") {
        meetsPerfCountPerTS[currTimestamp] = currValue;
      }
    }
  }
  var computedPerfMetric = [];
  // Now iterate over all the timestamp values
  for (const curTS in totalCountPerTS) {
    // defaultOptions.debug && console.log("-- Processing timestamp = " + curTS);
    const curTotalCount = totalCountPerTS[curTS];
    const curMetsPerfCount = meetsPerfCountPerTS[curTS];
    const curComputedMetric = (curTotalCount === 0) ? 1.0 : curMetsPerfCount / curTotalCount;
    const currTimestampInDefaultTZ = utcToZonedTime(new Date(parseInt(curTS)), defaultOptions.timeZone);
    const curDateAU = format(currTimestampInDefaultTZ, 'yyyy-MM-dd', { timeZone: defaultOptions.timeZone });
    // defaultOptions.debug && console.log("-- Curr Computed Metric = " + curComputedMetric + " - Curr Computed Date = " + curDateAU);
    let metricEntry = {};
    metricEntry.date_au = curDateAU;
    metricEntry.value = curComputedMetric;
    computedPerfMetric.push(metricEntry);
  }
  computedPerfMetric = metricsServiceUtils.fillDateGapsInMetricsArray(computedPerfMetric, metricsRequestConfig.defaultMetricsValues.daily.performance, fromDate, toDate);
  defaultOptions.debug && console.log("--- performanceMetrics = " + JSON.stringify(computedPerfMetric));
  return computedPerfMetric;

}