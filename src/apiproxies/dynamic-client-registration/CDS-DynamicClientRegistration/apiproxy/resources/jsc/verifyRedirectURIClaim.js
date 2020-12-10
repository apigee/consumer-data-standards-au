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
 * verifyRedirectURIClaim.js
 * Checks that the redirect_uris claim in the request meets the following criteria:
 * 1) There is only one redirect_uri (Apigee does not support more than one)
 * 2) The redirect_uri is listed in the redirect_uris claim in the SSA
 */
 
 var redirectURIsInRequest = JSON.parse(context.getVariable("jwt.JWT-VerifyJWTInRequestBody.decoded.claim.redirect_uris"));
 var error_msg;
 var error_found = false;
 if (redirectURIsInRequest === undefined)  {
     error_msg = "Missing redirect_uris claim";
     error_found = true;
 } else if (!(Array.isArray(redirectURIsInRequest))) {
     error_msg = "redirect_uris claim must contain an array";
     error_found = true; 
 } else if (redirectURIsInRequest.length === 0 ) {
     error_msg = "redirect_uris claim must contain a non-empty array";
     error_found = true; 
 } else if (redirectURIsInRequest.length > 1 ) {
     error_msg = "redirect_uris claim must contain an array with a single uri";
     error_found = true; 
 } else {
     redirectURIsInSSA= JSON.parse(context.getVariable("ADRDetailsFromSSA.redirect_uris"));
     var theRedirectURIInReq = redirectURIsInRequest[0];
     var URIFound = false;
     var i = 0;
     while ( (i < redirectURIsInSSA.length) && (!URIFound)) {
        URIFound = ( redirectURIsInSSA[i] ==  theRedirectURIInReq);
        // print(" i = " + i + " - redirectURIInSSA[i] = "  + redirectURIsInSSA[i] + " - URIfound = " + URIFound);
        i++;
     }
     if (!URIFound) {
         error_msg ="redirect_uris claim must contain a URI defined in the Software Statement Assertion (SSA)";
         error_found = true;
     }
 }
 
//  print("Finished verifying redirect_uris - error_found = " + error_found + " - error_msg = " + error_msg + " - redirectURIInRequest = " + theRedirectURIInReq);
 context.setVariable("errorInRedirectURIs",error_found);
 context.setVariable("messageForErrorInRedirectURIs",error_msg);
 context.setVariable("redirectURIInRequest",theRedirectURIInReq);
 
 