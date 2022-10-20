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
 * apigee-api-connector.js
 * Sends requests to Apigee APIs.
 */

// const request = require('gaxios');
const metricsRequestConfig = require('./metrics-requests-config');
const defaultOptions = metricsRequestConfig.defaultOptions;
const { GoogleAuth } = require('google-auth-library');


module.exports.requestApigeeApi = function (requestOpts, apigeeConfig) {
    return new Promise(async function (resolve, reject) {

        defaultOptions.debug && console.log("Starting Apigee request...");

        // Temporary for dev purposes!!!
        // apigeeConfig.token = process.env.TOKEN;
        const auth = new GoogleAuth();
        const client = await auth.getClient();
        const defaultBaseURI = apigeeConfig.management_uri + '/v1/organizations/' + apigeeConfig.apigee_org + '/environments/' + apigeeConfig.apigee_env;
        requestOpts.url = defaultBaseURI + requestOpts.apiPathSuffix;
        delete requestOpts.apiPathSuffix;
        defaultOptions.debug && console.log("Will send with request options = " + JSON.stringify(requestOpts));

        client.request(requestOpts)
            .then(res => {
                defaultOptions.debug && console.log("Response status code = " + res.status);
                if (res.data) {
                    defaultOptions.debug && console.log("Response body:\n" + JSON.stringify(res.data));
                }
                else {
                    defaultOptions.debug && console.log("No response body");
                }
                if (res.status == 200 || res.status == 201) {
                    resolve(res.data);
                } else {
                    var errMsg;
                    if (res.data && res.data.message) {
                        errMsg = 'Apigee API request failed with status code: ' + res.status + ' - Message: ' + res.data.message;
                    } else {
                        errMsg = 'Apigee API request failed with status code ' + res.status;
                    }
                    defaultOptions.debug && console.log("Error found - Code = " + res.status + " - Msg = " + errMsg);
                    reject(errMsg);
                }
            })
            .catch(err => {
                defaultOptions && console.log("Error while executing Apigee request: ");
                defaultOptions.debug && console.log(err);
                reject(new Error(err));
            });
    });
}
