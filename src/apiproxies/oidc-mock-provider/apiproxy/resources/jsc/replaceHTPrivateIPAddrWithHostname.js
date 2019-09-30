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
* replaceHTPrivateIPAddrWithHostname.js
* The OIDC provider reports endpoints using its private IP Address
* Replace them with the proxy hostname (which is reported as "issuer"
* in the OIDC provider anyway) + the proxy basepath
**/

var payload = JSON.parse(context.getVariable("response.content"))
var issuerHostname= payload.issuer;
var fullProxyPath = payload.issuer + context.getVariable("proxy.basepath");

// We also need to remove registration endpoint. Even though it is disabled
// the OIDC provider still reports it
delete payload["registration_endpoint"];

var privateIPAddr = payload.authorization_endpoint.substring(0,payload.authorization_endpoint.indexOf("/authorise"));

Object.keys(payload).forEach(function (key) {
    if ((key == "jwks_uri") || key.endsWith("endpoint")) {
        // The attributes that need to be changed are jwks_uri and any whose name
        // finishes in endpoint
        payload[key] = payload[key].replace(privateIPAddr, fullProxyPath);
    }
});

context.setVariable("response.content", JSON.stringify(payload));



