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

pushd $CDSAU_HOME/$CDSAU_REPO/src/additional-solutions/oidc-mock-provider-app

set +e
gcloud app create --region=$GAE_REGION
set -e

gcloud app deploy app.yaml --quiet


# test:
# curl https://$PROJECT.nw.r.appspot.com

popd

echo "INFO: OIDC MOCK Provider Google App is successfully installed."
echo "INFO: test request: curl https://$PROJECT.nw.r.appspot.com"