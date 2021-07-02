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
 * checkVersionHeaders.js
 * Verifies that x-v (and x-min-v, if necessary) are between the expected ranges: 1 to currentEndpointVersion
 */
 
 const vHdr = context.getVariable("request.header.x-v");
 var minVHdr = context.getVariable("request.header.x-min-v");
 const currEndpointVersion = parseInt(context.getVariable("currentEndpointVersion"));
 var hdrError = false;
 var hdrErrorMsg;
 var hdrStatusCode = "400";
 var hdrErrorCode;
 var hdrErrorTitle;
 
  hdrError = (vHdr == "undefined") || (vHdr === null) || (vHdr === "");
 if (hdrError) {
     hdrErrorMsg = "Missing version header x-v";
     hdrErrorCode = "urn:au-cds:error:cds-all:Header/Missing";
     hdrErrorTitle = "Missing Required Header"

 }
 else {
     // Convert xVHdr to number
     const vHdrAsNumber = parseInt(vHdr);
     hdrError = (isNaN(vHdrAsNumber)) || (vHdrAsNumber < 1);
     if (hdrError) {
        hdrErrorMsg = "Version header x-v should be a positive integer";
        hdrErrorCode = "urn:au-cds:error:cds-all:Header/InvalidVersion";
        hdrErrorTitle = "Invalid Version"
     }
     else {
         if (vHdrAsNumber != currEndpointVersion) {
             // Requested version in x-v doesn't match the current endpoint version. 
             // Check x-min-v to see if it is within the range. If absent, or bigger than x-v, set it to x-v
             if ((minVHdr == "undefined") || (minVHdr === null) ||(minVHdr === "")) {
                 minVHdr = vHdr;
             }
             const minVHdrAsNumber = parseInt(minVHdr);
             hdrError = isNaN(minVHdrAsNumber) || (minVHdrAsNumber < 1);
             if (hdrError) {
                 hdrErrorMsg = "x-min-v should be a positive integer"; 
                 hdrErrorCode = "urn:au-cds:error:cds-all:Header/InvalidVersion";
                 hdrErrorTitle = "Invalid Version"
             } 
             else {
              // Acceptable condition: x-min-v <= currEndpointVersion <= x-v
              hdrError =  (minVHdrAsNumber > currEndpointVersion) || (currEndpointVersion > vHdrAsNumber);
              hdrErrorMsg = "Currently supported endpoint version: " + currEndpointVersion;
              hdrErrorCode = "urn:au-cds:error:cds-all:Header/UnsupportedVersion";
              hdrErrorTitle = "Unsupported Version"
              hdrStatusCode = "406";
             }
         }
     }
 }
 var hdrReasonPhrase = (hdrStatusCode == "400") ? "Bad Request" : "Not Acceptable"
 
 context.setVariable("hdrError", hdrError);
 context.setVariable("hdrErrorMsg", hdrErrorMsg);
 context.setVariable("hdrStatusCode", hdrStatusCode);
 context.setVariable("hdrErrorTitle", hdrErrorTitle);
 context.setVariable("hdrErrorCode", hdrErrorCode);
 context.setVariable("hdrReasonPhrase", hdrReasonPhrase);
 

