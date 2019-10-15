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
 * removeTransactionDetails.js
 * Remove detailed transation attributes that shouldn't be returned in getTransactions
 */


var filteredTransactionsList = JSON.parse(context.getVariable("filteredTransactionsList"));
var newTransactionsList = [];
if (filteredTransactionsList && filteredTransactionsList.length >0)
{
    for(var i = 0; i< filteredTransactionsList.length; i++)
    {
        // Remove detailed transaction attributes that shouldn't be returned in listTransactions
        curTx = filteredTransactionsList[i];
        delete curTx.extendedData;
        
        newTransactionsList.push(curTx);
    }
}    

var txList = {};
txList.data = {};
// Format response according to Get Transactions spec
txList.data["transactions"] = newTransactionsList;
context.setVariable("response.content",JSON.stringify(txList));
     