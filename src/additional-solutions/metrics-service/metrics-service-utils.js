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
 * metrics-service-utils.js
 * Various utility functions used throughout the service.
 */

const format = require('date-fns-tz/format');
const utcToZonedTime = require('date-fns-tz/utcToZonedTime');
const metricsRequestConfig = require('./metrics-requests-config');
const defaultOptions = metricsRequestConfig.defaultOptions;
const addDays = require('date-fns/addDays');
// Instantiate a datastore client
const { Datastore } = require('@google-cloud/datastore');
const datastore = new Datastore();

var apigeeConfig = null; // Holds the Apigee config retrieved from Datastore and/or env properties

// Adds a log entry to Datastore
exports.addLogEntry = async function (severity, category, logMsg) {
  var logEntry = {};
  const curDateTimeInDefaultTZ = utcToZonedTime(new Date(), defaultOptions.timeZone);
  logEntry.timestamp = format(curDateTimeInDefaultTZ, 'yyyy-MM-dd HH:mm:SSxxxxx', { timeZone: defaultOptions.timeZone });;
  logEntry.severity = severity;
  logEntry.category = category;
  logEntry.message = logMsg.toString()
  if (severity == "ERROR") {
    if (logMsg.hasOwnProperty('stack')) {
      logEntry.error_details = logMsg.stack.toString().substring(0, 1500); // Truncate to 1,500 chars, max propterty length allowed in Datastore;
    }
    else {
      // Treat it as a string
      logEntry.error_details = logMsg.toString().substring(0, 1500);
    }
  }
  // Prepare the entries in the format expected by Datastore for an insert
  var newEntry = {};
  newEntry.key = datastore.key({
    namespace: 'cds_metrics',
    path: ['logs']
  });
  newEntry.data = logEntry;
  defaultOptions.debug && console.log("Inserting log entry in datastore: " + JSON.stringify(newEntry));
  await datastore.upsert(newEntry);

  // If if logToConsole or severity = ERROR, also log to console
  if ((severity == "ERROR") || (defaultOptions.logToConsole)) {
    console.error("======================================")
    console.error("Log Entry: ");
    console.error(JSON.stringify(logEntry));
    if (severity == "ERROR") {
      console.error("More details: ");
      console.error(logMsg);
    }
    console.error("======================================")
  }

}

// Retrieve Apigee instance details from Datastore or environment variables
exports.getApigeeConfig = function () {

  if ((typeof apigeeConfig === 'undefined') || (apigeeConfig === null)) {
    // Lazy initialisation
    apigeeConfig = {};
    apigeeConfig.apigee_org = process.env.APIGEE_ORG;
    apigeeConfig.apigee_env = process.env.APIGEE_ENV;
    apigeeConfig.runtime_host_alias = process.env.RUNTIME_HOST_ALIAS;
    apigeeConfig.default_base_uri = "https://" + apigeeConfig.runtime_host_alias;
    apigeeConfig.management_uri = "https://apigee.googleapis.com";
  }
  return apigeeConfig;
}

function compareByDateDesc(a, b) {
  // Utility function used to sort an array of elements based on their date_au property, in descending order
  const dateA = a.date_au;
  const dateB = b.date_au;

  var comparison = 0;
  if (dateA < dateB) {
    comparison = 1;
  } else if (dateA > dateB) {
    comparison = -1;
  }
  return comparison;
}


exports.fillDateGapsInMetricsArray = function (metricsArray, defaultValue, fromDate, toDate) {
  // Fills any date gaps that may be in an array of metrics, by inserting a default value. 
  // The array should include an entry for every day within the (fromDate,toDate) range
  // It assumes the metrics array elements have a date_au element, with a date in ISO format (YYYY-MM-DD), and that it is sorted in descending order

  const initialArrLength = metricsArray.length;
  var curDate = toDate;
  var arrIdx = 0;
  var newElemsArray = [];

  while ((curDate >= fromDate) && arrIdx < initialArrLength) {
    var curDateInArray = metricsArray[arrIdx].date_au;
    if (curDate > curDateInArray) {
      // curDate is missing in the array. Add a new element for it
      // defaultOptions.debug && console.log("-- Adding new elem for curDate=" + curDate);
      let newElem = {};
      newElem.date_au = curDate;
      newElem.value = defaultValue;
      newElemsArray.push(newElem);
    }
    else {
      // curDate is in array. Move array index
      arrIdx++;
      // defaultOptions.debug && console.log("-- curDate in array");
    }
    curDate = format(addDays(new Date(curDate), -1), 'yyyy-MM-dd');
  }

  // Fill any remaining gaps at the end of the array
  while (curDate >= fromDate) {
    // defaultOptions.debug && console.log("-- Adding new elem for curDate=" + curDate);
    let newElem = {};
    newElem.date_au = curDate;
    newElem.value = defaultValue;
    newElemsArray.push(newElem);
    curDate = format(addDays(new Date(curDate), -1), 'yyyy-MM-dd');
  }

  // Now merge the new elements and sort
  var filledMetricsArray = metricsArray.concat(newElemsArray);
  return filledMetricsArray.sort(compareByDateDesc);
}