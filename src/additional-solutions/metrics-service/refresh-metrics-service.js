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
 * refresh-metrics-service.js
 * Refresh Metrics service Route.
 */

const format = require('date-fns-tz/format');
const utcToZonedTime = require('date-fns-tz/utcToZonedTime');
const addMinutes = require('date-fns/addMinutes');
const addDays = require('date-fns/addDays');
const metricsRequestConfig = require('./metrics-requests-config');
const mgtmAPI = require('./apigee-api-connector');
const defaultOptions = metricsRequestConfig.defaultOptions;
const metricsServiceUtils = require('./metrics-service-utils');
// Instantiate a datastore client
const { Datastore } = require('@google-cloud/datastore');
const datastore = new Datastore();

const rawPerfMetricsParser = require('./parser-raw-perf-metrics');
const rawInvocationAvgRespParser = require('./parser-raw-invocation-resp-metrics');
const rawSessionCountParser = require('./parser-raw-sessioncount-metrics');
const rawErrRejectParser = require('./parser-raw-err-reject-metrics');
const rawAvgTPSParser = require('./parser-raw-avgtps-metrics');
const rawPeakTPSParser = require('./parser-raw-peaktps-metrics');
const rawCustomerRecipientCountParser = require('./parser-raw-customer-recipientcount-metrics');

// Invokes Apigee APIs (with different configurations) to refresh the daily and current metrics required by CDS
// Metrics are kept in a DataStore entities. Daily entries are kept in an entity called 'daily_metrics', indexed by Day (Format: YYYY-MM-DD), and have a property for each of the metrics
// observed in that particular day
// Current metrics are kept in a separate entity, current_metrices, where the key is named 'current'
// fromDateTime and toDateTime are in YYYY-MM-DD format and are assumed to be in the same timezone used for all Apigee API requests
// If not set, they are assumed to be the current day

exports.refreshDailyAndCurrentMetrics = async function (fromDate, toDate) {

  let toDateHourComponent = '23:59'; // By default the time range is set till midnight on the last Day. Except when querying for the current date
  const curDateTimeInDefaultTZ = utcToZonedTime(new Date(), defaultOptions.timeZone);

  if (fromDate === null) {
    fromDate = format(curDateTimeInDefaultTZ, 'yyyy-MM-dd', { timeZone: defaultOptions.timeZone });
  }
  if (toDate === null) {
    toDate = format(curDateTimeInDefaultTZ, 'yyyy-MM-dd', { timeZone: defaultOptions.timeZone });
    toDateHourComponent = format(curDateTimeInDefaultTZ, 'HH:mm', { timeZone: defaultOptions.timeZone });

  }
  defaultOptions.debug && console.log("Starting refresh Daily and Current Metrics - fromDate: " + fromDate + " - toDate: " + toDate);
  metricsServiceUtils.addLogEntry("SUCCESS", "Overall daily and current metric update", "Starting update for period: " + fromDate + " - " + toDate);

  // Get Apigee Config
  const apigeeConfig = metricsServiceUtils.getApigeeConfig();

  var timeRange = format(utcToZonedTime(new Date(fromDate), defaultOptions.timeZone), 'MM/dd/yyyy', { timeZone: defaultOptions.timeZone }) + ' 00:00~' + format(utcToZonedTime(new Date(toDate), defaultOptions.timeZone), 'MM/dd/yyyy', { timeZone: defaultOptions.timeZone }) + ' ' + toDateHourComponent;

  // Refresh performance metrics 
  var performanceRequestOptions = JSON.parse(JSON.stringify(metricsRequestConfig.performanceRequestOptions));  //Deep copy so we can modify 
  // Add time query params
  performanceRequestOptions.params.timeRange = timeRange;
  defaultOptions.debug && console.log("Will update performance metrics. Set time range to: " + performanceRequestOptions.params.timeRange);
  mgtmAPI.requestApigeeApi(performanceRequestOptions, apigeeConfig)
    .then(rawPerformanceMetrics => rawPerfMetricsParser.parse(rawPerformanceMetrics, fromDate, toDate))
    .then(normalisedPerformanceMetrics => updateMetrics('performance', normalisedPerformanceMetrics, 'daily', fromDate, toDate))
    .catch(err => metricsServiceUtils.addLogEntry("ERROR", "performance metric update", err));

  // Refresh session count metrics 
  var sessionCountRequestOptions = JSON.parse(JSON.stringify(metricsRequestConfig.sessionCountRequestOptions));  //Deep copy so we can modify 
  // Add time query params
  sessionCountRequestOptions.params.timeRange = timeRange;
  defaultOptions.debug && console.log("Will update session count metrics. Set time range to: " + sessionCountRequestOptions.params.timeRange);
  mgtmAPI.requestApigeeApi(sessionCountRequestOptions, apigeeConfig)
    .then(rawSessionCountMetrics => rawSessionCountParser.parse(rawSessionCountMetrics, fromDate, toDate))
    .then(normalisedSessionCountMetrics => updateMetrics('sessionCount', normalisedSessionCountMetrics, 'daily', fromDate, toDate))
    .catch(err => metricsServiceUtils.addLogEntry("ERROR", "sessionCount metric update", err));

  // Refresh error and rejection metrics 
  var errorAndRejectionRequestOptions = JSON.parse(JSON.stringify(metricsRequestConfig.errorAndRejectionRequestOptions));  //Deep copy so we can modify 
  // Add time query params
  errorAndRejectionRequestOptions.params.timeRange = timeRange;
  defaultOptions.debug && console.log("Will update error and rejection metrics. Set time range to: " + errorAndRejectionRequestOptions.params.timeRange);
  mgtmAPI.requestApigeeApi(errorAndRejectionRequestOptions, apigeeConfig)
    .then(rawErrRejectMetrics => rawErrRejectParser.parse(rawErrRejectMetrics, fromDate, toDate))
    .then(normalisedErrRejectMetrics => {
      updateMetrics('errors', normalisedErrRejectMetrics[0], 'daily', fromDate, toDate);
      updateMetrics('rejections', normalisedErrRejectMetrics[1], 'daily', fromDate, toDate);
    })
    .catch(err => metricsServiceUtils.addLogEntry("ERROR", "Error and Rejection metric update", err));

  // Refresh avg TPS metrics 
  var avgTpsRequestOptions = JSON.parse(JSON.stringify(metricsRequestConfig.avgTpsRequestOptions));  //Deep copy so we can modify 
  // Add time query params
  avgTpsRequestOptions.params.timeRange = timeRange;
  defaultOptions.debug && console.log("Will update average TPS metrics. Set time range to: " + avgTpsRequestOptions.params.timeRange);
  mgtmAPI.requestApigeeApi(avgTpsRequestOptions, apigeeConfig)
    .then(rawAvgTpsMetrics => rawAvgTPSParser.parse(rawAvgTpsMetrics, fromDate, toDate))
    .then(normalisedAvgTpsMetrics => updateMetrics('averageTps', normalisedAvgTpsMetrics, 'daily', fromDate, toDate))
    .catch(err => metricsServiceUtils.addLogEntry("ERROR", "avgTPS metric update", err));

  // Refresh peak TPS metrics 
  var peakTpsRequestOptions = JSON.parse(JSON.stringify(metricsRequestConfig.peakTpsRequestOptions));  //Deep copy so we can modify 
  // Add time query params
  peakTpsRequestOptions.params.timeRange = timeRange;
  defaultOptions.debug && console.log("Will update peak TPS metrics. Set time range to: " + peakTpsRequestOptions.params.timeRange);
  mgtmAPI.requestApigeeApi(peakTpsRequestOptions, apigeeConfig)
    .then(rawPeakTpsMetrics => rawPeakTPSParser.parse(rawPeakTpsMetrics, fromDate, toDate))
    .then(normalisedPeakTpsMetrics => updateMetrics('peakTps', normalisedPeakTpsMetrics, 'daily', fromDate, toDate))
    .catch(err => metricsServiceUtils.addLogEntry("ERROR", "peakTPS metric update", err));

  // Refresh invocation & average response metrics 
  var invocationAndAvgResponseRequestOptions = JSON.parse(JSON.stringify(metricsRequestConfig.invocationAndAvgResponseRequestOptions));  //Deep copy so we can modify 
  // Add time query params
  invocationAndAvgResponseRequestOptions.params.timeRange = timeRange;
  defaultOptions.debug && console.log("Will update invocation and average response metrics. Set time range to: " + invocationAndAvgResponseRequestOptions.params.timeRange);
  mgtmAPI.requestApigeeApi(invocationAndAvgResponseRequestOptions, apigeeConfig)
    .then(rawInvocationAvgRespMetrics => rawInvocationAvgRespParser.parse(rawInvocationAvgRespMetrics, fromDate, toDate))
    .then(normalisedInvocationAvgRespMetrics => {
      updateMetrics('invocations', normalisedInvocationAvgRespMetrics[0], 'daily', fromDate, toDate);
      updateMetrics('averageResponse', normalisedInvocationAvgRespMetrics[1], 'daily', fromDate, toDate);
    })
    .catch(err => metricsServiceUtils.addLogEntry("ERROR", "invocation average response metric update", err));

  // Refresh current metrics (customerCount, recipientCount)
  customerAndRecipientRequestOptions = JSON.parse(JSON.stringify(metricsRequestConfig.customerAndRecipientRequestOptions));  //Deep copy so we can modify 
  // Add time query params - Set time range to the last x minutes, where x is the duration of an access token (any tokens issued before that
  // are no longer active)
  const newToDate = format(curDateTimeInDefaultTZ, 'MM/dd/yyyy HH:mm', { timeZone: defaultOptions.timeZone });
  const newFromDate = format(addMinutes(curDateTimeInDefaultTZ, -1 * defaultOptions.tokenDurationInMinutes), 'MM/dd/yyyy HH:mm', { timeZone: defaultOptions.timeZone });
  customerAndRecipientRequestOptions.params.timeRange = newFromDate + '~' + newToDate;
  defaultOptions.debug && console.log("Will update customerCount and recipientCount metrics. Set time range to: " + customerAndRecipientRequestOptions.params.timeRange);
  mgtmAPI.requestApigeeApi(customerAndRecipientRequestOptions, apigeeConfig)
    .then(rawCustomerAndRecipientCountMetrics => rawCustomerRecipientCountParser.parse(rawCustomerAndRecipientCountMetrics))
    .then(normalisedCustomerAndRecipientCountMetrics => {
      updateMetrics('customerCount', normalisedCustomerAndRecipientCountMetrics[0], 'current', 'current', 'current');
      updateMetrics('recipientCount', normalisedCustomerAndRecipientCountMetrics[1], 'current', 'current', 'current');
    })
    .catch(err => metricsServiceUtils.addLogEntry("ERROR", "customer and recipient count metric update", err));

}


// Once a day has finished, this function can be invoked to obtain the final snapshot of the daily metrics for that date
// It should be scheduled to run a little after midnight (on the Timezone)

exports.consolidatePreviousDayMetrics = async function () {

  const curDateTimeInDefaultTZ = utcToZonedTime(new Date(), defaultOptions.timeZone);
  const previousDay = format(addDays(curDateTimeInDefaultTZ, -1), 'yyyy-MM-dd', { timeZone: defaultOptions.timeZone });
  defaultOptions.debug && console.log("Starting consolidatePreviousDayMetrics - previousDay = " + previousDay);
  exports.refreshDailyAndCurrentMetrics(previousDay, null);
}

/* Utility function. Updates the stored metrics, based on an array of metrics of a specific type (computedMetrics). This array consists of elements
* having a date, a metric name, and a value(s).
* This functions updates any existing stored metrics of this type that match a date in computedMetrics and makes sure that there is an entry
* for each of the days found in computedMetrics. The metrics array is sorted in descending order 
*  based on the date appearing in the first property of every element. The computedMetrics array is sorted similarly
*/


async function updateMetrics(metricName, computedMetrics, metricsType, fromDate, toDate) {
  return new Promise(async function (resolve, reject) {

    // Retrieve stored metrics from DataStore
    const query = datastore
      .createQuery('cds_metrics', metricsType + '_metrics')
      .filter('date_au', '>=', fromDate)
      .filter('date_au', '<=', toDate)
      .filter('metric_name', '=', metricName)
      .order('date_au', { descending: true });

    try {
      var [existingMetrics] = await datastore.runQuery(query);
    }
    catch (err) {
      reject(err);
    }

    defaultOptions.debug && console.log("------ " + metricName + " ---- After running query, existingMetrics length = " + existingMetrics.length);
    var addedMetricsArray = [];
    var existingMetricsArrIdx = 0;
    var initialArrLength = existingMetrics.length;
    var curExistingMetric, curComputedMetric, curDateInComputedMetrics, dateFound, newEntry;

    for (i = 0; i < computedMetrics.length; i++) {
      // Iterate over computedMetrics. For each element's date, see if it's found in the overallMetricsArray
      // If not found, create a new element with default entries and update the required metric.
      // If found, just update the required metric
      curComputedMetric = computedMetrics[i];
      curDateInComputedMetrics = curComputedMetric.date_au;
      // defaultOptions.debug && console.log("Start of updateMetrics loop - curDateInComputedMetrics = " + curDateInComputedMetrics);
      stopSearchForDate = false;
      dateFound = false;
      while ((existingMetricsArrIdx < initialArrLength) && (stopSearchForDate == false)) {
        curExistingMetric = existingMetrics[existingMetricsArrIdx];
        // defaultOptions.debug && console.log("Looking in existing metrics. Cur date in existing metrics = " + curExistingMetric.date_au);
        stopSearchForDate = (curExistingMetric.date_au.toString() <= curDateInComputedMetrics);
        dateFound = (curExistingMetric.date_au.toString() == curDateInComputedMetrics);
        if (dateFound) {
          // Found date in overallMetrics. Update the column in the existing metric
          existingMetrics[existingMetricsArrIdx].value = curComputedMetric.value;
        }
        if (!stopSearchForDate) {
          existingMetricsArrIdx++;
        }
      }
      if (!dateFound) {
        // The date was not found in overallMetrics. Create a new entry with default values and update the column with 
        // existing computed metric
        newEntry = {};
        newEntry.key = datastore.key({
          namespace: 'cds_metrics',
          path: [metricsType + '_metrics', curDateInComputedMetrics + '-' + metricName]
        });
        newEntry.data = {};
        newEntry.data.date_au = curDateInComputedMetrics;
        newEntry.data.metric_name = metricName;
        newEntry.data.value = curComputedMetric.value;
        addedMetricsArray.push(newEntry);
      }
    }

    // Prepare the updated entries in the format expected by Datastore for an udpate and append it to the addedMetrics
    for (i = 0; i < existingMetrics.length; i++) {
      newEntry = {};
      newEntry.key = existingMetrics[i][datastore.KEY];
      newEntry.data = existingMetrics[i];
      addedMetricsArray.push(newEntry);
    }

    defaultOptions.debug && console.log("Updating in datastore");
    defaultOptions.debug && console.log("Upsert array length = " + addedMetricsArray.length);
    try {
      await datastore.upsert(addedMetricsArray);
    }
    catch (err) {
      reject(err);
    }

    metricsServiceUtils.addLogEntry("SUCCESS", metricName + " metric update", "Metric " + metricName + " updated");
    resolve();
  }
  )
}
