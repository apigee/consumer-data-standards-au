# [![https://cloud.google.com/apigee/](http://apigee.com/about/sites/all/themes/apigee_themes/apigee_mktg/images/logo.png)](https://cloud.google.com/apigee/)  Consumer Data Standards Australia - Open Banking Reference Implementation

## Overview

The [Consumer Data Standards (CDS)](https://consumerdatastandards.org.au/) have been developed as part of the Australian Government's introduction of the Consumer Data Right legislation to give Australians greater control over their data.

This is a reference implementation of the CDS Banking APIs, also known as *Open Banking Australia*, using the Google Cloud Apigee API Management platform.

This implementation is based on **v0.9.5** of the standards and currently supports the following Banking APIs

- Get Products
- Get Product Detail

Other APIs will be gradually added.

This repository includes:
1. A set of reusable artefacts (Shared flows) that implement common functionality mandated by the standards (e.g: check request headers and parameters, include pagination information and self links in responses, etc.). These shared flows can be used in any CDS Banking API implementation
2. An apiproxy as a reference implementation that returns mock data from a fictional bank, and showcases how to include those reusable artefacts

The reference implementation can accelerate Open Banking implementation in two ways:
- Quick delivery of a sandbox API environment, returning mock data.
- Reusable artefacts (implemented as shared flows) can be included in real API implementations.

**This is not an officially supported Google product.**

## Setup

### Pre-requisites
+ node.js 
+ npm

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
```
3. Run the following script from the root folder of the cloned repo.
```
./setup/deployOpenBankingAU.sh
```

## Shared Flows

There are 4 shared flows that implement common functionality required by the Banking APIs.

1. *check-request-headers*: Makes sure mandatory headers are included in a request, and that headers have acceptable values. 
2. *validate-request-params*: Implements checks on request parameters: data types, admissible values, etc
3. *paginate-backend-response*: Returns a subset of the full backend response, according to the pagination parameters included in a request
4. *add-response-headers-links-meta*: Includes in the response the mandated headers and  "meta" structure in the payload, including self links, pagination links, and pagintation information, if applicable.