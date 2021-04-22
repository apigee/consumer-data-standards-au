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
 * addOptionalClaimsIfPresent.js
 * Add optional additional claims if query params are present 
 *  */
 
 var additionalClaims = JSON.parse(context.getVariable("additionalClaimsVar"));
 print("Before - Additional Claims = " + JSON.stringify(additionalClaims));
 const sharing_duration_str = context.getVariable("request.queryparam.sharing_duration")
 const sharing_duration = Number(sharing_duration_str);
 const cdr_arrangement_id = context.getVariable("request.queryparam.cdr_arrangement_id");
 print("sharing_duration_str = " + sharing_duration_str + " - sharing_duration = " + sharing_duration + " - cdr_arrangement_id = " + cdr_arrangement_id);
 if ( (sharing_duration_str !== null) && (sharing_duration_str !== "") && ( !(isNaN(sharing_duration)) ) ) {
     additionalClaims.claims["sharing_duration"] = sharing_duration;
 }
 if ( (cdr_arrangement_id !== null) && ( cdr_arrangement_id !== "" ) ) {
     additionalClaims.claims["cdr_arrangement_id"] = cdr_arrangement_id;
 }
 print("After - Additional Claims = " + JSON.stringify(additionalClaims));
 context.setVariable("additionalClaimsVar", JSON.stringify(additionalClaims));