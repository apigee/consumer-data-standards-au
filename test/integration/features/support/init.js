/**
  Copyright 2020 Google LLC

  Licensed under the Apache License, Version 2.0 (the "License");
  you may not use this file except in compliance with the License.
  You may obtain a copy of the License at

      https://www.apache.org/licenses/LICENSE-2.0

  Unless required by applicable law or agreed to in writing, software
  distributed under the License is distributed on an "AS IS" BASIS,
  WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
  See the License for the specific language governing permissions and
  limitations under the License.

*/
const apickli = require('apickli')
const {
  Before,
  setDefaultTimeout
} = require('@cucumber/cucumber')

const hostname = process.env.RUNTIME_HOST_ALIAS
const clientId = process.env.CLIENTID
const clientSecret = 'dummy-client_secret-456'
const basePath = process.env.TEST_BASE_PATH || "";

console.log( "hostname: " + hostname );
console.log( "clientId: " + clientId );

Before(function() {
  this.apickli = new apickli.Apickli('https', hostname + basePath)
  this.apickli.scenarioVariables.hostname = hostname
  this.apickli.scenarioVariables.clientId = clientId
  this.apickli.scenarioVariables.clientSecret = clientSecret
})

setDefaultTimeout(60 * 1000)
