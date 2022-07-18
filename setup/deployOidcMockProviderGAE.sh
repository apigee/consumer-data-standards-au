#!/usr/bin/env bash

# deploy oidc-mock-provider app as a Google App Engine app


# current directory assumption: <repo-root-folder>

# dependencies:
# utils: gcloud
# 
# roles:
# roles/appengine.appCreator # create app
# roles/appengine.appAdmin # admin app
# roles/storage.admin
# roles/cloudbuild.builds.editor

if [ "$#" -ne 1 ]; then
    echo "This script deploys a mock OIDC Identity provider for the CDS reference implementation as a Google App Engine service"
    echo "Usage: deployOidcMockProviderGAE.sh CONFIG_FILE"
    exit
fi

CONFIG_FILE=$1
# Get absolute path to config file
export CONFIG_FILE_ABS_PATH=$(echo "$(cd "$(dirname "$CONFIG_FILE")" && pwd)/$(basename "$CONFIG_FILE")")

# Enable Cloud Build APIs
echo "========================================================================="
echo "--> Enabling required GCP APIs..."
echo "----> Enabling Cloud Build APIs ..."
echo "========================================================================="
gcloud services enable cloudbuild.googleapis.com 

set -e

# Generate RSA Private/public key pair to be used by Apigee when signing JWT ID Tokens to generate the client entry for Apigee in OIDC Mock Provider
mkdir -p setup/certs
setup/generate_private_public_key_pair.sh CDSRefImpl "CDS Reference Implementation to be used when signing JWT Tokens" setup/certs

# Create a new entry in the OIDC provider client configuration for Apigee,
# so that it is recognised by the OIDC provider as a client
echo "--->"  "Creating new entry in OIDC Provider configuration for Apigee"
# Generate a random key and secret
CDSREFIMPL_OIDC_CLIENT_ID=$(openssl rand -hex 16)
CDSREFIMPL_OIDC_CLIENT_SECRET=$(openssl rand -hex 16)
CDSREFIMPL_JWKS=`cat setup/certs/CDSRefImpl.jwks`
APIGEE_CLIENT_ENTRY=$(echo '[{ "client_id": "'$CDSREFIMPL_OIDC_CLIENT_ID'", "client_secret": "'$CDSREFIMPL_OIDC_CLIENT_SECRET'", "redirect_uris": ["https://'$RUNTIME_HOST_ALIAS'/authorise-cb"], "response_modes": ["form_post"], "response_types": ["code id_token"], "grant_types": ["authorization_code", "client_credentials","refresh_token","implicit"], "token_endpoint_auth_method": "client_secret_basic","jwks": '$CDSREFIMPL_JWKS'}]')

pushd ./src/additional-solutions/oidc-mock-provider-app

echo $APIGEE_CLIENT_ENTRY > ./support/clients.json

echo Entry created...


set +e
gcloud app create --region=$GAE_REGION --project=$PROJECT
set -e

gcloud app deploy app.yaml --project=$PROJECT --quiet

# Obtain the URL where it was deployed
OIDC_PROVIDER_HOST_ALIAS=$(gcloud app describe --project=$PROJECT --format="value(defaultHostname)")

# Update the app configuration file with this value as an environment variable
sed -i '' "s/.*OIDC_URL.*/  OIDC_URL: '$OIDC_PROVIDER_HOST_ALIAS'   # Edited by deployOidcMockProvider script/" app.yaml 

# Deploy once more, so that the mock oidc provider can now be configured with the proper hostname
echo "... Updating configuration values and redeploying..."
gcloud app deploy app.yaml --project=$PROJECT --quiet

popd

# Update the environment configuration file with this value
sed -i '' "s/.*OIDC_PROVIDER_HOST_ALIAS.*/export OIDC_PROVIDER_HOST_ALIAS=$OIDC_PROVIDER_HOST_ALIAS/" $CONFIG_FILE_ABS_PATH
sed -i '' 's/.*OIDC Mock Provider ALIAS.*/# OIDC Mock Provider ALIAS - Edited by deployOidcMockProvider script/' $CONFIG_FILE_ABS_PATH

echo "INFO: OIDC MOCK Provider Google App is successfully installed. Hostname = $OIDC_PROVIDER_HOST_ALIAS"
echo "INFO: test request: curl https://$OIDC_PROVIDER_HOST_ALIAS"