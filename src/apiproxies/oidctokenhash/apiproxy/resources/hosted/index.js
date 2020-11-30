var oidcTokenHash = require('oidc-token-hash');
var express = require('express')
var bodyParser = require('body-parser')

var app = express()

// parse application/x-www-form-urlencoded
app.use(bodyParser.urlencoded({     // to support URL-encoded bodies
  extended: true
})); 

app.post('/', async (req, res) => {
  var hash = await oidcTokenHash.generate(req.body.data, 'RS256');
  res.setHeader('Content-Type', 'application/json');
  res.end(JSON.stringify({ hash: hash }));
})

var server = app.listen(process.env.PORT);





