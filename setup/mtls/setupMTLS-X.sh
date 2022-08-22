
# This script enables mtls support for ApigeeX 
# The script does the following
# 1 - Creates a K8s cluster
# 2 - Reserves an IP address to be used for the MTLS ingress
# 3 - Creates a self-signed certificate to be used by the MTLS ingress
# 4 - Deploys an envoy proxy to the k8s cluster configured to 
#      a) only accept mTLS connections (CDSTestApp certificate added to its truststore)
#      b) present the self-signed certificate as its server certificate
#      b) propagate client certificate information (specifically certificate fingerprint) into headers
#      c) forward requests into the ApigeeX private IP address
# 5 - Creates a TCP load balancer to forward requests from the IP address to then envoy proxy
# 6 - Add a hostname associated with the above IP address to the Apigee X environment group

if [ "$#" -ne 1 ]; then
    echo "This script enables MTLS support for an Apigee X instance"
    echo "Usage: setupMTLS-X.sh CONFIG_FILE"
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
export TOKEN=$(gcloud auth print-access-token)

echo "========================================================================="
echo "--> Checking network for cluster creation .. "

# If NETWORK variable is not defined use the first network in the list
if [[ -z "$NETWORK" ]];
then
    NETWORK=$(gcloud compute networks list --format="value(name)" | head -1)
    echo "----> No NETWORK variable predefined. Setting NETWORK=$NETWORK"
fi

# If SUBNETWORK variable is not defined use the first subnetwork in for NETWORK
if [[ -z "$SUBNETWORK" ]];
then
    SUBNETWORK=$(gcloud compute networks subnets list --network $NETWORK --format="value(name)" | head -1)
    echo "----> No SUBNETWORK variable predefined. Setting SUBNETWORK=$SUBNETWORK"
fi
echo "========================================================================="

# Create cluster
echo "========================================================================="
echo "--> Creating cluster $CLUSTER in zone $CLUSTER_LOCATION...."
echo "========================================================================="
gcloud container clusters create $CLUSTER \
--machine-type=e2-standard-4 \
--enable-ip-alias \
--network=$NETWORK \
--subnetwork=$SUBNETWORK --zone=$CLUSTER_LOCATION

gcloud container clusters get-credentials $CLUSTER --zone $CLUSTER_LOCATION

kubectl create namespace apigee

# Reserve IP address and create self-signed managed certificate before configuring envoy
echo "========================================================================="
echo "--> Reserving global IP address to be used for mTLS ingress..."
echo "========================================================================="
gcloud compute addresses create tcp-lb-static-ipv4 \
--ip-version=IPV4 \
--global
export IPV4_ADDRESS=$(gcloud compute addresses list --format=json | jq -r '.[] | select( .name | contains("tcp-lb-static-ipv4")) | .address')
# Generate a fantasy hostname for this IP address - Since it uses the IP Address just generated and the nip.io domain, it will automatically
# be resolved to this IP address
export RUNTIME_MTLS_HOST_ALIAS="mtls-eval-group."$(echo "$IPV4_ADDRESS" | tr '.' '-')".nip.io"


# Generate server certificate for RefImpl - Reuse keys generated during initial deploy of CDS reference implementation
echo "========================================================================="
echo "--> Generating server certificate to be used in mTLS ingress "
echo "========================================================================="
openssl req -new -key setup/certs/CDSRefImpl_rsa_private.pem -out setup/certs/CDSRefImpl.csr -subj "/CN=$RUNTIME_MTLS_HOST_ALIAS" -outform PEM
openssl x509 -req -in setup/certs/CDSRefImpl.csr -signkey setup/certs/CDSRefImpl_rsa_private.pem  -set_serial 100 -days 365 -out setup/certs/CDSRefImpl.crt

# Create k8s secret for client certificate trustore - Add the client certificate created during initial deploy of CDS reference implementation
echo "========================================================================="
echo "--> Generating k8s secrets to store server certificates and truststore.. "
echo "========================================================================="
kubectl create secret -n apigee tls ca-secret \
  --cert=setup/certs/CDSTestApp.crt \
  --key=setup/certs/CDSTestApp_rsa_private.pem

# Create k8s secret for server certificate
kubectl create secret -n apigee tls envoy-secret \
  --cert=setup/certs/CDSRefImpl.crt \
  --key=setup/certs/CDSRefImpl_rsa_private.pem

# Obtain private IP address for Apigee X ingress. 
export APIGEE_ENDPOINT=$(apigeecli -t $TOKEN -o $PROJECT instances list |  grep -v 'WARNING' | jq -r '.instances[0].host') 

# Create config map with envoy config - This will use the APIGEE_ENDPOINT just obtained as well as the  MTLS hostname
echo "========================================================================="
echo "--> Generating k8s configmap with envoy proxy configuration .. "
echo "========================================================================="
( echo "cat << EOF" ; cat setup/mtls/envoy-config-template.yaml ; echo EOF ) | sh > setup/mtls/standalone-envoy-config.yaml
kubectl create configmap -n apigee standalone-envoy-config \
--from-file=setup/mtls/standalone-envoy-config.yaml

echo "========================================================================="
echo "--> Creating k8s envoy deployment .. "
echo "========================================================================="
kubectl apply -f setup/mtls/standalone-envoy-manifest.yaml


# Create TCP Proxy Load Balancer
echo "========================================================================="
echo "--> Creating TCP Proxy Load Balancer .. "
echo "========================================================================="
gcloud compute health-checks create tcp my-tcp-health-check --port 8443

gcloud compute firewall-rules create allow-tcplb-and-health \
--source-ranges 130.211.0.0/22,35.191.0.0/16 \
--network=$NETWORK \
--allow tcp:8443

gcloud compute backend-services create my-tcp-lb \
--global-health-checks \
--global \
--protocol TCP \
--health-checks my-tcp-health-check \
--timeout 5m

export NEG=$(gcloud compute network-endpoint-groups list --format=json | jq -r '.[0].name')
gcloud compute backend-services add-backend my-tcp-lb \
--global \
--network-endpoint-group $NEG \
--network-endpoint-group-zone $CLUSTER_LOCATION \
--balancing-mode CONNECTION \
--max-connections 100000

gcloud compute target-tcp-proxies create my-tcp-lb-target-proxy \
--backend-service my-tcp-lb \
--proxy-header NONE

gcloud compute forwarding-rules create my-tcp-lb-ipv4-forwarding-rule \
--global \
--target-tcp-proxy my-tcp-lb-target-proxy \
--address tcp-lb-static-ipv4 \
--ports 443

# Add runtine mtls host to env group 
# Get existing hosts, add mtls host
echo "================================================================================="
echo "--> Adding mtls hostname $RUNTIME_MTLS_HOST_ALIAS to Apigee environment group .. "
echo "================================================================================="
EXISTING_HOSTNAMES=$(apigeecli -t $TOKEN -o $PROJECT envgroups get --name $APIGEE_ENV_GROUP | grep -v WARNING | jq -r '.hostnames[]' | tr '\n' ',')
apigeecli -t $TOKEN -o $PROJECT envgroups update -n eval-group --hosts "$EXISTING_HOSTNAMES""$RUNTIME_MTLS_HOST_ALIAS"

# Add runtime MTLS hostname to environment configuration file
sed -i.bak "s/.*RUNTIME_MTLS_HOST_ALIAS.*/export RUNTIME_MTLS_HOST_ALIAS=$RUNTIME_MTLS_HOST_ALIAS # Edited by setupMTLS-X script/" $CONFIG_FILE_ABS_PATH


# Test
echo "========================================================================="
echo "--> Testing MTLS setup .. "
echo "========================================================================="
sleep 30 # Wait for a bit for config to propagate
RESULT=$(curl  -q --cert setup/certs/CDSTestApp.crt --key setup/certs/CDSTestApp_rsa_private.pem --cacert setup/certs/CDSRefImpl.crt https://$RUNTIME_MTLS_HOST_ALIAS/hello-world)
if [[ $RESULT == 'Hello, Guest!' ]]
then
  echo "========================================================================="
  echo "--> MTLS successfully enabled for Apigee X - You can test it by sending the following request:"
  echo "-->   curl -v  --cert setup/certs/CDSTestApp.crt --key setup/certs/CDSTestApp_rsa_private.pem --cacert setup/certs/CDSRefImpl.crt https://$RUNTIME_MTLS_HOST_ALIAS/hello-world"
  echo "--> Sending the following request should fail, as no client certificate is included: "
  echo "-->   curl -v --cacert setup/certs/CDSRefImpl.crt https://$RUNTIME_MTLS_HOST_ALIAS/hello-world"
  echo "========================================================================="
else
  echo "========================================================================="
  echo "--> There was a problem enabling MTLS for Apigee X - Try again in 30 seconds or later by issuing the following request:"
  echo "-->   curl -v  --cert setup/certs/CDSTestApp.crt --key setup/certs/CDSTestApp_rsa_private.pem --cacert setup/certs/CDSRefImpl.crt https://$RUNTIME_MTLS_HOST_ALIAS/hello-world"
  echo "========================================================================="
fi
