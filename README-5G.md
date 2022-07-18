# Open Banking Reference Implementation for Apigee 5G

PR readiness state: WIP: 90%

## TODO:

[ ] remove oidc mock proxies from 5g branch

[x] deploy oidc mock provider to app engine

[ ] tie the oidc hostname with invocation points

[x] refactor docker as a separate install; it might be considered extra hassle  to setup docker et all if not really required

[x] final compare of proxy states

[ ] metrics server not touched

[ ] ./setup/deployCDSAdminWithRealMetrics.sh

## Quick Start


1. Define Repository URL. Useful for development.

```sh
# export CDSAU_REPO=git@github.com:yuriylesyuk/consumer-data-standards-au.git
export CDSAU_REPO_URL=https://github.com/yuriylesyuk/consumer-data-standards-au.git
export CDSAU_REPO=consumer-data-standards-au
export CDSAU_BRANCH_5G=5g
```

or for an internal repo:

```sh
export CDSAU_REPO_URL=sso://team/apigee-openbank-dev/openbank-aus
export CDSAU_REPO=openbank-aus
export CDSAU_BRANCH_5G=apigee-x
```



1. Define a project home
```bash
export CDSAU_HOME=~/cds-au-qwiklabs

mkdir -p $CDSAU_HOME
```

1. Clone the 5g branch of the CDS-AU repository

```bash
cd $CDSAU_HOME

git clone -b $CDSAU_BRANCH_5G $CDSAU_REPO_URL
```

2. Clone environment configuration file

```bash
cp consumer-data-standards-au/setup/cds-au-config.env .
```

3. Populate/edit variables as appropriate. At least:

* PROJECT
* GAE_REGION
* APIGEE_ENV
* CLUSTER
* CLUSTER_LOCATION
* RUNTIME_HOST_ALIAS

```bash
vi cds-au-config.env 
```

4. WARNING: Some prerequisites like `apigeetool` and `gensfds.sh` utilities will be deployed by a bootstrap setup script, but some third party dependencies are your responsibility.
 They will be reported at the beginning of the setup script invocation. You might want to process them proactively.

Typically, those are commands that needs to be run on a vanilla Debian. Use yum for CentOS/RedHat VMs.

```bash
sudo apt install -y zip libxml2-utils nodejs npm

sudo npm install -g pem-jwk
```





4. Source the environment and execute script


__NOTE:__ if you want to deploy oidc-mock-provider into a Kubernetes cluster
you need docker to build an image for oidc-mock-provider.
Use `setup/deployOidcMockProviderK8s.sh` script.

```bash
docker permissions: storage admin
docker gcloud auth
docker gcr.io
   gcloud auth configure-docker gcr.io
```

> __NOTE:__ When is required to capture the output of the commands plus statement tracing information, following way to invoke a script is useful:
> ```sh
> time bash -x ./setup/cds-au-setup.sh |& tee cds-au-setup-`date -u +"%Y-%m-%dT%H:%M:%SZ"`.log
> ```

```bash
source $CDSAU_HOME/cds-au-config.env

cd $CDSAU_HOME/$CDSAU_REPO

./setup/cds-au-setup.sh
./setup/deployOidcMockProviderGAE.sh <PATH_TO_ENV_CONFIG_FILE>
./setup/deployOpenBankingAU.sh
./setup/deployCDSAdminWithRealMetrics.sh

```
