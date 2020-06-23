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
 * get-metrics-service.js
 * Get Metrics service Route.
 */

// Returns the collected metrics in the format required by CDS standards.
const format = require('date-fns-tz/format');
const utcToZonedTime = require('date-fns-tz/utcToZonedTime');
const addDays = require('date-fns/addDays');
const addMonths = require('date-fns/addMonths');
const metricsRequestConfig = require('./metrics-requests-config');
const defaultOptions = metricsRequestConfig.defaultOptions;
const defaultMetricsValues = metricsRequestConfig.defaultMetricsValues;
const metricsServiceUtils = require('./metrics-service-utils');
// Instantiate a datastore client
const { Datastore } = require('@google-cloud/datastore');
const datastore = new Datastore();

exports.getMetrics = function (metricsPeriod) {
    return new Promise(function (resolve, reject) {

        var responseBody = {};
        const curDateTimeInDefaultTZ = utcToZonedTime(new Date(), defaultOptions.timeZone);
        responseBody.requestTime = format(curDateTimeInDefaultTZ, "yyyy-MM-dd'T'HH:mm:ssxxxxx", { timeZone: defaultOptions.timeZone });
        defaultOptions.debug && console.log("Getting metrics...");
        getMonthlyMetrics(responseBody, metricsPeriod)
            .then(response1 => getDailyMetrics(response1, metricsPeriod))
            .then(response2 => getCurrentMetrics(response2))
            .then(responseBody => {
                defaultOptions.debug && console.log("Finished processing all metrics - Response = " + JSON.stringify(responseBody));
                resolve(responseBody);
            })
            .catch(err => {
                metricsServiceUtils.addLogEntry("ERROR", "Get Metrics", err);
                reject(err);
            });
    })
}

// Utility function. Retrieve Daily metrics from Datastore and add them to the response body in the format required by CDS
async function getDailyMetrics(currentResponse, metricsPeriod) {
    // Set To/From Dates
    const todayInDefaultTZ = utcToZonedTime(new Date(), defaultOptions.timeZone);
    const todayFormatted = format(todayInDefaultTZ, 'yyyy-MM-dd', { timeZone: defaultOptions.timeZone });
    const fromDate = (metricsPeriod == "CURRENT") ? todayFormatted : format(addDays(todayInDefaultTZ, -7), 'yyyy-MM-dd', { timeZone: defaultOptions.timeZone });
    const toDate = (metricsPeriod != "HISTORIC") ? todayFormatted : format(addDays(todayInDefaultTZ, -1), 'yyyy-MM-dd', { timeZone: defaultOptions.timeZone });
    defaultOptions.debug && console.log("Getting daily metrics - From date = " + fromDate + " - to date = " + toDate);
    var metricsResponse = initialiseAllDailyMetricsResponse(currentResponse, metricsPeriod);
    var dailyMetrics = await retrieveMetricsFromDatastore('daily', fromDate, toDate);
    // Iterate over all daily metrics. If the date matches the current date, rewrite the currentDay element in the response metric
    // If it is from a previous date, append the metric value to the corresponding previousDays array (This is safe to do, as metrics are retrieved from DataStore in descending dates)
    for (const curMetricEntry in dailyMetrics) {
        const curDate = dailyMetrics[curMetricEntry].date_au;
        const curMetricType = dailyMetrics[curMetricEntry].metric_name;
        const curMetricValue = dailyMetrics[curMetricEntry].value;
        if (isNaN(curMetricValue)) {
            // The metric has subtypes. Iterate over all its subtypes and overwrite and/or append the corresponding metric.subtype in the response
            for (const curMetricSubType in curMetricValue) {
                if (curDate == todayFormatted) {
                    metricsResponse[curMetricType][curMetricSubType].currentDay = curMetricValue[curMetricSubType];
                }
                else {
                    metricsResponse[curMetricType][curMetricSubType].previousDays.push(curMetricValue[curMetricSubType]);
                }
            }
        }
        else {
            // Simple metric. Just overwrite current entry or append to previous dates depending on date
            if (curDate == todayFormatted) {
                metricsResponse[curMetricType].currentDay = curMetricValue;
            }
            else {
                metricsResponse[curMetricType].previousDays.push(curMetricValue);
            }
        }

    }
    return metricsResponse;

}

// Utility function. Retrieve Monthly metrics from Datastore and add them to the response body in the format required by CDS
async function getMonthlyMetrics(currentResponse, metricsPeriod) {
    const curMonthInDefaultTZ = utcToZonedTime(new Date(), defaultOptions.timeZone);
    const curMonthFormatted = format(curMonthInDefaultTZ, 'yyyy-MM', { timeZone: defaultOptions.timeZone });
    var fromDate;
    var toDate;
    // Initialise the availability element - Set from and to dates
    var newAvailabilityMetrics = {};
    if (metricsPeriod != "HISTORIC") {
        // Add current month element with default value
        newAvailabilityMetrics.currentMonth = defaultMetricsValues.monthly.availability;
        toDate = curMonthFormatted;
    }
    else {
        toDate = format(addMonths(curMonthInDefaultTZ, -1), 'yyyy-MM', { timeZone: defaultOptions.timeZone });
    }
    if (metricsPeriod != "CURRENT") {
        // Add an empty array to hold the availability values for previous months
        newAvailabilityMetrics.previousMonths = [];
        fromDate = format(addMonths(curMonthInDefaultTZ, -12), 'yyyy-MM', { timeZone: defaultOptions.timeZone });
    }
    else {
        fromDate = curMonthFormatted;
    }
    defaultOptions.debug && console.log("Getting monthly metrics - From date = " + fromDate + " - to date = " + toDate);
    const monthlyMetrics = await retrieveMetricsFromDatastore('monthly', fromDate, toDate);
    var currElem;

    // Iterate over all monthly metrics, they are all of the same type (availability), if the date is equal to the current month,  add its value in the currentMonth element, else
    // add it as an extra element in the previousMonthsArray
    for (i = 0; i < monthlyMetrics.length; i++) {
        currElem = monthlyMetrics[i];
        if (currElem.date_au == curMonthFormatted) {
            newAvailabilityMetrics.currentMonth = currElem.value;
        }
        else {
            newAvailabilityMetrics.previousMonths.push(currElem.value);
        }
    }
    currentResponse.availability = newAvailabilityMetrics;
    return currentResponse;
}

// Utility function. Retrieve current metrics from Datastore and add them to the response body in the format required by CDS
async function getCurrentMetrics(currentResponse) {
    defaultOptions.debug && console.log("Getting current metrics...");
    var currentMetrics = await retrieveMetricsFromDatastore('current', 'current', 'current');
    var currElem;
    // Iterate over all current metrics, add their value directly to the current response
    for (i = 0; i < currentMetrics.length; i++) {
        currElem = currentMetrics[i];
        currentResponse[currElem.metric_name] = currElem.value;
    }
    return currentResponse;
}

// Utility function. Retrieves metrics stored in Datastore for the given period and metric type (daily, monthly or current)
async function retrieveMetricsFromDatastore(metricsType, fromDate, toDate) {
    // Retrieve stored metrics from DataStore
    const metricsQuery = datastore
        .createQuery('cds_metrics','' + metricsType + '_metrics')
        .filter('date_au', '>=', fromDate)
        .filter('date_au', '<=', toDate)
        .order('date_au', { descending: true })
        .order('metric_name');
    var [existingMetrics] = await datastore.runQuery(metricsQuery);
    defaultOptions.debug && console.log("------ " + metricsType + " ---- After running query, existingMetrics = " + JSON.stringify(existingMetrics));
    return existingMetrics;


}

// Utility function. Initialises the element in the response corresponding to a given type of daily metric
function initialiseMetricResponse(metricsType, metricsSubtype, metricsPeriod) {
    var metricResponse = {};
    if (metricsPeriod != "HISTORIC") {
        // Add current day element with default value
        if ((typeof metricsSubtype === 'undefined') || (metricsSubtype === null)) {
            metricResponse.currentDay = defaultMetricsValues.daily[metricsType];
        }
        else {
            metricResponse.currentDay = defaultMetricsValues.daily[metricsType][metricsSubtype];
        }
    }
    if (metricsPeriod != "CURRENT") {
        // Add an empty array to hold the metrics values for previous days
        metricResponse.previousDays = [];
    }
    return metricResponse;
}

// Utility function. Initialises responses for all daily metrics. The metrics name and whether they have subtypes are determined
// by the config element defaultMetricsValues.daily
function initialiseAllDailyMetricsResponse(currentResponse, metricsPeriod) {
    var allDailyMetricsResponse = currentResponse;
    // Iterate over all daily metrics names
    for (const curDailyMetric in defaultMetricsValues.daily) {
        curDailyMetricVal = defaultMetricsValues.daily[curDailyMetric];
        if (isNaN(curDailyMetricVal)) {
            // This metric has subtypes, iterate over all its subtypes, and initialise a response for each one
            // defaultOptions.debug && console.log("Metric " + curDailyMetric + " has subtypes...");
            allDailyMetricsResponse[curDailyMetric] = {};
            for (const curDailyMetricSubtype in curDailyMetricVal) {
                allDailyMetricsResponse[curDailyMetric][curDailyMetricSubtype] = initialiseMetricResponse(curDailyMetric, curDailyMetricSubtype, metricsPeriod);
            }
        }
        else {
            // This is a simple metric. Initialise the response
            allDailyMetricsResponse[curDailyMetric] = initialiseMetricResponse(curDailyMetric, null, metricsPeriod);
        }
    }
    return allDailyMetricsResponse;
}