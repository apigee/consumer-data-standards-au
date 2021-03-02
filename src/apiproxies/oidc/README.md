
This API Proxy (*oidc*) implements one of the multiple patterns in which Apigee can interact with an Identity Provider. In this case, it interacts with a standalone OIDC provider that issues identity tokens, while Apigee issues opaque access and refresh tokens. Apigee is the source of truth for API clients(Apps), while the OIDC provider is the source of truth for end users.

The following sequence diagram illustrates in detail this interaction pattern.

![Sample Apigee Interaction with OIDC Provider](./CDR-ApigeeInteractionWithOIDCProvider.png "Sample Apigee Interaction with OIDC Provider")