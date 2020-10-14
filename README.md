# [![https://cloud.google.com/apigee/](http://apigee.com/about/sites/all/themes/apigee_themes/apigee_mktg/images/logo.png)](https://cloud.google.com/apigee/)  Consumer Data Standards Australia - Open Banking Reference Implementation

## Overview

The [Consumer Data Standards (CDS)](https://consumerdatastandards.org.au/) have been developed as part of the Australian Government's introduction of the Consumer Data Right legislation to give Australians greater control over their data.

This is a reference implementation of the CDS Banking APIs, also known as *Open Banking Australia*, using the Google Cloud Apigee API Management platform.

This implementation is based on **v1.4** of the standards and currently supports the following Banking APIs

- Get Products
- Get Product Detail
- Get Accounts
- Get Bulk Balances
- Get Balances For Specific Accounts
- Get Account Balance
- Get Account Detail
- Get Transactions For Account
- Get Transaction Detail

as well as the required security endpoints:
- Authorisation
- Token
- Token Refresh
- Token Revocation
- UserInfo
- Introspection
- OpenID Provider Configuration

... administration endpoints:
- Metadata Update
- Get Metrics

... discovery endpoints:
- Get Status
- Get Outages

and dynamic client registration endpoints:
- Register a client using a CDR Register issued Software Statement Assertion
- Get/Update/Delete a Client Registration for a given Client ID


Other APIs will be gradually added, as well as support for Pushed Authorisation Requests (PARs) and Holder of Key (HoK) verification.

This repository includes:
1. A set of reusable artefacts (Shared flows) that implement common functionality mandated by the standards (e.g: check request headers and parameters, include pagination information and self links in responses, etc.). These shared flows can be used in any CDS Banking API implementation
2. API Proxies (*CDS-Products, CDS-Accounts*) as a reference implementation. These API proxies return mock data from a fictional bank, and showcase how to include those reusable artefacts and best practices such as caching of (mock) responses
3. An API proxy (*oidc-mock-provider*) that implements a standalone Open ID Connect Identity Provider, based on the open source package [oidc-provider](https://github.com/panva/node-oidc-provider)
4. An API Proxy (*oidc*) that  highlights one of the multiple patterns in which Apigee can interact with an Identity Provider. In this case, the standalone OIDC provider issues identity tokens, and Apigee issues opaque access and refresh tokens
5. An API Proxy (*CDS-DynamicClientRegistration*) that leverages Apigee client management capabilities to allow Data Recipients to dynamically register with the reference implementation.
6. An API Proxy (*mock-cdr-register*) that mocks the CDR register role in dynamic client registration: Issuing Software Statement Assertions (SSAs) and providing a JWKS to verify these SSAs. 
7. An API Proxy (*mock-adr-client*) that mocks the functionality a client being registered dynamically needs to include: provide a JWKS that can be used to verify a registration request. In addition, to make testing easier, it also has a helper facility to automatically generate such registration requests.

The reference implementation can accelerate Open Banking implementation in multiple ways:
- Quick delivery of a sandbox API environment, returning mock data.
- Reusable artefacts (implemented as shared flows) can be included in real API implementations.
- Leverage the implemented Apigee/Standalone OIDC Provider interaction to kickstart the interaction between Apigee and a real OIDC Provider.
- The Dynamic Client Registration functionality can be reused as is, with perhaps minor changes to adapt to the way dynamic clients are registered with a real OIDC provider.

**This is not an officially supported Google product.**

## Setup

### Pre-requisites
- node.js 
- npm
- jq
	- For MacOS, `brew install jq`
	- See [https://stedolan.github.io/jq/download/](https://stedolan.github.io/jq/download/) for other platforms
- openssl 
- pem-jwk: `npm install -g pem-jwk`

### Installation
1. Install apigeetool
```
npm install --global apigeetool
```
2. Configure environment variables specifying the Apigee organisation and environment where the artefacts will be deployed
```
export APIGEE_ORG=<your-org-name>
export APIGEE_ENV=<your-env-name>
export APIGEE_USER=<your-user-name>
export APIGEE_PASSWORD='<your-password>'   # Make sure to surround your password in single quotes, in case it includes special characters such as '$'
export CDS_TEST_DEVELOPER_EMAIL=<your-email-address>
```
3. Run the following script from the root folder of the cloned repo.
```
./setup/deployOpenBankingAU.sh
```
This script deploys all the required artefacts and also creates a sample test app (registered to the developer provided by the *CDS_TEST_DEVELOPER_EMAIL* variable). 

### Testing the Installation
A Postman collection includes sample requests for the implemented APIs, and for obtaining an access token (including navigating through the mock login and consent pages)

## Portal
You can find an adaptation of the Apigee Developer Kickstart Drupal distribution that works with this reference implementation at [https://github.com/srijanone/OpenBanking-Portal](https://github.com/srijanone/OpenBanking-Portal).
This Distribution lets you quickly try out or get started using Drupal to create an Apigee developer portal. It also has the necessary callbacks required to authenticate/authorise an end user against the standalone OIDC provider included in this reference implementation. 

You can publish APIs into the portal using the OpenAPI specifications found in [specs](./specs)


You can see and try out an actual instance of such a portal at [https://live-cds-au-sandbox.devportal.apigee.io](https://live-cds-au-sandbox.devportal.apigee.io)


## Admin APIs
This reference implementation includes Admin endpoints, *Metadata Update* and *Get Metrics*. These endpoints are meant to be called by the CDR Register only. In order to be able to test these endpoints, the deployment script generates a *Mock* implementation of the Register. The Mock implementation includes a facility to generate such an Admin API request (which is essentially a JWT token signed by the mock CDR register). 

The standards mandate that a token be used only once, so you'll need to generate a new token for each request. 

The Postman collection includes a request to the helper endpoint in the Mock CDR Register (*/mock-cdr-register/adminrequest*) to generate a compliant request.

The reference implementation also includes an optional solution that utilises Apigee Analytics capabilities to return **actual** metrics. For more details see its associated [README.md](./src/additional-solutions/metrics-service/README.md) 


## Shared Flows

There are 13 shared flows that implement common functionality required by the Banking, Admin and dynamic client registration APIs.

1. *check-request-headers*: Makes sure mandatory headers are included in a request, and that headers have acceptable values. 
2. *decide-if-customer-present*: Determines whether a request has a customer present or is unattended. This impact the traffic thresholds and performance SLOs applied to the request. Used by the *check-request-headers* shared flow, but can also be used independently.
3. *validate-request-params*: Implements checks on request parameters: data types, admissible values, etc.
4. *paginate-backend-response*: Returns a subset of the full backend response, according to the pagination parameters included in a request.
5. *add-response-headers-links-meta*: Includes in the response the mandated headers and  "meta" structure in the payload, including self links, pagination links, and pagination information, if applicable.
6. *add-response-fapi-interaction-id*: Includes *x-fapi-interaction-id* header in responses and error messages
7. *apply-traffic-thresholds*: Implements [traffic threshold requirements](https://consumerdatastandardsaustralia.github.io/standards/#traffic-thresholds) for the different types of API requests: public, customer present, and unattended.
8. *collect-performance-slo*: Collects analytics information about the performance tier a request belongs to, and whether it meets its performance SLO. Also records type of token operations (for *customerCount* and *recipientCount* metrics)
9. *validate-cdr-register-token*: Validates JWT Token included in requests to Admin API endpoints, as specified in Section [CDR Register calling Data Holders and Data Recipients](https://consumerdatastandardsaustralia.github.io/standards/#client-authentication) of the Standards
10. *validate-ssa*: Validates a Software Statement Assertion included in a dynamic client registration request, as specified in Section [Dynamic Client Registration](https://cdr-register.github.io/register/#dynamic-client-registration) of the CDR Register standards
11. *check-token-not-reused*: Validates that a JWT token has not been previously seen by caching its JTI claim for a specified amount of time. Used in Register token validation shared flows, as well as dynamic client registration.
12. *get-jwks-from-dynamic-uri*: Retrieves (and caches) a JWKS from a URI. 
13. *authenticate-with-private-key-jwt*: Implements *private_key_jwt*  client authentication method.


There is an additional shared flow, *oidc-replace-auth-code-with-opaque-auth-code*, that implements logic reused in two different oidc endpoints
