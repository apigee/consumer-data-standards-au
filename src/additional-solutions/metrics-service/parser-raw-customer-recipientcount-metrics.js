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
 * parser-raw-customer-recipientcount-metrics.js
 * Helper function to parse the raw customer count and recipient count metrics returned by Apigee API..
 */
/*  Utility function. Parses the raw customer count and recipient count metrics returned by Apigee API.
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
                  "1.0"
                ]
              }
            ],
            "name": "qeqCi92dJa6r6Kxa07ybdG0isGFMmiYW,85a17c093ddceeddf30c8ff53852578962f23b684f66efc1aca0ab456f0a68b3,acquire"
          },
          {
            "metrics": [
              {
                "name": "sum(message_count)",
                "values": [
                  "1.0"
                ]
              }
            ],
            "name": "qeqCi92dJa6r6Kxa07ybdG0isGFMmiYW,85a17c093ddceeddf30c8ff53852578962f23b684f66efc1aca0ab456f0a68b3,refresh"
          },
          {
            "metrics": [
              {
                "name": "sum(message_count)",
                "values": [
                  "1.0"
                ]
              }
            ],
            "name": "qeqCi92dJa6r6Kxa07ybdG0isGFMmiYW,85a17c093ddceeddf30c8ff53852578962f23b684f66efc1aca0ab456f0a68b3,expire"
          }
        ],
        "name": "dev"
      }
    ],
    "metaData": {
      "errors": [],
      "notices": [
        "query served by:0139f826-2677-4bc6-99de-0976b606d633",
        "Source:Big Query",
        "Table used: uap-aus-se1.edge.edge_api_smbaxgroup003_fact"
      ]
    }
  }
    * 
    * 
    * Sample returned metric:
    *  
    * [[{
    date_au: "current",
    value: 1
}], [{
    date_au: "current",
    value: 1
}]]
    * ie: An array with of 2 standardised computed metrics, one for customerCount and one for recipientCount, both of them arrays with one element
    * 
    */

const metricsRequestConfig = require('./metrics-requests-config');
const defaultOptions = metricsRequestConfig.defaultOptions;

exports.parse = function (rawCustomerRecipientCountMetrics) {
  var dimensionsArray;
  try { dimensionsArray = rawCustomerRecipientCountMetrics.environments[0].dimensions }
  catch (err) {
    // If no data returned, set dimensionsArray array to an empty array
    dimensionsArray = [];
  }
  if ((dimensionsArray === null) || (typeof dimensionsArray === 'undefined')) {
    dimensionsArray = [];

  }
  let tokenOperationByCustomer = {};
  for (i = 0; i < dimensionsArray.length; i++) {
    // Iterate over dimensions array. 
    // Each dimension is a unique client_id, customerPPId, tokenOp combination.
    // A customerPPId is pseudonym for a given end user accessed from a given data recipient (identified by client_id)
    // The same user accessing their data from another data recipient will be identified by another PPId.
    // There is a 1-1 mapping between customerPPId and client_id
    // We will create an object that stores all tokenOperations found for a given customerPPId
    const currDimension = dimensionsArray[i].name;
    const dimSplitArray = currDimension.split(',');
    const curClientId = dimSplitArray[0];
    const curCustomerPPId = dimSplitArray[1];
    const curTokenOperation = dimSplitArray[2];
    if ((tokenOperationByCustomer[curCustomerPPId] === null) || (typeof tokenOperationByCustomer[curCustomerPPId] === 'undefined')) {
      // Create a new entry for this customerPPId
      tokenOperationByCustomer[curCustomerPPId] = {};
      tokenOperationByCustomer[curCustomerPPId].clientId = curClientId;
    }
    // Add an entry for the tokenOperation found
    tokenOperationByCustomer[curCustomerPPId][curTokenOperation] = dimensionsArray[i].metrics[0].values;
  }

  let activeCustomerCnt = 0;
  let recipientWithActiveCustomers = {};
  // Now iterate over tokenOperationsByCustomer, decide if this customerPPId has an active session. If so, update activeCustomerCnt and the sessionsByClientId object
  for (const curCustPPId in tokenOperationByCustomer) {
    isActive = decideIfCustomerSessionIsActive(tokenOperationByCustomer[curCustomerPPId]);
    if (isActive) {
      activeCustomerCnt++;
      recipientWithActiveCustomers[tokenOperationByCustomer[curCustPPId].clientId] = "true";
    }
  }
  var computedCustomerCountMetric = [];
  var newEntry = { date_au: "current" };
  newEntry.value = activeCustomerCnt;
  computedCustomerCountMetric.push(newEntry);
  var computedRecipientCountMetric = [];
  newEntry.value = Object.values(recipientWithActiveCustomers).length;
  computedRecipientCountMetric.push(newEntry);
  defaultOptions.debug && console.log("--- computedCustomerCountMetric = " + JSON.stringify(computedCustomerCountMetric));
  defaultOptions.debug && console.log("--- computedRecipientCountMetric = " + JSON.stringify(computedRecipientCountMetric));
  return [computedCustomerCountMetric, computedCustomerCountMetric];

}

// Utility function. Decide if a customerSession is active based on the number of token operations (acquire, refresh, revoke) observed in the last period
// Since we only have an aggregate count of operations, and not the order in which the operations have happened, we'll need to apply some empirical rules.
// Decision tree:
// 1 - If revoke found and no acquire and no refresh => inactive
// 2 - If (acquire or refresh) and no revoke => active
// 3 - If no acquire found and refresh and revoke => inactive (The only possible sequence of events in this case is refresh then revoke. 
//                                                             You can never refresh an already revoked token)
// The rules so far are deterministic. The empiric rules need to cover: acquire found and revoke found (with or w/o refresh)
// 4- If # revoke > max (#acquire,#refresh) => Inactive 
// 5 - If those are equal => Inactive -> We assume that a token is normally not acquire soon after a session being explicitly revoked
// 6 - If # revoke < max (#acquire,#refresh => Active -> We assume that the last op that took place was an acquire 
// Note: We can never have the 3 arguments = 0, because the metrics API would never return such a combination if there were no operations

function decideIfCustomerSessionIsActive(tokenOps) {
  const numAcquireTokenOps = (tokenOps.acquire === null || (typeof tokenOps.acquire === 'undefined')) ? 0 : tokenOps.acquire;
  const numRefreshTokenOps = (tokenOps.refresh === null || (typeof tokenOps.refresh === 'undefined')) ? 0 : tokenOps.refresh;
  const numRevokeTokenOps = (tokenOps.expire === null || (typeof tokenOps.expire === 'undefined')) ? 0 : tokenOps.expire;
  defaultOptions.debug && console.log("Deciding on numAcquireTokenOps = " + numAcquireTokenOps + " - numRefreshTokenOps = " + numRefreshTokenOps + " - numRevokeTokenOps = " + numRevokeTokenOps);
  if ((numAcquireTokenOps == 0) && (numRefreshTokenOps == 0) && (numRevokeTokenOps > 0)) {
    // Rule #1
    defaultOptions.debug && console.log("Returned false - Rule 1");
    return false;
  }
  else if (((numAcquireTokenOps > 0) || (numRefreshTokenOps > 0)) && (numRevokeTokenOps == 0)) {
    // Rule #2
    defaultOptions.debug && console.log("Returned true - Rule 2");
    return true;
  }
  else if ((numAcquireTokenOps == 0) && (numRefreshTokenOps > 0) && (numRevokeTokenOps > 0)) {
    // Rule #3
    defaultOptions.debug && console.log("Returned false - Rule 3");
    return false;
  }
  else {
    numIssueOps = Math.max(numAcquireTokenOps, numRefreshTokenOps);
    if (numRevokeTokenOps >= numIssueOps) {
      // Rules #4 and #5
      defaultOptions.debug && console.log("Returned false - Rule 4 or 5");
      return false;
    }
    else {
      // Rule #6
      defaultOptions.debug && console.log("Returned true - Rule 6");
      return true;
    }

  }
}
