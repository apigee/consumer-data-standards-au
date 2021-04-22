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
* addBasePathToCookiesPath.js
* The OIDC provider set Cookies for the login interaction. Add /mock-oidc to the cookies path, so that the user agent sends those cookies back whenever it
* redirects to the login interaction
**/

function replaceInHeader(hdrName,searchStr, replStr) {
 for (var i = 1; i <= context.getVariable("message.header."+hdrName+".values.count"); i++) {
     currHdr = context.getVariable("message.header."+hdrName+"." + i);
    //  print("Header " + i + " = |" + currHdr + "|");
     newHdr = currHdr.replace(searchStr,replStr);
    //  print("New value = |" + newHdr+ "|");
     context.setVariable("message.header."+hdrName+"." + i, newHdr);
 }
}

replaceInHeader('Set-Cookie','path=/', 'path='+context.getVariable("proxy.basepath")+'/');