  /*
 * Copyright 2019 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     https://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
*/

/**
 * @file
 * filterResults.js
 * Return results only for accounts that match the request filter criteria
 */


// Treat array of accounts as a string because the JS interpreter does not support Array.includes 
var filteredAccountList = context.getVariable("filteredAccountList");
var allResults = JSON.parse(context.getVariable("listOfAllResults"));
var resultsType = context.getVariable("resultsType");
var newResultsList = [];

for(var i = 0; i < allResults.length; i++) {
    // Iterate over all results
    curResult = allResults[i];
    if (filteredAccountList.includes(curResult.accountId)) {
        if (resultsType == "accounts") {
             // Remove detailed product attributes that shouldn't be returned in getProducts
            curAcct = filteredAccountList[i];
            delete curResult.bsb;
            delete curResult.accountNumber;
            delete curResult.bundleName;
            delete curResult.specificAccountUType;
            delete curResult.termDeposit;
            delete curResult.creditCard;
            delete curResult.loan;
            delete curResult.depositRate;
            delete curResult.lendingRate;
            delete curResult.depositRates;
            delete curResult.lendingRates;
            delete curResult.features;
            delete curResult.fees;
            delete curResult.addresses;

        }
        newResultsList.push(curResult);
    }
}

var results = {};
results.data = {};
// Format response according to  spec
results.data[resultsType] = newResultsList;
context.setVariable("response.content",JSON.stringify(results));
     