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

const request = require('request');
const metricsRequestConfig = require('./metrics-requests-config');
const defaultOptions = metricsRequestConfig.defaultOptions;


module.exports.requestApigeeApi = function (requestOpts,apigeeConfig) {
    return new Promise(async function (resolve, reject) {
        
        defaultOptions.debug && console.log("Starting Apigee request...");

        const auth = {
            username: apigeeConfig.apigee_user,
            password: apigeeConfig.apigee_password
        };
        const defaultBaseURI = apigeeConfig.management_uri + '/v1/organizations/' + apigeeConfig.apigee_org + '/environments/' + apigeeConfig.apigee_env;
        const myRequest = request.defaults({ auth: auth });
        requestOpts.uri = defaultBaseURI + requestOpts.apiPathSuffix;
        delete requestOpts.apiPathSuffix;
        defaultOptions.debug && console.log("Will send with request options = " + JSON.stringify(requestOpts));


        myRequest(requestOpts, function (err, res, body) {
            defaultOptions.debug && console.log("After receiving response....");
            if (err) {
                reject(new Error(err));
            } else if (res.statusCode == 200 || res.statusCode == 201) {
                defaultOptions.debug && console.log(JSON.stringify(body));
                resolve(body);
            } else {
                var errMsg;
                if (body && (body.message)) {
                    errMsg = 'Apigee API request failed with status code: ' + res.statusCode + ' - Message: ' + body.message;
                } else {
                    errMsg = 'Apigee API request failed with status code ' + res.statusCode;
                }
                defaultOptions.debug && console.log("Error found - Code = " + res.statusCode + " - Msg = " + errMsg);
                reject(errMsg);
            }
        })

    });
}