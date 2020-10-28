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
* substituteWithOpaqueAccessTokenInResponse.js
* Replace the OIDC Access and refresh tokens with the newly issued opaque AccessToken and Refresh Token
* Also insert the refresh_token_expires_at claim, using the exp claim found in the OIDC issued Refresh Token
* as well as the cdr Arrangement Id (Which represents a unique consent)
**/

var theGrantType = context.getVariable("TokenRequestParams.grant_type");
// Extract access and refresh tokens from the result of executing the corresponding OAuthV2 policy: generate or refresh token
var executedOAuthV2PolicyName = (theGrantType === "authorization_code")? "OA-IssueOpaqueAccessToken" : "OA-RefreshOpaqueAccessToken";
var thePayload =  JSON.parse(context.getVariable("response.content"));

thePayload.access_token = context.getVariable("oauthv2accesstoken." + executedOAuthV2PolicyName + ".access_token");
thePayload.refresh_token = context.getVariable("oauthv2accesstoken." + executedOAuthV2PolicyName + ".refresh_token");
thePayload.refresh_token_expirest_at = context.getVariable("jwt.JWT-DecodeOIDCRefreshToken.decoded.claim.exp");
thePayload.sharing_expires_at = thePayload.refresh_token_expirest_at;
thePayload.cdr_arrangement_id = context.getVariable("cdrArrangementId");
context.setVariable("response.content", JSON.stringify(thePayload));

// Also remove the temporarily reinstated authorization header (required for OAuthV2 policy)
context.removeVariable("response.header.authorization");
 