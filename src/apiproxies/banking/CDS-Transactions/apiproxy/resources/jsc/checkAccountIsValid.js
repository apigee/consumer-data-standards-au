  /*
 * Copyright 2021 Google LLC
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
 * checkAccountIsValid.js
 * Checks if an account is in the list of valid accounts for a given customerId
 *
 */
 
 // Treat listOfAllAccounts as a string because the JS interpreter does not support Array.includes 
 var listOfAllAccounts = String(context.getVariable("listOfAllAccounts"));
 var theAccountId = context.getVariable("theAccountId");
 var isValid = listOfAllAccounts.includes(theAccountId);
 
 context.setVariable("accountIsValid",isValid);