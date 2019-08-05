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
 * buildAccountDetailsResponse.js
 * Format response according to Get Account Details spec
 */


//TO DO

// Format response according to Get Account Details spec
// The result of the JSONPath expression is always an array (of AccountDetails in this case),
// but the product details response needs the productDetails element
var theAccountDetails = JSON.parse(context.getVariable("theAccountDetails"));

var accountDetails = {};
accountDetails.data = theAccountDetails[0];
context.setVariable("response.content",JSON.stringify(accountDetails));
    