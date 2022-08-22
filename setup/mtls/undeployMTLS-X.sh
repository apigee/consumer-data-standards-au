
# This script undeploys mtls support for ApigeeX 

if [ "$#" -ne 1 ]; then
    echo "This script removes MTLS support for an Apigee X instance"
    echo "Usage: undeployMTLS-X.sh CONFIG_FILE"
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

CONFIG_FILE=$1
# Get absolute path to config file
export CONFIG_FILE_ABS_PATH=$(echo "$(cd "$(dirname "$CONFIG_FILE")" && pwd)/$(basename "$CONFIG_FILE")")

source $CONFIG_FILE_ABS_PATH
gcloud config set project $PROJECT
gcloud container clusters get-credentials $CLUSTER --zone $CLUSTER_LOCATION
export TOKEN=$(gcloud auth print-access-token)

# Check prerequisite
if [[ -z "$RUNTIME_MTLS_HOST_ALIAS" ]];
then
    echo "No RUNTIME_MTLS_HOST_ALIAS defined in config file $CONFIG_FILE. Please define it and try again"
    exit -1
fi

read -p "Warning! This script will remove TCP Load balancer and k8s cluster $CLUSTER and all its artefacts. Do you want to continue ? [Y/n]: " -n 1 -r REPLY; printf "\n"
REPLY=${REPLY:-Y}

if [[ "$REPLY" =~ ^[Yy]$ ]]; then
 echo "========================================================================="
 echo "--> Starting MTLS undeploy process..."
 echo "========================================================================="
else
 exit 1
fi

# Remove HOK specific entries from CDS Config KVM
echo "========================================================================="
echo "--> Removing HoK related entries from CDSConfig KVM..."
echo "========================================================================="
# Temporary workaround as apigeecli kvms entries delete is not working
# apigeecli -t $TOKEN -o $PROJECT -e $APIGEE_ENV kvms entries delete --map CDSConfig --key HOK_mtlsHostname 
# apigeecli -t $TOKEN -o $PROJECT -e $APIGEE_ENV kvms entries delete --map CDSConfig --key HOK_stdHostname
# apigeecli -t $TOKEN -o $PROJECT -e $APIGEE_ENV kvms entries delete --map CDSConfig --keyHOK_enforceMTLSOnly
curl --request DELETE https://apigee.googleapis.com/v1/organizations/$PROJECT/environments/$APIGEE_ENV/keyvaluemaps/CDSConfig/entries/HOK_mtlsHostname \
--header "Authorization: Bearer $TOKEN"
curl --request DELETE https://apigee.googleapis.com/v1/organizations/$PROJECT/environments/$APIGEE_ENV/keyvaluemaps/CDSConfig/entries/HOK_stdHostname \
--header "Authorization: Bearer $TOKEN"
curl --request DELETE https://apigee.googleapis.com/v1/organizations/$PROJECT/environments/$APIGEE_ENV/keyvaluemaps/CDSConfig/entries/HOK_enforceMTLSOnly \
--header "Authorization: Bearer $TOKEN"

# Remove runtine mtls host from env group 
echo "================================================================================="
echo "--> Removing mtls hostname $RUNTIME_MTLS_HOST_ALIAS from Apigee environment group .. "
echo "================================================================================="
# Get existing hosts, remove mtls host and update 
ALL_OTHER_HOSTNAMES=$(apigeecli -t $TOKEN -o $PROJECT envgroups get --name $APIGEE_ENV_GROUP | grep -v WARNING | jq -r '.hostnames[]' | grep -v $RUNTIME_MTLS_HOST_ALIAS | tr  '\n' ',' | sed 's/.$//')
echo ALL_OTHER_HOSTNAMES = $ALL_OTHER_HOSTNAMES
apigeecli -t $TOKEN -o $PROJECT envgroups update -n eval-group --hosts "$ALL_OTHER_HOSTNAMES"

# Delete TCP Proxy Load Balancer
echo "========================================================================="
echo "--> Removing TCP Proxy Load Balancer .. "
echo "========================================================================="
gcloud compute forwarding-rules delete my-tcp-lb-ipv4-forwarding-rule --global --quiet
gcloud compute target-tcp-proxies delete my-tcp-lb-target-proxy --quiet
export NEG=$(gcloud compute network-endpoint-groups list --format=json | jq -r '.[0].name')
gcloud compute backend-services remove-backend my-tcp-lb --global \
--network-endpoint-group $NEG \
--network-endpoint-group-zone $CLUSTER_LOCATION --quiet
gcloud compute backend-services delete my-tcp-lb --global --quiet
gcloud compute firewall-rules delete allow-tcplb-and-health --quiet
gcloud compute health-checks delete my-tcp-health-check --quiet

# Delete k8s envoy proxy deployment and its associated secrets and config map
echo "========================================================================="
echo "--> Removing k8s envoy deployment .. "
echo "========================================================================="
kubectl delete -f setup/mtls/standalone-envoy-manifest.yaml
echo "========================================================================="
echo "--> Removing associated k8s configmap and secrets .. "
echo "========================================================================="
kubectl delete configmap -n apigee standalone-envoy-config
kubectl delete secret -n apigee envoy-secret ca-secret
kubectl delete namespace apigee

# Release IP address
echo "========================================================================="
echo "--> Releasing global IP address used for mTLS ingress..."
echo "========================================================================="
gcloud compute addresses delete tcp-lb-static-ipv4 --global --quiet

# Delete cluster
echo "========================================================================="
echo "--> Deleting cluster $CLUSTER in zone $CLUSTER_LOCATION...."
echo "========================================================================="
gcloud container clusters delete $CLUSTER --zone=$CLUSTER_LOCATION --quiet




