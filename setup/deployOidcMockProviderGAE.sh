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


set -e

pushd $CDSAU_HOME/consumer-data-standards-au/src/additional-solutions/oidc-mock-provider-app

export REGION=europe-west2

gcloud app create --region $REGION

gcloud app deploy app.yaml


# test:
# curl https://$PROJECT.appspot.com

popd
