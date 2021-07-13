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
* setExpiryTimeForConsent.js
* Sets the epoch time a token should expiry based on a property that indicates the valid period in second
**/

var d = new Date();
var nowInEpochMillis = d.getTime();
var consent_expires_in_millis = Number(properties.validPeriodInSeconds + "000");
var consentExpiresAt = Math.floor( (nowInEpochMillis + consent_expires_in_millis) / 1000);   
print("nowInEpochMillis = " + nowInEpochMillis + " - consent_expires_in_millis = " + consent_expires_in_millis + " - consentExpiresAt = " + consentExpiresAt);
context.setVariable("requestedConsentInfo.expires_at", consentExpiresAt.toString());


 