// Replace the OIDC Auth Code with the newly issued opaque AuthCode
// Depending on the type of response the OIDC Provider sent, 
// this will be in the location header (resp code 302) or the payload (resp code 200)
 
 var whereIsAuthCode =  (context.getVariable("response.status.code") == "200") ? "response.content" :"response.header.location"
 var infoToSet = context.getVariable(whereIsAuthCode);
 var newAuthCode = context.getVariable("oauthv2authcode.OA-IssueOpaqueAuthCode.code");
 var newInfo = infoToSet.replace(context.getVariable("OIDCAuthCode"),newAuthCode);
 context.setVariable(whereIsAuthCode, newInfo);
 
 // Finally set the content type back to HTML for when the response is form post
 
 if (context.getVariable("response.status.code") == "200") {
     context.setVariable("response.header.content-type","text/html; charset=utf-8");
 }