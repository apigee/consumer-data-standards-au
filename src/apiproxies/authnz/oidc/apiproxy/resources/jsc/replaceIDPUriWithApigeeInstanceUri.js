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
* replaceIDPUriWithApigeeInstanceUri.js
* The OIDC provider reports endpoints using its hostname
* Replace it with the Apigee instance hostname
* Also, make sure the MTLS protected endpoints use the MTLS hostname
**/

var payload = JSON.parse(context.getVariable("response.content"));
var mtlsHostname = context.getVariable("private.mtlsHostname");
const standardHostname = context.getVariable("standardHostname");
const idpUri = context.getVariable("private.IDPUri");
// If no entry is found for mtlsHostname (because mTLS is not enabled in this instance) use the standardHostname
if ( (mtlsHostname === null) || (mtlsHostname === "") ) {
    mtlsHostname = standardHostname;
}


// Treat mtlsEndpoints as a string because the JS interpreter does not support Array.includes 
const mtlsEndpoints = "introspection_endpoint|registration_endpoint|revocation_endpoint|token_endpoint|userinfo_endpoint|pushed_authorization_request_endpoint";

Object.keys(payload).forEach(function (key) {
    if ((key == "jwks_uri") || (key == "issuer") || key.endsWith("endpoint")) {
        // The attributes that need to be changed are jwks_uri, issuer and any whose name
        // finishes in endpoint
        // We'll replace the idpURI with either the standardHostname, or mtlHostname, for mtlsEndpoints
        var targetHostname = mtlsEndpoints.includes(key) ? mtlsHostname : standardHostname
        payload[key] = payload[key].replace(idpUri, "https://" + targetHostname);
    }
});

context.setVariable("response.content", JSON.stringify(payload));



