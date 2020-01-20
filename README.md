# [![https://cloud.google.com/apigee/](http://apigee.com/about/sites/all/themes/apigee_themes/apigee_mktg/images/logo.png)](https://cloud.google.com/apigee/)  Consumer Data Standards Australia - Open Banking Reference Implementation

## Overview

The [Consumer Data Standards (CDS)](https://consumerdatastandards.org.au/) have been developed as part of the Australian Government's introduction of the Consumer Data Right legislation to give Australians greater control over their data.

This is a reference implementation of the CDS Banking APIs, also known as *Open Banking Australia*, using the Google Cloud Apigee API Management platform.

This implementation is based on **v1.1.1** of the standards and currently supports the following Banking APIs

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

Other APIs will be gradually added.

This repository includes:
1. A set of reusable artefacts (Shared flows) that implement common functionality mandated by the standards (e.g: check request headers and parameters, include pagination information and self links in responses, etc.). These shared flows can be used in any CDS Banking API implementation
2. API Proxies (*CDS-Products, CDS-Accounts*) as a reference implementation. These API proxies return mock data from a fictional bank, and showcase how to include those reusable artefacts
3. An API proxy (*oidc-mock-provider*) that implements a standalone Open ID Connect Identity Provider, based on the open source package [oidc-provider](https://github.com/panva/node-oidc-provider)
3. An API Proxy (*oidc*) that  highlights one of the multiple patterns in which Apigee can interact with an Identity Provider. In this case, the standalone OIDC provider issues identity tokens, and Apigee issues opaque access and refresh tokens

The reference implementation can accelerate Open Banking implementation in multiple ways:
- Quick delivery of a sandbox API environment, returning mock data.
- Reusable artefacts (implemented as shared flows) can be included in real API implementations.
- Leverage the implemented Apigee/Standalone OIDC Provider interaction to kickstart the interaction between Apigee and a real OIDC Provider.

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


## Shared Flows

There are 7 shared flows that implement common functionality required by the Banking APIs.

1. *check-request-headers*: Makes sure mandatory headers are included in a request, and that headers have acceptable values. 
3. *decide-if-customer-present*: Determines whether a request has a customer present or is unattended. This impact the traffic thresholds and performance SLOs applied to the request. Used by the *check-request-headers* shared flow, but can also be used independently.
4. *validate-request-params*: Implements checks on request parameters: data types, admissible values, etc.
5. *paginate-backend-response*: Returns a subset of the full backend response, according to the pagination parameters included in a request.
6. *add-response-headers-links-meta*: Includes in the response the mandated headers and  "meta" structure in the payload, including self links, pagination links, and pagintation information, if applicable.
7. *apply-traffic-thresholds*: Implements [traffic threshold requirements](https://consumerdatastandardsaustralia.github.io/standards/#traffic-thresholds) for the different types of API requests: public, customer present, and unattended.
8. *collect-performance-slo*: Collects analytics information about the performance tier a request belongs to, and whether it meets its performance SLO.

There is an additional shared flow, *oidc-replace-auth-code-with-opaque-auth-code*, that implements logic reused in two different oidc endpoints
