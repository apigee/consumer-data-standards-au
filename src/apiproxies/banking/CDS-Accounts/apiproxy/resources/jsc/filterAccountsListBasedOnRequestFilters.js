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
 * filterAccountsListBasedOnRequestFilters.js
 * Return only the accounts that meet the search criteria found in the request
 */

// Utility function. Check whether an account meets customerId, product-category, open-status or is-owned filter criteria
function accountMeetsSearchCriteria(accountDetails, customerIdFilter, prodCategoryFilter, openStatusFilter, isOwnedFilter) {

    if ((customerIdFilter !== null) && (accountDetails.customerId !== customerIdFilter)) {
        return false;
    }

    if ((prodCategoryFilter !== null) && (accountDetails.productCategory.toLowerCase() !== prodCategoryFilter.toLowerCase())) {
        return false;
    }

    if ((openStatusFilter !== null) && (openStatusFilter.toUpperCase() !== "ALL") && (accountDetails.openStatus.toUpperCase() !== openStatusFilter.toUpperCase())) {
        return false;
    }

    if ((isOwnedFilter !== null) && (accountDetails.isOwned.toString() !== isOwnedFilter.toLowerCase())) {
        return false;
    }

    return true;
}

// Get the accounts filter criteria, if any
var customerIdFilter = context.getVariable("accountsFilter.customer-id");
var prodCategoryFilter = context.getVariable("accountsFilter.product-category");
var openStatusFilter = context.getVariable("accountsFilter.open-status");
var isOwnedFilter = context.getVariable("accountsFilter.is-owned");
var fullListOfAccountsDetails = JSON.parse(context.getVariable("listOfAllAccountDetails"));
var newAccountList = [];
if (fullListOfAccountsDetails && fullListOfAccountsDetails.length > 0) {
    for (var i = 0; i < fullListOfAccountsDetails.length; i++) {
        if (accountMeetsSearchCriteria(fullListOfAccountsDetails[i], customerIdFilter, prodCategoryFilter, openStatusFilter, isOwnedFilter)) {
            // Only include in the response accounts matching the filter criteria
            newAccountList.push(fullListOfAccountsDetails[i]);
        }
    }

    context.setVariable("filteredAccountList", JSON.stringify(newAccountList));
}