var stateCache = context.getVariable("stateCache");
var stateCacheArr = stateCache.split("&");
context.setVariable("client_id", stateCacheArr[0]);
context.setVariable("redirect_uri", stateCacheArr[1]);
context.setVariable("scope", stateCacheArr[2]);
context.setVariable("nonce", stateCacheArr[3]);
