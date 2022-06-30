/* eslint no-console:off */
const express = require('express')
const Provider = require('oidc-provider')
var configuration = require('./support/config')
const clients = require('./support/clients')
const routes = require('./support/routes')
const account = require('./support/account');
const path = require('path')
const { request } = require('express')
const app = express()
var debug = require('debug')('oidc-provider:main-app')
// Determine whether to run in local mode
localTest = !(process.env.APIGEE_ORGANIZATION) && !(process.env.GOOGLE_CLOUD_PROJECT) && !(process.env.KUBERNETES_SERVICE_HOST);


// Decide how to set the hostname, depending on whether it's running locally, as an Apigee Hosted Target or Google App Engine Application


// In the case of Google App Engine Applications, the URL is $GOOGLE_CLOUD_PROJECT.$REGION.r.appspot.com, but there is now
// way to know at this stage what the region is. We use a hardcoded value, this may need to be adjusted, based on the real
// hostname used when deploying the App Engine App.

var oidcURL;

if (localTest) {
	oidcURL = "http://localhost:9000";
}
else {
	if (process.env.APIGEE_ORGANIZATION) {
	// Running as Apigee Hosted Target
		oidcURL = process.env.OIDC_URL || ("https://" + process.env.APIGEE_ORGANIZATION + "-" + process.env.APIGEE_ENVIRONMENT + ".apigee.net");
	}
	else {
	// GOOGLE_CLOUD_PROJECT is defined. This is being deployed as a Google App Engine App.
	// The URL is $GOOGLE_CLOUD_PROJECT.region.appspot.com, but there is no
	// way to know at this stage what the region is. Once the app is deployed, its hostname can be passed by updating an environment variable.
	// If that env variable is not yet set we use a hardcoded value to begin with.
	    if (!process.env.OIDC_URL || process.env.OIDC_URL=="ToBeAssigned") { 
			// Use a default value
			oidcURL = "https://" + process.env.GOOGLE_CLOUD_PROJECT + ".appspot.com";
		}
		else {
			// The env variable holds the correct hostanme
			oidcURL = "https://" + process.env.OIDC_URL;
		}
	}
}

console.log("oidcURL = " + oidcURL);

// Add required user info claims. These are hardcoded in this function
configuration.findAccount = account.findAccount;
configuration.findById = account.findById;
configuration.clients = clients;
// Change default refresh token behaviour. It should be issued as long as the client is configured to have a grant_type of 'refresh_token'.
configuration.issueRefreshToken = async function issueRefreshToken(ctx, client, code) {
	return client.grantTypeAllowed('refresh_token');
}

// Add function that allows to set secret during dynamic client registration
configuration.features.registration.secretFactory = function secretFactory() {
	return "someMean1ngLessPwdForAClientThatWillN0tBePersisted";
}

// Add function that allows a client to specify a refresh token duration
// When access token is issued for first time, TTL will be specified in query parameter refresh_token_expires_in
// When an access token is refreshed, the remainingTTL will be used
configuration.ttl.RefreshToken = function RefreshTokenTTL(ctx, token, client) {
	if (ctx && ctx.oidc.entities.RotatedRefreshToken) {
		// RefreshTokens do not have infinite expiration through rotation
		debug("In refresh_token grant type - Setting refresh token TTL to " + ctx.oidc.entities.RotatedRefreshToken.remainingTTL);
		return ctx.oidc.entities.RotatedRefreshToken.remainingTTL;
	}
	if ((token.gty = "authorization_code") && (ctx.req.query.refresh_token_expires_in !== null) && (ctx.req.query.refresh_token_expires_in !== '') && (!(isNaN(ctx.req.query.refresh_token_expires_in)))) {
		debug("In authorization_code grant type - Setting refresh token TTL to " + ctx.req.query.refresh_token_expires_in);
		return Number(ctx.req.query.refresh_token_expires_in);
	}
	debug("Returning default TTL = " + 28 * 24 * 60 * 60);
	return 28 * 24 * 60 * 60; // 28 days in seconds
}


const oidc = new Provider(oidcURL, configuration)
app.set('views', path.join(__dirname, 'views'))
app.set('view engine', 'ejs')

// Provider.useRequest()

let server

(async () => {
	// await oidc.initialize({
	// 	clients
	// })
	app.get('/', (req, res) => res.send('Welcome to the Apigee OIDC Mock - Local version - Host header: ' + req.hostname))
	routes(app, oidc)
	app.use('/', oidc.callback)
	app.enable('trust proxy')
	oidc.proxy = true

	server = app.listen(process.env.PORT || 9000, function () {
	    console.log('Listening on port %d', server.address().port)

	})

})().catch((err) => {
	if (server && server.listening) server.close()
	console.error(err)
})
