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
	urlencoded
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
	app.get('/interaction/:grant', async(req, res, next) => {
		try {
			const details = await provider.interactionDetails(req)
			debug("In get login page - interaction details: " + JSON.stringify(details));
			return res.render('login', {
				details
			})
		} catch (err) {
			return next(err)
		}
	})



	//submit login
	app.post('/interaction/:grant/login', body, async(req, res, next) => {
		res.set('Pragma', 'no-cache')
		res.set('Cache-Control', 'no-cache, no-store')
		debug("In submit login page - account: " + req.body.login + " - acr: " + req.body.acr);
		var details = await provider.interactionDetails(req);
		// Add login to interaction details
		details.params.login = req.body.login;
		try {

			const result = {
				account: req.body.login,
				acr: req.body.acr
			}
			await provider.setProviderSession(req, res, result)
			res.status(302).set({
				Location: '/interaction/' + req.params.grant + '/consent'
			}).send()
		} catch (err) {
			next(err)
		}
	})

	//get consent
	app.get('/interaction/:grant/consent', body, async(req, res, next) => {
		try {
			const details = await provider.interactionDetails(req)
			debug("In get consent page - acr: " + details.params.acr_values + " - account: " + details.params.login);
			return res.render('consent', {
				details,
			})
		} catch (err) {
			return next(err)
		}
	})

	//submit consent
	app.post('/interaction/:grant/consent', body, async(req, res, next) => {
			res.set('Pragma', 'no-cache')
			res.set('Cache-Control', 'no-cache, no-store')
				// Iterate over the consent checkboxes and adjust the scope accordingly
			var acceptedScopes = ["openid", "profile"];
			var rejectedScopes = [];		

		try {
			// Iterate over the requested scopes
			const details = await provider.interactionDetails(req)
			requestedScopes = details.params.scope.split(" ");
			requestedScopes.forEach(function rejectOrAcceptScope(value, index, array) {
					// If the checkbox with the same name as the scope is checked, add to the accepted scope,s otherwise to rejected scopes
					// openid profile will alwyas be accepted
					if ((value != "openid") && (value != "profile")) {
						if (req.body[value]) {
							acceptedScopes.push(value);
						} else {
							debug("Rejecting scope: " + value);
							rejectedScopes.push(value);
						}
					}
			});
			const result = {
				login: {
					account: req.body.account,
					acr: req.body.acr,
					amr: ['pwd'],
					remember: false,
					ts: Math.floor(Date.now() / 1000),
				},
			}
			result.consent = {}
			result.consent.acceptedScopes = acceptedScopes;
			result.consent.rejectedScopes = rejectedScopes;

			const redirectTo = await provider.interactionResult(req, res, result)
			const redirectToRelative = redirectTo.replace(/http(s?):\/\/(.*):(\d{4})/g, '')
			res.status(302).set({
				Location: redirectToRelative
			}).send()
		} catch (err) {
			next(err)
		}
	})

}
