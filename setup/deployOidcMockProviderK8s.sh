#!/usr/bin/env bash
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

# deploy oidc-mock-provider app to a Kubernetes cluster


# current directory assumption: <repo-root-folder>

# dependencies:
# utils: gcloud docker npm kubectl

set -e

if [ "$#" -ne 1 ]; then
    echo "This script deploys a mock OIDC Identity provider for the CDS reference implementation as a Google App Engine service"
    echo "Usage: deployOidcMockProviderK8s.sh CONFIG_FILE"
    exit
fi

CONFIG_FILE=$1
# Get absolute path to config file
export CONFIG_FILE_ABS_PATH=$(echo "$(cd "$(dirname "$CONFIG_FILE")" && pwd)/$(basename "$CONFIG_FILE")")



# permissions for kubectl
gcloud container clusters get-credentials $CLUSTER --zone $CLUSTER_LOCATION


# build a docker image

pushd src/additional-solutions/oidc-mock-provider-app

npm i --package-lock-only

docker build -t gcr.io/$PROJECT/oidc-mock-provider:1.0 .

# to run locally:
# docker run -it -p 9000:9000 gcr.io/$PROJECT/oidc-mock-provider:1.0

# to test
# curl -X GET http://localhost:9000


gcloud auth configure-docker
docker -- push gcr.io/$PROJECT/oidc-mock-provider:1.0

popd


# deploy the app

pushd src/additional-solutions/oidc-mock-provider-k8s

envsubst < oidc-mock-provider-deployment.tyaml > oidc-mock-provider-deployment.yaml


kubectl apply -f oidc-mock-provider-deployment.yaml
kubectl apply -f oidc-mock-provider-service.yaml

gcloud compute addresses create oidc-ip --global

export GTM_IP=$(gcloud compute addresses describe oidc-ip --format="get(address)" --global --project "$PROJECT")
export GTM_HOST_ALIAS=$(echo "$GTM_IP" | tr '.' '-').nip.io

echo "INFO: External IP: Create Google Managed SSL Certificate for FQDN: $GTM_HOST_ALIAS"


envsubst < oidc-managed-cert.tyaml > oidc-managed-cert.yaml

kubectl apply -f oidc-managed-cert.yaml

echo "WARNING:cert provisioning takes about ~11 minutes"


kubectl apply -f oidc-ingress.yaml

# Update the environment configuration file with the hostname value
sed -i.bak "s/.*OIDC_PROVIDER_HOST_ALIAS.*/export OIDC_PROVIDER_HOST_ALIAS=$GTM_HOST_ALIAS/" $CONFIG_FILE_ABS_PATH
sed -i.bak 's/.*OIDC Mock Provider ALIAS.*/# OIDC Mock Provider ALIAS - Edited by deployOidcMockProvider script/' $CONFIG_FILE_ABS_PATH

# test:
# curl https://$GTM_HOST_ALIAS


popd
