

# Instructions:
# git clone -b 5g $CDSAU_REPO
# cp ./setup/env 
# source cds-au-config-<env>.env
# ./setup/cds-au-setup.sh

set -e

gcloud config set project $PROJECT

$CDSAU_HOME/consumer-data-standards-au/setup/checkPrerequisites.sh

mkdir -p $CDSAU_HOME/bin


mkdir -p $CDSAU_HOME/service-accounts
chmod 0700 $CDSAU_HOME/service-accounts


# apigeetool

curl -LO https://raw.githubusercontent.com/apigee/ahr/main/bin/apigeetool && chmod +x apigeetool
mv apigeetool $CDSAU_HOME/bin



# devrel dependencies

cd $CDSAU_HOME

git clone https://github.com/apigee/devrel.git

# gensfds.sh

cp $CDSAU_HOME/devrel/tools/sf-dependency-list/src/gensfds.sh $CDSAU_HOME/bin


# kvm-admin

cd $CDSAU_HOME/devrel/references/kvm-admin-api

apigeetool deployproxy -o $APIGEE_ORG -e $APIGEE_ENV -n $(basename $PWD)



# create sa with apigee org admin role

gcloud iam service-accounts create $APIGEE_ORG_ADMIN_SA_ID \
    --description="Apigee Org Admin for runtime" \
    --display-name="Apigee Runtime Organization Administrator"

gcloud projects add-iam-policy-binding $PROJECT \
    --member="serviceAccount:$APIGEE_ORG_ADMIN_SA_ID@$PROJECT.iam.gserviceaccount.com" \
    --role="roles/apigee.admin"

# download key
gcloud iam service-accounts keys create $APIGEE_ORG_ADMIN_KEY \
    --iam-account=$APIGEE_ORG_ADMIN_SA_ID@$PROJECT.iam.gserviceaccount.com


# create KVM to hold SA Key
apigeetool createKVMmap -o $APIGEE_ORG -e $APIGEE_ENV --mapName apigee-runtime-sa --encrypted

apigeetool addEntryToKVM -o $APIGEE_ORG -e $APIGEE_ENV --mapName apigee-runtime-sa --entryName apigee-runtime-sa --entryValue "$(cat $APIGEE_ORG_ADMIN_KEY)"


# 



# gcp 
cd $CDSAU_HOME/devrel/references/gcp-sa-auth-shared-flow

apigeetool deploySharedflow -o $APIGEE_ORG -e $APIGEE_ENV -n gcp-sa-auth


cd $CDSAU_HOME



cd $CDSAU_HOME/consumer-data-standards-au


gcloud container clusters get-credentials $CLUSTER --zone $CLUSTER_LOCATION

./setup/deployOidcMockProvider.sh


./setup/deployOpenBankingAU.sh


#./setup/deployCDSAdminWithRealMetrics.sh

