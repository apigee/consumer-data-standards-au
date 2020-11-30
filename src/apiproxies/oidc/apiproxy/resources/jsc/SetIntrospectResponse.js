var refreshTokenStatus = context.getVariable("oauthv2refreshtoken.OAInfo-RetrieveRefreshTokenDetails.refresh_token_status");

if (refreshTokenStatus === "approved") {
    context.setVariable("isActive", true);
    var refreshTokenExpiresIn = context.getVariable("oauthv2refreshtoken.OAInfo-RetrieveRefreshTokenDetails.refresh_token_expires_in");
    var date = Date.now();
    var refreshTokenExpiresAt = Math.trunc((date + (refreshTokenExpiresIn * 1000))/1000);
    context.setVariable("tokenExp",refreshTokenExpiresAt);
} else {
    context.setVariable("isActive", false);
    context.setVariable("tokenExp",null);
}