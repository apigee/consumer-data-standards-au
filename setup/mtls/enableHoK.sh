
# This script enables Holder of Key verification in the CDS Reference Implementation

if [ "$#" -ne 1 ]; then
    echo "This script enables Holder of Key verification in the CDS Reference Implementation"
    echo "Usage: enableHoK.sh CONFIG_FILE"
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
gcloud config set project $PROJECT
export TOKEN=$(gcloud auth print-access-token)

# Check prerequisite
if [[ -z "$RUNTIME_MTLS_HOST_ALIAS" ]];
then
    echo "No RUNTIME_MTLS_HOST_ALIAS defined in config file $CONFIG_FILE. Make sure MTLS is enabled for your Apigee instance, update the config file and try again"
    exit -1
fi

echo "========================================================================="
echo "--> Adding HoK related entries to CDSConfig KVM..."
echo "========================================================================="

# Add mtls hostname to KVM
apigeecli -t $TOKEN -o $PROJECT -e $APIGEE_ENV kvms entries create --map CDSConfig --key HOK_mtlsHostname --value $RUNTIME_MTLS_HOST_ALIAS 
# Add standard hostname to KVM
apigeecli -t $TOKEN -o $PROJECT -e $APIGEE_ENV kvms entries create --map CDSConfig --key HOK_stdHostname --value $RUNTIME_HOST_ALIAS

echo "============================================================================================================================================"
echo "--> HoK Verification enabled in test mode. If you later wish to use this in production mode please execute the following commands:         ="
echo '-->   export TOKEN=$(gcloud auth print-access-token)                                                                                       ='
echo "-->   apigeecli -t " '$TOKEN' "-o $PROJECT -e $APIGEE_ENV kvms entries create --map CDSConfig --key HOK_enforceMTLSOnly --value true       ="
echo "============================================================================================================================================"