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
 * removeAccountDetails.js
 * Remove detailed account attributes that shouldn't be returned in getAccounts
 */


// TO DO
var filteredAccountList = JSON.parse(context.getVariable("filteredAccountList"));
var newAccountList = [];
if (filteredAccountList && filteredAccountList.length >0)
{
    for(var i = 0; i< filteredAccountList.length; i++)
    {
        // Remove detailed product attributes that shouldn't be returned in getProducts
        curAcct = filteredAccountList[i];
        delete curAcct.bsb;
        delete curAcct.accountNumber;
        delete curAcct.bundleName;
        delete curAcct.specificAccountUType;
        delete curAcct.termDeposit;
        delete curAcct.creditCard;
        delete curAcct.loan;
        delete curAcct.depositRate;
        delete curAcct.lendingRate;
        delete curAcct.depositRates;
        delete curAcct.lendingRates;
        delete curAcct.features;
        delete curAcct.fees;
        delete curAcct.addresses;
       
        
        newAccountList.push(curAcct);
    }
}    

var bankAccounts = {};
bankAccounts.data = {};
// Format response according to Get Products spec
bankAccounts.data["accounts"] = newAccountList;
context.setVariable("response.content",JSON.stringify(bankAccounts));
     