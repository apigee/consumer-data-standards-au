## Enabling mutual TLS with Holder of Key verification

The [Transaction Security section](https://consumerdatastandardsaustralia.github.io/standards/#transaction-security) of the Consumer Data Standards mandates that mutual TLS (mTLS) be used in conjuction with the Holder of Key (HoK) mechanism on certain endpoints.

When mutual TLS is used by the client on the connection to the token endpoint, the authorization server is able to bind the issued access token to the client certificate. When the client makes a request to a protected resource, it MUST be made over a mutually authenticated TLS connection using the same certificate that was used for mutual TLS at the token endpoint.

This Apigee CDS reference implementation can be optionally configured to enforce mTLS with HoK verification.

### Prerequisites

Your Apigee instance must be configured to work with mTLS. 

#### Configuring mtTLS in Apigee hybrid

If you're using Apigee hybrid, see [Configuring TLS and mTLS on the Istio ingress](https://cloud.google.com/apigee/docs/hybrid/v1.7/ingress-tls).

#### Configuring mtTLS in Apigee X

If you're using Apigee X, this reference implementation includes a script to deploy the necessary artefacts to terminate mTLS in a Google Kubernetes Engine cluster. This deployment fronts Apigee X and is capable of propagating the required client certificate information.

The script will create all the required artefacts (including a GKE cluster, TCP Proxy Load Balancer, client and server certificates, IP address, etc.) such that Apigee X can immediately work with mTLS, and is suitable for a test environment. It is based on [a series of articles in the Google Cloud Apigee community](https://www.googlecloudcommunity.com/gc/Cloud-Product-Articles/Network-and-Envoy-Proxy-Configuration-to-manage-mTLS-on-Apigee-X/ta-p/175146). If you would like to customise this deployment (e.g.: by using your own hostname and server certificates), refer to them. The articles also refer to other deployment alternatives, such as using Google Cloud Compute Engine instances instead of a GKE cluster.

Before you can run the mTLS setup script, you'll need to install the following prerequisites:

- *gcloud*, Google Cloud CLI tool. Installation instructions: https://cloud.google.com/sdk/docs/install
- *jq*. If using Linux, install it by running: sudo apt-get install jq
- *apigeecli*, tool to manage Apigee entities. Download the appropriate binary for your platform from https://github.com/apigee/apigeecli/releases

To run the mTLS setup script:

````bash
cd <REPO_ROOT_DIR>
setup/mtls/setupMTLS-X.sh <CDS_CONFIG_FILE>   # The config file used for deploying the CDS reference implementation on Apigee X / hybrid
````

The script will take 15-30 minutes to run end to end and it will test the correct configuration at the end. Sometimes the configuration takes a little longer than expected to propagate. If the test fails, wait for another 5-10 minutes and re-run the curl command indicated in the script output.


### Enabling Holder of Key verification
Once your Apigee instance is configured to work with mTLS, run the following script to enable mTLS and Holder of Key verification in the CDS reference implementation.

````
cd <REPO_ROOT_DIR>
setup/mtls/enableHoK.sh <CDS_CONFIG_FILE>   # The config file used for deploying the CDS reference implementation on Apigee X / hybrid
````

The reference implementation is now configured to use mTLS with HoK. 

The Postman collection includes a folder for testing HoK verification.


### Using mTLS with HoK verification in a production environment

Note that the reference implementation still accepts one-way TLS connections, which is fine for testing purposes, but shouldn't be the case in a production environment.
In production, only specific endpoints can accept one-way TLS connections, while the rest must only accept mTLS connections.

To enforce that check you'll need to add an additional entry to the Key Value Map used to configure the CDS Reference implementation

````
source <CDS_CONFIG_FILE>   # The config file used for deploying the CDS reference implementation on Apigee X / hybrid
export TOKEN=$(gcloud auth print-access-token)
apigeecli -t "'$TOKEN'" -o $PROJECT -e $APIGEE_ENV kvms entries create --map CDSConfig --key HOK_enforceMTLSOnly --value true 
````


### Disabling Holder of Key Verification

````bash
cd <REPO_ROOT_DIR>
setup/mtls/setupMTLS-X.sh <CDS_CONFIG_FILE>   # The config file used for deploying the CDS reference implementation on Apigee X / hybrid
````

### Removing the artefacts for mTLS in Apigee X

The provided *setpu-mTLS-X.sh* script creates a series of artefacts in GCP, including a GKE Kubernetes cluster, a dedicated IP address, a TCP Proxy Load Balancer, etc.
If you no longer wish to use this configuration, run the following script to remove its artefacts

````bash
cd <REPO_ROOT_DIR>
setup/mtls/undeployMTLS-X.sh <CDS_CONFIG_FILE>   # The config file used for deploying the CDS reference implementation on Apigee X / hybrid
````