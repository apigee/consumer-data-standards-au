const {
  Given,
  When,
  Then,
  After
} = require('@cucumber/cucumber')

Then(/^I store response body as (.*) in scenario scope$/, function(variableName, callback) {

    const value = this.apickli.getResponseObject().body;
    this.apickli.storeValueInScenarioScope( variableName, value );

    callback();
});

Then(/^I clear request$/, function( callback) {

    this.apickli.headers = {};
    this.apickli.formParameters = {};
    this.apickli.requestBody = '';
    this.apickli.httpRequestOptions = {};
    this.apickli.queryParameters = {};

    callback();
});
