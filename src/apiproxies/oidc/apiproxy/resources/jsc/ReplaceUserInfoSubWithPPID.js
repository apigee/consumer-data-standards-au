var payload = JSON.parse(context.getVariable("response.content"));
payload.sub = context.getVariable("oauthv2accesstoken.OAInfo-RetrieveAccessTokenDetails.accesstoken.customerPPId");
payload.preferred_username = payload.given_name;
context.setVariable("response.content", JSON.stringify(payload));