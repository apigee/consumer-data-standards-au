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
* account.js
* Implement mock customer id claims (First name, last name, full name)
**/
var debug = require('debug')('oidc-provider:account')
const store = new Map();
const nanoid = require('nanoid');

class Account {
  constructor(id) {
    this.accountId = id || nanoid();
    store.set(this.accountId, this);
  }

  /**
   * @param use - can either be "id_token" or "userinfo", depending on
   *   where the specific claims are intended to be put in.
   * @param scope - the intended scope, while oidc-provider will mask
   *   claims depending on the scope automatically you might want to skip
   *   loading some claims from external resources etc. based on this detail
   *   or not return them in id tokens but only userinfo and so on.
   */
  async claims(use, scope) { // eslint-disable-line no-unused-vars
	  var theClaims = {
      sub: this.accountId, // it is essential to always return a sub claim
      family_name: 'Mendes',
      given_name: 'Maria',
      name: 'Maria Mendes',
      cpf: '43908445778',
      updated_at: 1564617600
     };
	 return theClaims;
  }
  
  static async findById(ctx, id, token) {
      if (!store.get(id)) {
        new Account(id);
      }

      return store.get(id);
    }

  static async findAccount(ctx, id, token) { // eslint-disable-line no-unused-vars
    // token is a reference to the token used for which a given account is being loaded,
    //   it is undefined in scenarios where account claims are returned from authorization endpoint
    // ctx is the koa request context
    if (!store.get(id)) new Account(id); // eslint-disable-line no-new
    return store.get(id);
  }
}

module.exports = Account;

