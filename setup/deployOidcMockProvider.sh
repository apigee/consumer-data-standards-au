#!/usr/bin/env bash

# deploy oidc-mock-provider app to a Kubernetes cluster


# current directory assumption: setup

# dependencies:
# utils: gcloud docker npm kubectl

set -e

# build a docker image

pushd ../src/additional-solutions/oidc-mock-provider-app

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

pushd ../src/additional-solutions/oidc-mock-provider-k8s

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

# test:
# curl https://$GTM_HOST_ALIAS


popd
