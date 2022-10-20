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

# Undeploy CDS-AdminWithRealMetrics
gcloud config set project $PROJECT
TOKEN=$(gcloud auth print-access-token)
echo "--->" Undeploying CDS-AdminWithRealMetrics Apiproxy
undeploy_and_optionally_delete_artefact apis CDS-AdminWithRealMetrics

# Delete target server
echo "--->" Deleting Target Server cds-metrics-collector
apigeecli targetservers delete --token $TOKEN --org $APIGEE_ORG --env $APIGEE_ENV --name cds-metrics-collector

# Delete kvm entry with OAuth Client Id  
echo "---->" Deleting entry for OAuthClientId in Apigee Key Value Map
apigeecli kvms entries -t $TOKEN  -o $APIGEE_ORG -e $APIGEE_ENV -m CDSConfig delete --key GoogleOAuthClientId

# Deploy CDS-Admin proxy
cd src/apiproxies/admin/CDS-Admin
echo "--->" Deploying CDS-Admin
upload_and_deploy_artefact apis CDS-Admin

# Modify CDSAdmin product so that it now points to the right Admin proxy (CDS-Admin)
echo "--->"  Updating product CDSAdmin
apigeecli products -t $TOKEN -o $APIGEE_ORG update --name CDSAdmin -p CDS-Admin -m Admin --attrs "access=public" -f auto --desc "Get access to Admin APIs" -e $APIGEE_ENV --scopes admin:metadata:update --scopes admin:metrics.basic:read

# Revert to original directory
cd ../../../..

# Disable IAP for App Engine
echo "--->" Disabling IAP for App Engine
gcloud iap web disable --resource-type=app-engine

# Delete OAuth Client
echo "--->" Deleting OAuth Client
OAUTH_BRAND=$(gcloud iap oauth-brands list --format="value(name)")
OAUTH_CLIENT_NAME=$(gcloud iap oauth-clients list --format=json $OAUTH_BRAND| jq -r '.[] | select(.displayName=="IAP-App-Engine-app").name')
gcloud iap oauth-clients delete --brand=$OAUTH_BRAND $OAUTH_CLIENT_NAME --quiet

# Undeploy CDR Mettrics App Engine Service
echo "--->" Undeploying CDR Metrics service 
gcloud app services delete cdr-metrics --project $PROJECT  --quiet

# Remove metrics service account
METRICS_SVC_ACCOUNT=cdr-metrics@$PROJECT.iam.gserviceaccount.com
echo "--->" Deleting service account $METRICS_SVC_ACCOUNT
gcloud iam service-accounts delete $METRICS_SVC_ACCOUNT --quiet

echo "--->" Done

