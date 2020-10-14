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
 * setRedirectURIs.js
 * Based on query params redirect_uri, build a string of all the redirect uris. Provide a default value if none found.
 *  */
 
 const numParams = context.getVariable("request.queryparam.redirect_uri.values.count");
 switch(numParams) {
  case 0:
    // None provided. Add default value
    context.setVariable("redirectURIs", context.getVariable("baseURI") + "/redirect");
    break;
  case 1:
     // Just one param provided
    context.setVariable("redirectURIs", context.getVariable("request.queryparam.redirect_uri"));
    break;
  default:
    var redirectURIParamsValues = String(context.getVariable("request.queryparam.redirect_uri.values"));
    // Format is [redirect1, redirect2] (No quotes in individual strings.) Remove square brackets
    var redirectString = redirectURIParamsValues.substr(1,redirectURIParamsValues.length - 2);
    context.setVariable("redirectURIs", redirectString);
}
 