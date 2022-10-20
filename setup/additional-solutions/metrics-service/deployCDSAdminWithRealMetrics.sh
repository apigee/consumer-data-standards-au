#/bin/bash

#
# Copyright 2022 Google LLC
#
# Licensed under the Apache License, Version 2.0 (the "License");
# you may not use this file except in compliance with the License.
# You may obtain a copy of the License at
#
#     https://www.apache.org/licenses/LICENSE-2.0
#
# Unless required by applicable law or agreed to in writing, software
# distributed under the License is distributed on an "AS IS" BASIS,
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
# See the License for the specific language governing permissions and
# limitations under the License.
#

### Utility functions

function upload_and_deploy_artefact {
 ARTEFACT_TYPE=$1
 ARTEFACT_NAME=$2
 SVC_ACCOUNT=$3

 if [[ "$ARTEFACT_TYPE" == "apis" ]]; then
    APIGEECLI_SUBCMD="create bundle -z ./$ARTEFACT_NAME.zip"
    ARTEFACT_DESC="apiproxy"
    # Create bundle file
    zip -r $ARTEFACT_NAME.zip apiproxy/* >/dev/null
 else
    APIGEECLI_SUBCMD="create -p ./$ARTEFACT_NAME.zip"
    ARTEFACT_DESC="sharedflow"
    # Create bundle file
    zip -r $ARTEFACT_NAME.zip sharedflowbundle/* >/dev/null
 fi

 SVC_ACCNT_PARAM=""

 if [[ ! -z "$SVC_ACCOUNT" ]]; then
   SVC_ACCNT_PARAM="--sa $SVC_ACCOUNT"
   ARTEFACT_DESC=$ARTEFACT_DESC" using service account: "$SVC_ACCOUNT
 fi

 echo "--->"  Uploading $ARTEFACT_NAME $ARTEFACT_DESC
 ARTEFACT_REV=$(apigeecli $ARTEFACT_TYPE $APIGEECLI_SUBCMD --token $TOKEN --org $APIGEE_ORG --name $ARTEFACT_NAME | grep -v 'WARNING' | jq -r '.revision')
 # Delete bundle file
 rm $ARTEFACT_NAME.zip
 echo "--->"  Deploying $ARTEFACT_NAME $ARTEFACT_DESC - Revision $ARTEFACT_REV 
 apigeecli $ARTEFACT_TYPE deploy --token $TOKEN --org $APIGEE_ORG --env $APIGEE_ENV --ovr --rev $ARTEFACT_REV --name $ARTEFACT_NAME $SVC_ACCNT_PARAM
}

function undeploy_and_optionally_delete_artefact {
 ARTEFACT_TYPE=$1
 ARTEFACT_NAME=$2
 ALSO_DELETE=$3
 # Find revision deployed to environment
 if [[ "$ARTEFACT_TYPE" == "apis" ]]; then
    ARTEFACT_DESC="apiproxy"
 else
    ARTEFACT_DESC="sharedflow"
 fi
 ARTEFACT_REV=$(apigeecli $ARTEFACT_TYPE listdeploy --token $TOKEN --org $APIGEE_ORG  --name $ARTEFACT_NAME | grep -v 'WARNING' | jq -r ".deployments[]? | select(.environment==\"$APIGEE_ENV\") | .revision")
 if [[ -n "$ARTEFACT_REV" ]]; 
 then
   echo "--->"  Undeploying $ARTEFACT_NAME $ARTEFACT_DESC - Revision $ARTEFACT_REV 
   apigeecli $ARTEFACT_TYPE undeploy --token $TOKEN --org $APIGEE_ORG --env $APIGEE_ENV --rev $ARTEFACT_REV --name $ARTEFACT_NAME
 fi
 if [[ "$ALSO_DELETE" == "also_delete" ]]; then
   echo "--->"  Deleting $ARTEFACT_NAME $ARTEFACT_DESC
   apigeecli $ARTEFACT_TYPE delete --token $TOKEN --org $APIGEE_ORG --name $ARTEFACT_NAME
 fi
}

#### End Utility functions


if [ "$#" -ne 0 ]; then
    echo "This script deploys all necessary artefacts to configure a solution capable of collecting and serving metrics from a CDR Reference Implementation"
    echo "Usage: deployCDSAdminWithRealMetrics.sh"
    exit
fi

# Check prerequisites
TEST_GC=$(which gcloud)
if [[ -z "$TEST_GC" ]];
then
    echo "This script requires gcloud, the Google Cloud CLI tool. Installation instructions: https://cloud.google.com/sdk/docs/install"
    exit -1
fi

# Check prerequisites
TEST_JQ=$(which jq)
if [[ -z "$TEST_JQ" ]];
then
    echo "This script requires jq. If using Linux, install it by running: sudo apt-get install jq"
    exit -1
fi

TEST_AP_CLI=$(which apigeecli)
if [[ -z "$TEST_AP_CLI" ]];
then
    echo "This script requires apigeecli. Download the appropriate binary for your platform from https://github.com/apigee/apigeecli/releases"
    exit -1
fi

# Enable required APIs
echo  "--->" Enabling required Google APIs
gcloud config set project $PROJECT
gcloud services enable firestore.googleapis.com
gcloud services enable  cloudscheduler.googleapis.com
gcloud services enable iap.googleapis.com

# Enable Firestore in Datastore mode
echo  "--->" Creating database for metrics service
gcloud alpha firestore databases update --type=datastore-mode --project $PROJECT --quiet

# Enable GAE, ignore if it fails
echo  "--->"  Creating Google App Engine Application....
gcloud app create --region=$GAE_REGION --project=$PROJECT

# Create svc account for CDR Metrics service
METRICS_SVC_ACCOUNT=cdr-metrics@$PROJECT.iam.gserviceaccount.com

echo  "--->" Creating service account for CDR Metrics service: $METRICS_SVC_ACCOUNT
gcloud iam service-accounts create cdr-metrics \
    --description="Service Account for CDR Metrics Service" \
    --display-name="Service Account for CDR Metrics Service"

# Grant role Apigee Analytics Viewer and Datastore User to Svc Account
gcloud projects add-iam-policy-binding $PROJECT \
    --member="serviceAccount:$METRICS_SVC_ACCOUNT" \
    --role="roles/apigee.analyticsViewer" 

gcloud projects add-iam-policy-binding $PROJECT \
    --member="serviceAccount:$METRICS_SVC_ACCOUNT" \
    --role="roles/datastore.user" 

# Deploy CDR Metrics service
cd src/additional-solutions/metrics-service

# Set environment variables in app.yaml
sed -i.orig "s/.*service_account.*/service_account: '$METRICS_SVC_ACCOUNT'   # Edited by deployCDSAdminWithRealMetrics script/" app.yaml
sed -i.bak "s/.*APIGEE_ORG: .*/  APIGEE_ORG: '$APIGEE_ORG'   # Edited by deployCDSAdminWithRealMetrics script/" app.yaml
sed -i.bak "s/.*APIGEE_ENV: .*/  APIGEE_ENV: '$APIGEE_ENV'   # Edited by deployCDSAdminWithRealMetrics script/" app.yaml
sed -i.bak "s/.*RUNTIME_HOST_ALIAS: .*/  RUNTIME_HOST_ALIAS: '$RUNTIME_HOST_ALIAS'   # Edited by deployCDSAdminWithRealMetrics script/" app.yaml

echo "--->" Deploying CDR Metrics service as a Google App Engine service
gcloud app deploy app.yaml --project $PROJECT  --quiet

# Obtain the URL where it was deployed
DEFAULT_GAE_HOST=$(gcloud app describe --project=$PROJECT --format="value(defaultHostname)")
CDR_METRICS_HOST=cdr-metrics-dot-$DEFAULT_GAE_HOST

echo "--->" Creating database indexes
gcloud app deploy index.yaml --project $PROJECT  --quiet

echo "--->" Scheduling CDR Metrics services
gcloud app deploy cron.yaml --project $PROJECT  --quiet

cd ../../..

# Secure GAE Service
echo "--->" Configuring Identity Aware Proxy to secure CDR Metrics service....
gcloud services enable iap.googleapis.com appengine.googleapis.com
# Configure OAuth screen - Set support email to current active user running this deployment - Ignore if already created
gcloud iap oauth-brands create --application_title="CDR Reference implementation" --support_email=$(gcloud config get-value account) --project $PROJECT 
OAUTH_BRAND=$(gcloud iap oauth-brands list --format="value(name)")
# Create Oauth client and capture the client id and secret created
OAUTH_CLIENT_INFO=$(gcloud iap oauth-clients create $OAUTH_BRAND --display_name="IAP-App-Engine-app" --format=json) # grep Created | sed 's#Created \[\(.*\)\]\.#\1#')
OAUTH_CLIENT_ID=$(echo $OAUTH_CLIENT_INFO | jq -r '.name' | sed 's#.*identityAwareProxyClients/##')
OAUTH_CLIENT_SECRET=$(echo $OAUTH_CLIENT_INFO | jq -r '.secret')

# Enable IAM on App Engine
gcloud iap web enable --resource-type=app-engine --oauth2-client-id=$OAUTH_CLIENT_ID --oauth2-client-secret=OAUTH_CLIENT_SECRET
# Allow all users to access the default app engine service (In a CDR reference implmemenation, this is the oidc mock provider)
# IMPORTANT: In order for this to work the "domainRestrictedSharing" organization policy must be set to allow all
gcloud iap web set-iam-policy setup/additional-solutions/metrics-service/iam-policy-bindings/all-users.yaml --resource-type=app-engine --service=default --quiet

# Restrict access to the cdr-metrics service only to the service account previously created. The Apigee proxy accessing the cdr-metrics service will
# execute under this identity
SVC_ACCNT_TMP_FILE=setup/additional-solutions/metrics-service/iam-policy-bindings/svc-accnt.yaml
sed "s/  - allUsers/  - serviceAccount:$METRICS_SVC_ACCOUNT/" setup/additional-solutions/metrics-service/iam-policy-bindings/all-users.yaml > $SVC_ACCNT_TMP_FILE
gcloud iap web set-iam-policy $SVC_ACCNT_TMP_FILE --resource-type=app-engine --service=cdr-metrics --quiet
rm $SVC_ACCNT_TMP_FILE

# Add kvm entry with OAuth Client Id  
echo "---->" Creating entry for OAuthClientId in Apigee Key Value Map
TOKEN=$(gcloud auth print-access-token)
apigeecli kvms entries -t $TOKEN  -o $APIGEE_ORG -e $APIGEE_ENV -m CDSConfig create --key GoogleOAuthClientId --value "$OAUTH_CLIENT_ID"  # 1> /dev/null | echo Added entry for CDS Ref Impl jwks

# Undeploy standard CDS-Admin 
echo "--->" Undeploying CDS-Admin Apiproxy
undeploy_and_optionally_delete_artefact apis CDS-Admin

# Create target server
echo "--->" Creating Target Server cds-metrics-collector
apigeecli targetservers create --token $TOKEN --org $APIGEE_ORG --env $APIGEE_ENV --name cds-metrics-collector --host $CDR_METRICS_HOST --sslinfo true --tls --port 443

# Deploy CDS-AdminWithRealMetrics, configuring it with service account previously created
cd src/apiproxies/admin/CDS-AdminWithRealMetrics
echo "--->" Deploying CDS-AdminWithRealMetrics Apiproxy
upload_and_deploy_artefact apis CDS-AdminWithRealMetrics $METRICS_SVC_ACCOUNT

# Modify CDSAdmin product so that it now points to the right Admin proxy (CDS-AdminWithRealMetrics)
echo "--->"  Updating product CDSAdmin
apigeecli products -t $TOKEN -o $APIGEE_ORG update --name CDSAdmin -p CDS-AdminWithRealMetrics -m Admin --attrs "access=public" -f auto --desc "Get access to Admin APIs" -e $APIGEE_ENV --scopes admin:metadata:update --scopes admin:metrics.basic:read

# Revert to original directory
cd ../../../..

echo "--->" Done