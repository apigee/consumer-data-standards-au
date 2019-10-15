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
 * modifyDatesInMockTransactions.js
 * Change dates in some transactions so that there are always transactions in the default date filter criteria (last 90 days)
 * Assumption: The mock list of transactions does include some transactions dated between 12 and 14 December 2018
 *             These are the ones that will be replaced with dates closer to the current date
 * 
 */
 
 function getDateMinusAmountOfDays(theDate, amountOfDays) {
     // Utility function -  returns the date minus the specified amount of days
      var oneDayOffset = 24*60*60*1000; // Expressed in milliseconds
      var theNewDate = new Date();
      theNewDate.setTime(theNewDate - (oneDayOffset * amountOfDays));
    //   print("For amtOfDays = "+ amountOfDays + ", returning new Date: " + theNewDate.toString());
      return theNewDate;
 }
 
 function padToTwoPlaces(aNumber){
     // Utility function - return a 2 character string with the number padded to the left with an extra 0
     // if required. Assumption: aNumber is a day of month or a month, so always has at most 2 places
     paddedString = (aNumber >= 10)? aNumber.toString() : "0" + aNumber.toString();
     return paddedString;
     
 }
 
 function modifyDateIfWithinRange(aDateStr) {
     // Utility function that will modify a Date if between 12 and 14 December 2018
     // Replace it with either yesterday, 2 days, or 3 days ago
     aDate = new Date(aDateStr);
     if ((!aDate || aDate === null || aDate == "Invalid Date")) {
         return aDateStr;
    }
    // print("Working with aDateStr = " + aDateStr + " - aDate = " + aDate.toString());
    var newDate = aDate;
    // Use only the date component and break it into year, month day, using "-" to split it
    var aDateStrDateComponent = aDateStr.split("T")[0];
    var aDateStrDateArray = aDateStrDateComponent.split("-");
    if ((aDateStrDateArray[0] == 2018) && aDateStrDateArray[1] == 12) {
        // Check the dates
        if (aDateStrDateArray[2] == 14) {
            // print("Swapping 14-Dec-2018 for Yesterday");
            newDate = yesterdayDate;
        }
        if (aDateStrDateArray[2]  == 13) {
            // print("Swapping 13-Dec-2018 for 2 days ago");
            newDate = twoDaysAgoDate;
        }
        if (aDateStrDateArray[2]  == 12) {
            // print("Swapping 12-Dec-2018 for 3 days ago");
            newDate = threeDaysAgoDate;
        }
        // print("New date = " + newDate.toString());
    }
    
    if (aDate != newDate) {
        // We've modified the date, format it now as a string.
        // Keep the same time portion as the original date
        aDateStr = newDate.getFullYear() +  "-" + padToTwoPlaces(newDate.getMonth()+1) + "-" + padToTwoPlaces(newDate.getDate()) + "T" + aDateStr.substring( aDateStr.indexOf('T') + 1 ) ; // Keep the time component (after T) from the original date string
        // print("Now aDateStr = " + aDateStr);
    }
    
    return aDateStr;
     
 }
 
 var txList = JSON.parse(context.getVariable("listOfAllTransactionsDetails"));
 
 // Calculate some dates that do fall within the default filter criteria
 var today  = new Date();
 var yesterdayDate = getDateMinusAmountOfDays(today,1);
 var twoDaysAgoDate = getDateMinusAmountOfDays(today,2);
 var threeDaysAgoDate = getDateMinusAmountOfDays(today,3);
 
 if (txList && txList.length > 0) {
    for (var i = 0; i < txList.length; i++) {
        curTx = txList[i];
        // print("Working on tx # " + i + " - PostingDateTime = " + curTx.postingDateTime + " - ValueDateTime = " + curTx.valueDateTime);
        curTx.postingDateTime = modifyDateIfWithinRange(curTx.postingDateTime);
        // print("Now postingDateTime = " + curTx.postingDateTime);
        curTx.valueDateTime = modifyDateIfWithinRange(curTx.valueDateTime);
        // print("Now valueDateTime = " + curTx.valueDateTime);
        txList[i] = curTx;

    }
 }
 
 context.setVariable("listOfAllTransactionsDetails", JSON.stringify(txList));
 