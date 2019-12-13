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
 * filterTransactionsListBasedOnRequestFilters.js
 * Return only the transactions that meet the search criteria found in the request
 */

// Utility function. Check whether a given transaction meets filter criteria
function txMeetsSearchCriteria(txDetails, accountIdFilter, newestTimeFilter, oldestTimeFilter, minAmountFilter, maxAmountFilter, textFilter) {

    if ((accountIdFilter !== null) && (txDetails.accountId !== accountIdFilter)) {
        return false;
    }
    
    print("Starting date filter criteria checks. oldestTimeFilter = " + oldestTimeFilter + " - newestTimeFilter = " + newestTimeFilter);
	// Check transaction time
	var txTime = new Date(txDetails.postingDateTime);
	// print("txTime (Posting) = " + txTime);
	if ((!txTime || txTime === null || txTime == "Invalid Date")) {
	    // Use value date instead. We assume that in the mock data one of these will always be defined
	    txTime = new Date(txDetails.valueDateTime);
	    // print("txTime (Value) = " + txTime);
	}
	
	if ( (txTime > newestTimeFilter) || (txTime < oldestTimeFilter)) {
	    // print("txTime: " + txTime + " does not match");
	    return false;
	}
	
	// Check transaction amount
	var txAmt = parseFloat(txDetails.amount);
	// print("txAmt = " + txAmt);
	if (isNaN(txAmt)) {
	    // print("txAmt: " + txAmt + " is not a number");
	    return false;
	}
	print("Starting amount filter criteria checks. minAmountFilter = " + minAmountFilter + " - maxAmountFilter = " + maxAmountFilter);
	if ((!isNaN(minAmountFilter)) && (txAmt < minAmountFilter)) {
	    // print("txAmt: " + txAmt + " is less than minAmount");
	    return false;
	}
	if ((!isNaN(maxAmountFilter)) && (txAmt > maxAmountFilter)) {
	    //  print("txAmt: " + txAmt + " is greater than maxAmount");
	    return false;
	}
	
	print("textFilter = " + textFilter);
    if (textFilter) {
        // Check description field
        if ( (txDetails.description) && (!txDetails.description.toLowerCase().includes(textFilter.toLowerCase()))) {
            // print("Description: " + txDetails.description + " does not match");
            return false;
            
        }
        // Check reference field
		if ( (txDetails.reference) && (!txDetails.reference.toLowerCase().includes(textFilter.toLowerCase()))) {
		    // print("Reference: " + txDetails.reference + " does not match");
		    return false;
		}

	}
	
	// print("Transaction meets filter criteria");
	return true;

}

// Get the transaction filter criteria, if any
	
	
var accountIdFilter = context.getVariable("transactionsFilter.account-id");
var newestTimeFilter = new Date(context.getVariable("transactionsFilter.newest-time"));
var oldestTimeFilter = new Date(context.getVariable("transactionsFilter.oldest-time"));
if (newestTimeFilter === "Invalid Date" || newestTimeFilter.getTime() === 0) {
    // Set it to today
    newestTimeFilter = new Date();
    }
if (oldestTimeFilter === "Invalid Date" || oldestTimeFilter.getTime() === 0) {
    // Set it to newestTimeFilter - 90 days
    // Substract 90 days in milliseconds
    var dateOffset = (24*60*60*1000) * 90; //90 days
    oldestTimeFilter = new Date();
    oldestTimeFilter.setTime((newestTimeFilter.getTime() - dateOffset));
}
var minAmountFilter = parseFloat(context.getVariable("transactionsFilter.min-amount"));
var maxAmountFilter = parseFloat(context.getVariable("transactionsFilter.max-amount"));
var textFilter = context.getVariable("transactionsFilter.text");
var fullListOfTransactionsDetails = JSON.parse(context.getVariable("listOfAllTransactionsDetails"));
var newTxList = [];
if (fullListOfTransactionsDetails && fullListOfTransactionsDetails.length > 0) {
    for (var i = 0; i < fullListOfTransactionsDetails.length; i++) {
        if (txMeetsSearchCriteria(fullListOfTransactionsDetails[i], accountIdFilter, newestTimeFilter, oldestTimeFilter, minAmountFilter, maxAmountFilter, textFilter)) {
            // Only include in the response transactions matching the filter criteria
            newTxList.push(fullListOfTransactionsDetails[i]);
        }
    }

    context.setVariable("filteredTransactionsList", JSON.stringify(newTxList));
}