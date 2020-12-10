var payload = JSON.parse(context.getVariable("response.content"));
payload.sub = context.getVariable("oauthv2accesstoken.OAInfo-RetrieveAccessTokenDetails.accesstoken.customerPPId");
context.setVariable("response.content", JSON.stringify(payload));