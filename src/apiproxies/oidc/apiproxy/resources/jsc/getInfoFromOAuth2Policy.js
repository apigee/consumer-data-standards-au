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
* getInfoFromOAuth2Policy.js
* Extract access and refresh tokens from the result of executing the corresponding OAuthV2 policy: generate or refresh token
* Also calculate when the refresh token will expire at in Epoch (seconds)
**/

var theGrantType = context.getVariable("TokenRequestParams.grant_type");
// Extract access and refresh tokens from the result of executing the corresponding OAuthV2 policy: generate or refresh token
var executedOAuthV2PolicyName = (theGrantType === "authorization_code")? "OA-IssueOpaqueAccessToken" : "OA-RefreshOpaqueAccessToken";

the_access_token = context.getVariable("oauthv2accesstoken." + executedOAuthV2PolicyName + ".access_token");
access_token_expires_in = context.getVariable("oauthv2accesstoken." + executedOAuthV2PolicyName + ".expires_in");
the_refresh_token = context.getVariable("oauthv2accesstoken." + executedOAuthV2PolicyName + ".refresh_token");
var d = new Date();
var nowInEpochMillis = d.getTime();
// The default expiration time for a refresh token is 2419200 seconds (A month) - Take away 100ms to be safe
var refreshTokenExpiresAt = Math.floor( (nowInEpochMillis + 2419199900) / 1000);
context.setVariable("theAccessToken", the_access_token);
context.setVariable("theRefreshToken", the_refresh_token);
context.setVariable("accessTokenExpiresIn", access_token_expires_in);
context.setVariable("refreshTokenExpiresAt", refreshTokenExpiresAt.toString());


 