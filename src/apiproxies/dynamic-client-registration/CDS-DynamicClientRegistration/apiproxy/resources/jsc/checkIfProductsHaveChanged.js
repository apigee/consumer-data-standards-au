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
 * checkIfProductsHaveChanged.js
 * Based on the scopes provided on the SSA (space separated string), determine whether there have been any changes with respect to the products associated with this clients
 */

// Utility function. Compares 2 arrays to check that both have the same elements (irrespective of order)
function compareSets(array1, array2) {
    if (array1.length !== array2.length) {
        return false;
    }

    var len = array1.length;
    var array1AsSet = {};

    // Convert array1 into a Set
    for (var i = 0; i < len; i++) {
        var curval = array1[i];
        array1AsSet[curval] = true;
    }

    // Compare array2 values to array1 values
    for (i = 0; i < len; i++) {
        var curval = array2[i];
        if (!(curval in array1AsSet)) {
            return false;
        }
    }

    return true;
}


var existingProductArray = JSON.parse(context.getVariable("theExistingProductArray")); // In the Update Client Registration Use case, this variable will hold the list of products currently associated with the app
var newProductArray = JSON.parse(context.getVariable("productList"));

var changedProducts = false;
// If there are already scopes defined in the app, verify whether these have changed
if ( Array.isArray(existingProductArray) ) {
    changedProducts = !(compareSets(newProductArray,existingProductArray));
}

// Also convert theExistingAppSecret variable to the right type. Since this is the result of a JSONPath Extract Variable, it is an array of 1 string. Convert it to a string.
var theSecretAsAnArray = JSON.parse(context.getVariable("theExistingAppSecret"));
context.setVariable("theExistingAppSecret",theSecretAsAnArray[0]);
context.setVariable("changedProducts",changedProducts);
// print("Finished checking products. newProductArray = " + JSON.stringify(newProductArray) + " - changedProducts = " + changedProducts);