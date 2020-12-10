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
 * assignProductsBasedOnScope.js
 * Based on the scopes provided on the SSA (space separated string), determine the corresponding products that the ADR Client App should be associated with
 */


const productToScopeMappings = {
    "CDSOIDC": "openid,profile",
    "CDSAccounts": "bank:accounts.basic:read,bank:accounts.detail:read",
    "CDSTransactions": "bank:transactions:read",
    "CDSDynamicClientRegistration": "cdr:registration"
};

var scopeString = context.getVariable("ADRDetailsFromSSA.scope");
var productArray = [];
var scopeArray = [];

// Iterate over all products
const prodKeys = Object.keys(productToScopeMappings);
for (var i = 0; i < prodKeys.length; i++)  {
  var curProd = prodKeys[i];  
  var curScopeString = productToScopeMappings[curProd];
  var curAcceptedScopes = curScopeString.split(",");
//   print("Prod = " + curProd + " - scopes = " + JSON.stringify(curAcceptedScopes));
    // If any of the accepted scopes is in the ADR Scope string, add the product
  for (var j = 0; j < curAcceptedScopes.length; j++) {
        curScope = curAcceptedScopes[j];
        if (scopeString.includes(curScope)) {
            // print("Adding product: " + curProd + ", because of scope: " + curScope);
            scopeArray.push(curScope);
            if (!(JSON.stringify(productArray).includes(curProd)) ) {
                productArray.push(curProd);
            }
        }
  }
}


context.setVariable("productList", JSON.stringify(productArray));
context.setVariable("scopeList", JSON.stringify(scopeArray));
// print("Finished iterating. productArray = " + JSON.stringify(productArray) + " - scopeArray = " + JSON.stringify(scopeArray));