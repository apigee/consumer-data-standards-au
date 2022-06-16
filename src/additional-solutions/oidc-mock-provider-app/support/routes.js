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
* routes.js
* Implement ineractions required for mock login and consent screens
**/

var debug = require('debug')('oidc-provider:custom-routes')
const {
	urlencoded, json
} = require('express')
const body = urlencoded({
	extended: false
})

module.exports = (app, provider) => {

	//check that the application is up
	app.get('/ping', (req, res) => {
		res.render('ping')
	})

	//get login page
	app.get('/interaction/:grant', async (req, res, next) => {
		try {
			const details = await provider.interactionDetails(req, res)
			debug("In get login page - interaction details: " + JSON.stringify(details));
			return res.render('login', {
				details
			})
		} catch (err) {
			return next(err)
		}
	})



	//submit login
	app.post('/interaction/:grant/login', body, async (req, res, next) => {
		res.set('Pragma', 'no-cache')
		res.set('Cache-Control', 'no-cache, no-store')
		var details = await provider.interactionDetails(req, res);
		// Add login to interaction details
		details.params.login = req.body.login;
		try {
			result = {
				login: {
					account: req.body.login,
					// accountId: req.body.login,
					acr: req.body.acr,
					amr: ['pwd'],
					remember: false,
					ts: Math.floor(Date.now() / 1000),
				}
			}
			// Accept all requested scopes, since we are no longer dealing with scopes here. This will effectively finish the interaction
			// and resume auth flow
			result.consent = {}
			result.consent.acceptedScopes = details.params.scope.split(" ");
			result.consent.rejectedScopes = [];
			// debug("In submit login page -  About to finish interaction interaction - result = " + JSON.stringify(result));
			const redirectTo = await provider.interactionResult(req, res, result)
			const redirectToRelative = redirectTo.replace(/http(s?):\/\/(.*):(\d{4})/g, '')
			debug("In submit login page -  About to redirect to: " + redirectToRelative);
			res.status(302).set({
				Location: redirectToRelative
			}).send()
		} catch (err) {
			next(err)
		}
	})

	// Return oidc compliant hashes for a string
	app.get('/oidc-token-hash/:token', (req, res) => {

		const oidcTokenHash = require('oidc-token-hash');
		const theToken = req.params.token;
		var theAlgorithm = req.query.alg;
		if ((typeof req.query.alg === "undefined") || (theAlgorithm === null) || (theAlgorithm == "")) {
			theAlgorithm = 'PS256';
		}
		var hashedToken = oidcTokenHash.generate(theToken, theAlgorithm);
		debug("Token = " + theToken + " - Hashed value = " + hashedToken + " - Alg = " + theAlgorithm);
		res.status(200).send(hashedToken);
	})

}
