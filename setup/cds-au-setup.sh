

# Instructions:
# git clone -b 5g $CDSAU_REPO
# cp ./setup/env 
# source cds-au-config-<env>.env
# ./setup/cds-au-setup.sh

set -e

gcloud config set project $PROJECT

mkdir -p $CDSAU_HOME/bin


mkdir -p $CDSAU_HOME/service-accounts
chmod 0700 $CDSAU_HOME/service-accounts


echo "INFO: Download apigeetool to $CDSA_HOME/bin directory..."

curl -LO https://raw.githubusercontent.com/apigee/ahr/main/bin/apigeetool && chmod +x apigeetool
mv apigeetool $CDSAU_HOME/bin



echo "INFO: Clone devrel and install its dependencies (gensfds.sh, gcp-sa-auth-shared-flow, kvm-admin-api)..."

cd $CDSAU_HOME

set +e
git clone https://github.com/apigee/devrel.git
set -e

# gensfds.sh

cp $CDSAU_HOME/devrel/tools/sf-dependency-list/src/gensfds.sh $CDSAU_HOME/bin


$CDSAU_HOME/$CDSAU_REPO/setup/checkPrerequisites.sh


echo "INFO: Deploy gcp-sa-auth proxy shared flow..."

cd $CDSAU_HOME/devrel/references/gcp-sa-auth-shared-flow

apigeetool deploySharedflow -o $APIGEE_ORG -e $APIGEE_ENV -n gcp-sa-auth


echo "INFO: Deploy kvm-admin proxy..."

cd $CDSAU_HOME/devrel/references/kvm-admin-api

apigeetool deployproxy -o $APIGEE_ORG -e $APIGEE_ENV -n $(basename $PWD)



echo "INFO: Create sa with apigee org admin role and download its key file..."
set +e

gcloud iam service-accounts create $APIGEE_ORG_ADMIN_SA_ID \
    --description="Apigee Org Admin for runtime" \
    --display-name="Apigee Runtime Organization Administrator"

gcloud projects add-iam-policy-binding $PROJECT \
    --member="serviceAccount:$APIGEE_ORG_ADMIN_SA_ID@$PROJECT.iam.gserviceaccount.com" \
    --role="roles/apigee.admin" > /dev/null

# download key
gcloud iam service-accounts keys create $APIGEE_ORG_ADMIN_KEY \
    --iam-account=$APIGEE_ORG_ADMIN_SA_ID@$PROJECT.iam.gserviceaccount.com
set -e

echo "INFO: Create KVM to hold SA Key and populate its entry..."

apigeetool createKVMmap -o $APIGEE_ORG -e $APIGEE_ENV --mapName apigee-runtime-sa --encrypted

apigeetool addEntryToKVM -o $APIGEE_ORG -e $APIGEE_ENV --mapName apigee-runtime-sa --entryName apigee-runtime-sa --entryValue "$(cat $APIGEE_ORG_ADMIN_KEY)"

echo "INFO: cds-au prerequisites are installed."
