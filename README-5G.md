# Open Banking Reference Implementation for Apigee 5G

PR readiness state: WIP: 90%

## TODO:

[ ] remove oidc mock proxies from 5g branch

[ ] deploy oidc mock provider to app engine

[ ] refactor docker as a separate install; it might be considered extra hassle  to setup docker et all if not really required

[ ] final compare of proxy states

[ ] metrics server not touched

[ ] ahr: add nip.io gxlbs



## Quick Start


1. Define Repository URL. Useful for development.

```bash
export CDSAU_REPO=git@github.com:yuriylesyuk/consumer-data-standards-au.git
```

1. Define a project home
```bash
export CDSAU_HOME=~/cds-au-qwiklabs

mkdir -p $CDSAU_HOME
```

1. Clone the 5g branch of the CDS-AU repository

```bash
cd $CDSAU_HOME

git clone -b 5g $CDSAU_REPO
```

2. Clone environment configuration file

```bash
cp consumer-data-standards-au/setup/cds-au-config.env .
```

3. Populate/edit variables as appropriate. At least:

* PROJECT
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


4. You need docker to build an image for oidc-mock-provider

docker permissions: storage admin
docker gcloud auth
docker gcr.io
   gcloud auth configure-docker gcr.io
>>>>>


```bash
source $CDSAU_HOME/cds-au-config.env

cd consumer-data-standards-au
./setup/cds-au-setup.sh
```
