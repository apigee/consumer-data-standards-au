
var redirect_uri = context.getVariable("private.apigee_redirect_uri");
var url = "https://" + context.getVariable("private.okta_org") + "/oauth2/default/v1/authorize?client_id=" + context.getVariable("private.apigee_client_id") + "&response_type=code id_token&redirect_uri="+redirect_uri+"&nonce="+context.getVariable("nonce")+"&state="+context.getVariable("stateStr")+"&scope="+context.getVariable("scope")+" offline_access&response_mode=form_post&max_age="+context.getVariable("max_age");
context.setVariable("redirectURL",url);