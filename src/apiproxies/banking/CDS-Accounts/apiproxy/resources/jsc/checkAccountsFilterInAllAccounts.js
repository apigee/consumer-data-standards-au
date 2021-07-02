 /*
* Copyright 2020 Google LLC
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
 * checkAccountsFilterInAllAccounts.js
 * Checks that the accounts included in the the filter ALL are in the consent scope. For the time being that means they must all belong to the customer 
 */
 
 var customerAccountsList = JSON.parse(context.getVariable("listOfAllAccounts"));
 var filterAccountList = JSON.parse(context.getVariable("filteredAccountList"));
 
 print("Cust Acct List = " + JSON.stringify(customerAccountsList) + " -  filterAcctList = " + JSON.stringify(filterAccountList));
 
 var ok = true;
 var i = 0;
 
 while ( (i < filterAccountList.length) && ok) {
     ok =  (customerAccountsList.indexOf(filterAccountList[i]) > -1);
     i++;
 }
 
 print("Filter OK = " + ok);
 context.setVariable("accountFilterOK", ok);
 context.setVariable("invalidAccount", filterAccountList[i-1]);
 
 