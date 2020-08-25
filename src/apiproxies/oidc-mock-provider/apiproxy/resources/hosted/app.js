/* eslint no-console:off */
const express = require('express')
const Provider = require('oidc-provider')
const configuration = require('./support/config')
const clients = require('./support/clients')
const routes = require('./support/routes')
const account = require('./support/account');
const path = require('path')
const app = express()
	// Determine whether to run in local mode
localTest = !(process.env.APIGEE_ORGANIZATION);

const oidcURL = (localTest) ? "http://localhost:9000" : process.env.OIDC_URL || ("https://" + process.env.APIGEE_ORGANIZATION + "-" + process.env.APIGEE_ENVIRONMENT + ".apigee.net");

// Add required user info claims. These are hardcoded in this function
configuration.findAccount = account.findAccount;
configuration.findById = account.findById;


const oidc = new Provider(oidcURL, configuration)

app.set('views', path.join(__dirname, 'views'))
app.set('view engine', 'ejs')
Provider.useRequest()

let server

	(async() => {
	await oidc.initialize({
		clients
	})
	app.get('/', (req, res) => res.send('Welcome to the Apigee OIDC Mock - Local version'))
	routes(app, oidc)
	app.use(oidc.callback)
	app.enable('trust proxy')
	oidc.proxy = true

	server = app.listen(process.env.PORT || 9000, function() {
		console.log('Listening on port %d', server.address().port)
		
	})

})().catch((err) => {
	if (server && server.listening) server.close()
	console.error(err)
})
