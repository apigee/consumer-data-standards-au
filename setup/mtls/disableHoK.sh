
# This script disables Holder of Key verification in the CDS Reference Implementation

if [ "$#" -ne 1 ]; then
    echo "This script disables Holder of Key verification in the CDS Reference Implementation"
    echo "Usage: disableHoK.sh CONFIG_FILE"
    exit
fi

# Check prerequisites
TEST_GC=$(which gcloud)
if [[ -z "$TEST_GC" ]];
then
    echo "This script requires gcloud, the Google Cloud CLI tool. Installation instructions: https://cloud.google.com/sdk/docs/install"
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
export TOKEN=$(gcloud auth print-access-token)

# Check prerequisite
if [[ -z "$RUNTIME_MTLS_HOST_ALIAS" ]];
then
    echo "No RUNTIME_MTLS_HOST_ALIAS defined in config file $CONFIG_FILE. Please define it and try again"
    exit -1
fi

echo "========================================================================="
echo "--> Removing HoK related entries from CDSConfig KVM..."
echo "========================================================================="

apigeecli -t $TOKEN -o $PROJECT -e $APIGEE_ENV kvms entries delete --map CDSConfig --key HOK_mtlsHostname 
apigeecli -t $TOKEN -o $PROJECT -e $APIGEE_ENV kvms entries delete --map CDSConfig --key HOK_stdHostname
apigeecli -t $TOKEN -o $PROJECT -e $APIGEE_ENV kvms entries delete --map CDSConfig --key HOK_enforceMTLSOnly

echo "----> Done"
