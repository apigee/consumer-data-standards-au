var refreshTokenStatus = context.getVariable("oauthv2refreshtoken.OAInfo-RetrieveRefreshTokenDetails.refresh_token_status");

if (refreshTokenStatus === "approved") {
    context.setVariable("isActive", true);
    var refreshTokenExpiresAt = Math.trunc(Date.now()/1000) + Number(context.getVariable("oauthv2refreshtoken.OAInfo-RetrieveRefreshTokenDetails.refresh_token_expires_in"));
    context.setVariable("tokenExp",refreshTokenExpiresAt.toString());
} else {
    context.setVariable("isActive", false);
    context.setVariable("tokenExp",null);
}