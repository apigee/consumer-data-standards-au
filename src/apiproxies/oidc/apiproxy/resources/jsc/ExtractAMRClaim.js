var amr = context.getVariable("jwt.Decode-OIDC-ID-Token.decoded.claim.amr"); 
var check2fa = amr.indexOf(",");
if (check2fa === -1) {
    context.setVariable("acr","urn:cds.au:cdr:2");
} else {
    context.setVariable("acr","urn:cds.au:cdr:3");
} 