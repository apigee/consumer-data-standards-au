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
* getOIDCTokenExpiryTime.js
* Convert token expiry time to milliseconds and coerce it to a string 
*  Note: We need to resort to Javascript to coerce the value to a string,
* because the ExtractVariables policy
* with JSONPath retuns a Long type, and that causes an error in the OAuthV2 policy. 
**/

// Convert token expiry time to milliseconds and coerce it to a string 
// Note: We need to resort to Javascript to coerce the value to a string,
// because the ExtractVariables policy
// with JSONPath retuns a Long type, and that causes an error in
// the OAuthV2 policy. 
// Also set the time for the refresh token to expire (in millis)
// When the access token is issued use the requested (or default) sharing duration
// When a token is refreshed, used the refresh_token_expires_in attribute of the existing refresh token 
 var tokenExpiryTime = String(context.getVariable("OIDCTokenResponse.expires_in")) + "000";
 context.setVariable("OIDCTokenExpiryTimeInMillis", tokenExpiryTime);
 
 var refreshTokenExpiryTime = String(context.getVariable("oauthv2authcode.OAInfo-RetrieveOIDCAuthCode.refreshTokenExpiryTimeInSeconds"));
 if ( (refreshTokenExpiryTime !== null) && (refreshTokenExpiryTime !== "") && (refreshTokenExpiryTime != "null")) {
     // This variable will be defined only when the token is being issued in exchange for an auth code
     if (refreshTokenExpiryTime == "0") {
        // Set it to the same duration as the access token. The OAuth policy requires a non-zero value for this parameter
        refreshTokenExpiryTime = tokenExpiryTime;
     }
     else {
         // Append 000 in the end to build the string to represent the expiry time in number of milliseconds
         refreshTokenExpiryTime += "000";
     }
 }
 else {
    // In the refresh token conditional flow, the policy to retrieve the refresh token attributes has been defined
    refreshTokenExpiryTime = String(context.getVariable("oauthv2refreshtoken.OAInfo-RetrieveRefreshTokenDetails.refresh_token_expires_in")) + "000";
 }
 context.setVariable("RefreshTokenExpiryTimeInMillis", refreshTokenExpiryTime);