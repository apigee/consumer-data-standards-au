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
 * metrics-requests-config.js
 * Configuration info for requests that need to be sent to Apigee APIs to retrieve metrics
 * Also holds default values used by this service
 */

exports.defaultOptions = {
    tzo: 600, // Time zone offset as used in Apigee Metrics APIs. Number of minutes from GMT. 600 means GMT+10, ie: AEST
    timeZone: 'Australia/Brisbane', // We use this time zone as it's always GMT+10, no daylight savings.
    tokenDurationInMinutes: 10, // The duration of an access token when it's issued
    logToConsole: false, // Flag to control whether to show log entries also in the console, in addition to adding them to datastore entity "cds_metrics.logs" 
    debug: false // Flag to control whether to output debugging messages to console
}

// The performance tiers used for some metrics reporting (Invocations and Average Response)
exports.performanceTiers = ["largePayload", "highPriority", "lowPriority", "unattended", "unauthenticated"];

// Default values for all metrics
exports.defaultMetricsValues = {
    daily: {
        averageResponse: { largePayload: 0, highPriority: 0, lowPriority: 0, unattended: 0, unauthenticated: 0 },
        averageTps: 0,
        peakTps: 0,
        performance: 1,
        errors: 0,
        invocations: { largePayload: 0, highPriority: 0, lowPriority: 0, unattended: 0, unauthenticated: 0 },
        rejections: 0,
        sessionCount: 0
    },
    monthly: {
        availability: 1.0,
        num_healthchecks: 0,
        num_successful_healthchecks: 0
    },
    current: {
        customerCount: 0,
        recipientCount: 0
    }
}


exports.performanceRequestOptions = {
    apiPathSuffix: '/stats/meetsperformanceslo',
    method: 'GET',
    body: null,
    json: true,
    qs: {
        tsAscending: false,
        tzo: exports.defaultOptions.tzo,
        select: 'sum(message_count)',
        timeUnit: 'day',
        filter: "(meetsperformanceslo ne '(not set)')"
    }
}

exports.invocationAndAvgResponseRequestOptions = {
    apiPathSuffix: '/stats/performancetier',
    method: 'GET',
    body: null,
    json: true,
    qs: {
        tsAscending: false,
        tzo: exports.defaultOptions.tzo,
        select: 'sum(message_count),avg(total_response_time)',
        timeUnit: 'day',
        filter: "(meetsperformanceslo ne '(not set)')"
    }
}

exports.sessionCountRequestOptions = {
    apiPathSuffix: '/stats/apiproxy',
    method: 'GET',
    body: null,
    json: true,
    qs: {
        tsAscending: false,
        tzo: exports.defaultOptions.tzo,
        select: 'sum(message_count)',
        timeUnit: 'day',
        filter: "(apiproxy eq 'oidc' and proxy_pathsuffix eq '/token' and request_verb eq 'POST')"
    }
}

exports.errorAndRejectionRequestOptions = {
    apiPathSuffix: '/stats/response_status_code',
    method: 'GET',
    body: null,
    json: true,
    qs: {
        tsAscending: false,
        tzo: exports.defaultOptions.tzo,
        select: 'sum(message_count)',
        timeUnit: 'day'
    }
}

exports.avgTpsRequestOptions = {
    apiPathSuffix: '/stats/',
    method: 'GET',
    body: null,
    json: true,
    qs: {
        tsAscending: false,
        tzo: exports.defaultOptions.tzo,
        select: 'tps',
        timeUnit: 'day'
    }
}

exports.peakTpsRequestOptions = {
    apiPathSuffix: '/stats/',
    method: 'GET',
    body: null,
    json: true,
    qs: {
        tsAscending: false,
        tzo: exports.defaultOptions.tzo,
        select: 'tps',
        timeUnit: 'minute'
    }
}

exports.customerAndRecipientRequestOptions = {
    apiPathSuffix: '/stats/client_id,customerppid,tokenop',
    method: 'GET',
    body: null,
    json: true,
    qs: {
        tsAscending: false,
        tzo: exports.defaultOptions.tzo,
        select: 'sum(message_count)',
        filter: "(apiproxy eq 'oidc')  and (customerppid ne 'n/a') and (customerppid ne '(not set)') and (tokenop in 'acquire', 'refresh', 'expire')"
    }
}

