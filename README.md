# [![https://cloud.google.com/apigee/](https://www.gstatic.com/images/branding/product/1x/google_cloud_48dp.png)](https://cloud.google.com/apigee/)  Consumer Data Standards Australia - Open Banking Reference Implementation

## Overview

The [Consumer Data Standards (CDS)](https://consumerdatastandards.org.au/) have been developed as part of the Australian Government's introduction of the Consumer Data Right legislation to give Australians greater control over their data.

This is a reference implementation of the CDS Banking APIs, also known as *Open Banking Australia*, using the Google Cloud Apigee API Management platform.

> __NOTE:__**This reference implementation works with Apigee X or hybrid deployments. Check the [main branch](https://github.com/apigee/consumer-data-standards-au) of this repository for a version that works with Apigee Edge deployments**

This implementation is based on **v1.11** of the standards and currently supports the following Banking APIs

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
- Pushed Authorisation Requests (PARs)
- CDR Arrangement Revocation (Consent revocation)

... administration endpoints:
- Metadata Update
- Get Metrics

... discovery endpoints:
- Get Status
- Get Outages

and dynamic client registration endpoints:
- Register a client using a CDR Register issued Software Statement Assertion
- Get/Update/Delete a Client Registration for a given Client ID

It optionally supports mutual TLS (mTLS) with Holder of Key (HoK) verification. For details on how to enable that feature, see [README.md](./setup/mtls/README.md)

Other APIs will be gradually added.

This repository includes:
1. A set of reusable artefacts (Shared flows) that implement common functionality mandated by the standards (e.g: check request headers and parameters, include pagination information and self links in responses, etc.). These shared flows can be used in any CDS Banking API implementation
2. API Proxies (*CDS-Products, CDS-Accounts*) as a reference implementation. These API proxies return mock data from a fictional bank, and showcase how to include those reusable artefacts and best practices such as caching of (mock) responses
3. An API proxy (*oidc-mock-provider*) that implements a standalone Open ID Connect Identity Provider, based on the open source package [oidc-provider](https://github.com/panva/node-oidc-provider)
5. An API Proxy (*CDS-ConsentMgmtWithKVM*) that provides basic consent management capabilities, including managing consent screens, end user approval and consent revocation by CDR Arrangement ID
6. An API Proxy (*oidc*) that  highlights one of the multiple patterns in which Apigee can interact with an Identity Provider. In this case, the standalone OIDC provider issues identity tokens, and Apigee issues opaque access and refresh tokens. It also interacts with the *CDS-ConsentMgmtWithKVM* proxy to create/modify/revoke consents.
5. An API Proxy (*CDS-DynamicClientRegistration*) that leverages Apigee client management capabilities to allow Data Recipients to dynamically register with the reference implementation.
6. An API Proxy (*mock-cdr-register*) that mocks the CDR register role in dynamic client registration: Issuing Software Statement Assertions (SSAs) and providing a JWKS to verify these SSAs. 
7. An API Proxy (*mock-adr-client*) that mocks the functionality that a client being registered dynamically needs to include: provide a JWKS that can be used to verify a registration request. In addition, to make testing easier, it also has a helper facility to automatically generate such registration requests and create Pushed Authorisation Requests (PARs)

The reference implementation can accelerate Open Banking implementation in multiple ways:
- Quick delivery of a sandbox API environment, returning mock data.
- Reusable artefacts (implemented as shared flows) can be included in real API implementations.
- Leverage the implemented Apigee/Standalone OIDC Provider interaction to kickstart the interaction between Apigee and a real OIDC Provider.
- The Dynamic Client Registration functionality can be reused as is, if Apigee is kept as the source of truth for API clients authentication/authorisation, or with minor changes if the API clients need to be registered in the Identity Provider and/or Consent Management Solution as well.

**This is not an officially supported Google product.**

## Setup

### Pre-requisites
 
 - An Apigee X or Apigee hybrid instance. You will need to run these scripts as a user who has been granted the *Apigee Organization Admin* role
 - Installation scripts run on Linux.

 - Some pre-requisites like `apigeetool` and `gensfds.sh` utilities will be deployed by a bootstrap setup script, but some third party dependencies are your responsibility.
 They will be reported at the beginning of the setup script invocation. You might want to process them proactively.

   Typically, those are commands that needs to be run on a vanilla Debian. Use yum for CentOS/RedHat VMs. For example: 

   ```bash
   sudo apt install -y zip libxml2-utils nodejs npm

   sudo npm install -g pem-jwk
   ```

### Installation

1. Define a project home
   ```bash
   export CDSAU_HOME=<Directory to use>
   mkdir -p $CDSAU_HOME
   ```

1. Clone the *apigee-x* branch of the CDS-AU repository.

   ```sh
   export CDSAU_REPO_URL=https://github.com/apigee/consumer-data-standards-au.git
   export CDSAU_REPO=consumer-data-standards-au
   export CDSAU_BRANCH_5G=apigee-x

   cd $CDSAU_HOME
   git clone -b $CDSAU_BRANCH_5G $CDSAU_REPO_URL
   ```

2. Clone environment configuration file

   ```bash
   cp consumer-data-standards-au/setup/cds-au-config.env .
   ```

3. Populate/edit variables as appropriate. At least:

   * **PROJECT:** The GCP Project associated with the Apigee x/hybrid instance
   * **APIGEE_ENV:** The Apigee environment this reference implementation will be deployed to
   * **RUNTIME_HOST_ALIAS:** The external hostname associated with the Apigee Environment.
   * **GAE_REGION:** Required if you choose to deploy the mock OIDC provider as a Google App Engine service. Choose region from `gcloud app regions list`
   * **CLUSTER:** Required if you choose to deploy the mock OIDC provider as a GKE Kubernetes deployment
   * **CLUSTER_LOCATION:** Required if you choose to deploy the mock OIDC provider as a GKE Kubernetes deployment
   
     ```bash
      vi cds-au-config.env 
     ```


4. Optional. if you want to deploy oidc-mock-provider into a Kubernetes cluster
you need docker to build an image for oidc-mock-provider.

   ```bash
   docker permissions: storage admin
   docker gcloud auth
   docker gcr.io
   gcloud auth configure-docker gcr.io
   ```
4. Source the environment and execute initial setup script
   > __NOTE:__ If you require to capture the output of the commands plus statement tracing information, it is useful to invoke athehe script in the following ways. following way to invoke a script is useful:
   >```sh
   >time bash -x ./setup/cds-au-setup.sh |& tee cds-au-setup-`date -u +"%Y-%m-%dT%H:%M:%SZ"`.log
   
   ```bash
   source $CDSAU_HOME/cds-au-config.env
   cd $CDSAU_HOME/$CDSAU_REPO
   ./setup/cds-au-setup.sh
   ```

5. Deploy the mock OIDC Provider.
   - If deploying OIDC Mock provider as a Google App Engine service, run 
     ```bash
     ./setup/deployOidcMockProviderGAE.sh $CDSAU_HOME/cds-au-config.env 
     ```

    - If deploying OIDC Mock provider as a GKE Kubernetes deployment, run  
      ```bash
      ./setup/deployOidcMockProviderK8s.sh $CDSAU_HOME/cds-au-config.env 
      ```

6. Deploy the Apigee artefacts
   ```bash
   ./setup/deployOpenBankingAU.sh $CDSAU_HOME/cds-au-config.env
   ```

   This script deploys all the required artefacts and also creates a sample test app (registered to the developer provided by the *CDS_TEST_DEVELOPER_EMAIL* variable). 


### Testing the Installation
A Postman collection includes sample requests for the implemented APIs, and for obtaining an access token (including navigating through the mock login and consent pages)


## Admin APIs
This reference implementation includes Admin endpoints, *Metadata Update* and *Get Metrics*. These endpoints are meant to be called by the CDR Register only. In order to be able to test these endpoints, the deployment script generates a *Mock* implementation of the Register and a Test Register Client which needs to authenticate using private key jwts. The Mock implementation includes a facility to generate such a private key jwt.

The Postman collection includes a request to the helper endpoint in the Mock CDR Register (/mock-cdr-register/privatekeyjwt).

The reference implementation also includes an optional solution that utilises Apigee Analytics capabilities to return **actual** metrics. For more details see its associated [README.md](./src/additional-solutions/metrics-service/README.md) 


## Shared Flows

There are 17 shared flows that implement common functionality required by the Banking, Admin and dynamic client registration APIs.

1. *add-response-fapi-interaction-id*: Includes *x-fapi-interaction-id* header in responses and error messages
2. *add-response-headers-links-meta*: Includes in the response the mandated headers and  "meta" structure in the payload, including self links, pagination links, and pagination information, if applicable.
3. *apply-traffic-thresholds*: Implements [traffic threshold requirements](https://consumerdatastandardsaustralia.github.io/standards/#traffic-thresholds) for the different types of API requests: public, customer present, and unattended.
4. *authenticate-with-private-key-jwt*: Implements *private_key_jwt* client authentication method. It can also be used to verify JWT tokens that contain Pushed Authorisation Requests (PARs)
5. *check-request-headers*: Makes sure mandatory headers are included in a request, and that headers have acceptable values. 
6. *check-token-not-reused*: Validates that a JWT token has not been previously seen by caching its JTI claim for a specified amount of time. Used in Register token validation shared flows, as well as dynamic client registration.
7. *collect-performance-slo*: Collects analytics information about the performance tier a request belongs to, and whether it meets its performance SLO. Also records type of token operations (for *customerCount* and *recipientCount* metrics)
8. *decide-if-customer-present*: Determines whether a request has a customer present or is unattended. This impact the traffic thresholds and performance SLOs applied to the request. Used by the *check-request-headers* shared flow, but can also be used independently.
9. *get-jwks-from-dynamic-uri*: Retrieves (and caches) a JWKS from a URI.
10. *get-ppid*: Returns a unique Pairwise Pseudonym Identifier based on a sector and a customer Id. Uses a KVM to persist the generated PPIds. The sector is an attribute of the registered app for a given data receiver, determined at registration time, according to the CDS specifications.
11. *manage-tokens-by-consent-id*: Keeps track of the latest tokens (access and refresh tokens) associated with a given CDR arrangement ID. Can revoke these tokens when a CDR arrangement is revoked (either through Arrangement Revocation API or out of band, on a different channel) 
12. *paginate-backend-response*: Returns a subset of the full backend response, according to the pagination parameters included in a request.
13. *validate-audience-in-jwt*: Validates the audience claim in an authorisation JWT token as specified in version 1.6
14. *validate-request-params*: Implements checks on request parameters: data types, admissible values, etc.
15. *validate-ssa*: Validates a Software Statement Assertion included in a dynamic client registration request, as specified in Section [Dynamic Client Registration](https://cdr-register.github.io/register/#dynamic-client-registration) of the CDR Register standards
16. *verify-idp-id-token*: Verifies the JWT ID token issued by the IDP and stores the relevant claims into variables for reuse
17. *verify-mtls-and-hok*:  Can be configured to check that mTLS is used on a given request, and, if mTLS is used, that the client certificate being presented is the same used for acquiring a token (Holder of Key verification).