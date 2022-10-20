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
 * healthcheck-service.js
 * Health Check service Route.
 */

const format = require('date-fns-tz/format');
const utcToZonedTime = require('date-fns-tz/utcToZonedTime');
const metricsRequestConfig = require('./metrics-requests-config');
const defaultOptions = metricsRequestConfig.defaultOptions;
const metricsServiceUtils = require('./metrics-service-utils');
// Instantiate a datastore client
const { Datastore } = require('@google-cloud/datastore');
const datastore = new Datastore();
const gaxios = require('gaxios');

// Invokes CDR Discovery status API. 
// Updates the monthly count of healtchecks executed and successful healtchecks (Successful If the result shows the platform is OK of PARTIALLY_AVAILABLE)
// Metrics are kept in a DataStore entity. Monthly entries are kept in an entity called 'monthly_metrics', indexed by Month (Format: YYYY-MM)

exports.healthcheck = async function () {
    // Invoke healthcheck

    const apigeeConfig = metricsServiceUtils.getApigeeConfig();
    var service_available = true;
    var status_reason = "";

    defaultOptions.debug && console.log("Starting CDR Healtcheck...");

    requestOpts = {
        method: 'GET',
        headers: { 'x-v': 1 },
        body: null,
        url: apigeeConfig.default_base_uri + '/cds-au/v1/discovery/status',
        timeout: 10000 // Request should timeout in 10s
    };
    defaultOptions.debug && console.log("Will send with request options = " + JSON.stringify(requestOpts));
    gaxios.request(requestOpts)
        .then(res => {
            defaultOptions.debug && console.log("After receiving response....");
            defaultOptions.debug && console.log("Response status code: " + res.status);
            defaultOptions.debug && res.data && console.log("Response body: " + JSON.stringify(res.data));
            // Parse response
            parsed_body = res.data;
            if (res.status == 200) {
                var status = parsed_body.data.status;
                if ((status == "OK") || (status == "PARTIAL_FAILURE")) {
                    service_available = true;
                    status_reason = "Healtcheck success - Status = " + status;
                }
                else {
                    service_available = false;
                    status_reason = "Healtcheck returns Service not available - Status = " + status;
                }
            } else {
                service_available = false;
                if ((parsed_body) && (parsed_body.errors)) {
                    status_reason = JSON.stringify(res.data.errors);
                } else {
                    status_reason = 'Healthcheck failed with status code ' + res.statusCode;
                }

            }
        })
        .catch(err => {
            service_available = false;
            status_reason = "Healthcheck failed - " + err.toString();
        });

    // Get current monthly metrics in datastore
    const nowInDefaultTZ = utcToZonedTime(new Date(), defaultOptions.timeZone);
    const curMonth = format(nowInDefaultTZ, 'yyyy-MM', { timeZone: defaultOptions.timeZone });
    const query = datastore.createQuery('cds_metrics', 'monthly_metrics')
        .filter('date_au', '=', curMonth);
    var [existingMetrics] = await datastore.runQuery(query);
    if ((existingMetrics === null) || (existingMetrics.length == 0)) {
        // No metrics found for current month, create new entry.
        let newEntry = {};
        metricName = 'availability';
        newEntry.key = datastore.key({
            namespace: 'cds_metrics',
            path: ['monthly_metrics', curMonth + '-' + metricName]
        });
        newEntry.data = {};
        newEntry.data.date_au = curMonth;
        newEntry.data.metric_name = metricName;
        newEntry.data.value = 1;
        newEntry.data.num_checks = 0;
        newEntry.data.num_successful_checks = 0;
        existingMetrics.push(newEntry);
    }
    // Update the healthcheck values
    existingMetrics[0].num_checks++;
    if (service_available) {
        existingMetrics[0].num_successful_checks++;
    }
    existingMetrics[0].value = existingMetrics[0].num_successful_checks / existingMetrics[0].num_checks;
    defaultOptions.debug && console.log("Updating in datastore");
    await datastore.upsert(existingMetrics);
    metricsServiceUtils.addLogEntry("SUCCESS", "Availability metric update", status_reason);
};



