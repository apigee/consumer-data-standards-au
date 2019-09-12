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
// Also calculate the refreshToken expiry time in millis, based on the exp claim 
// in the refresh token issued by the OIDC provider
 var tokenExpiryTime = String(context.getVariable("OIDCTokenResponse.expires_in")) + "000";
 context.setVariable("OIDCTokenExpiryTimeInMillis", tokenExpiryTime);
  // Tmp calculations
var refreshTokenExpiryEpochMillis = Number(context.getVariable("jwt.JWT-DecodeOIDCRefreshToken.decoded.claim.exp") + "000");
var refreshTokenExpiryAsDate = new Date(refreshTokenExpiryEpochMillis);
var refreshTokenExpiresInMillis = refreshTokenExpiryAsDate - (new Date());
context.setVariable("refreshTokenExpiresInMillis", String(refreshTokenExpiresInMillis));