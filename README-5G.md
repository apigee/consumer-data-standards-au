# Open Banking Reference Implementation for Apigee 5G

## Quick Start


1. Clone the 5g branch of the CDS-AU repository

```bash
git clone -b 5g $CDSAU_REPO
```

2. Clone environment configuration file

```bash
cp ./setup/cds-au-config.env cds-au-config-<env>.env 
```

3. Edit variables as appropriate

```bash
vi cds-au-config-<env>.env 
```

4. Source the environment and execute script


```bash
source cds-au-config-<env>.env
./setup/cds-au-setup.sh
```
