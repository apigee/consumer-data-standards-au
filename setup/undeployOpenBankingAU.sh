#/bin/bash


#
# Copyright 2018 Google LLC
#
# Licensed under the Apache License, Version 2.0 (the "License");
# you may not use this file except in compliance with the License.
# You may obtain a copy of the License at
#
#     https://www.apache.org/licenses/LICENSE-2.0
#
# Unless required by applicable law or agreed to in writing, software
# distributed under the License is distributed on an "AS IS" BASIS,
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
# See the License for the specific language governing permissions and
# limitations under the License.
#

# If no developer name has been set use a default
if [ -z "$CDS_TEST_DEVELOPER_EMAIL" ]; then  CDS_TEST_DEVELOPER_EMAIL=CDS-Test-Developer@somefictitioustestcompany.com; fi;
CDS_REGISTER_TEST_DEVELOPER_EMAIL=CDR-Register-Test-Developer@somefictitioustestcompany.com

# Remove test app
echo "--->" Removing Test App: CDRTestApp...
apigeetool deleteApp -o $APIGEE_ORG -u $APIGEE_USER -p $APIGEE_PASSWORD --email $CDS_TEST_DEVELOPER_EMAIL --name CDSTestApp

# Remove CDR Register test app
echo "--->"  Removing CDR Register Test App: CDRRegisterTestApp...
apigeetool deleteApp -o $APIGEE_ORG -u $APIGEE_USER -p $APIGEE_PASSWORD --email $CDS_REGISTER_TEST_DEVELOPER_EMAIL --name CDRRegisterTestApp

# Remove test developer
echo "--->" Removing Test Developer: $CDS_TEST_DEVELOPER_EMAIL
apigeetool deleteDeveloper -o $APIGEE_ORG -username $APIGEE_USER -p $APIGEE_PASSWORD --email $CDS_TEST_DEVELOPER_EMAIL

# Remove CDR Register test developer
echo "--->" Removing CDR Register Test Developer: $CDS_REGISTER_TEST_DEVELOPER_EMAIL
apigeetool deleteDeveloper -o $APIGEE_ORG -username $APIGEE_USER -p $APIGEE_PASSWORD --email $CDS_REGISTER_TEST_DEVELOPER_EMAIL

# Remove products
echo "--->" Removing API Product "Accounts"
apigeetool deleteProduct -o $APIGEE_ORG -u $APIGEE_USER -p $APIGEE_PASSWORD --productName "CDSAccounts"

echo "--->" Removing API Product "Transactions"
apigeetool deleteProduct -o $APIGEE_ORG -u $APIGEE_USER -p $APIGEE_PASSWORD --productName "CDSTransactions"

echo "--->" Removing API Product "OIDC"
apigeetool deleteProduct -o $APIGEE_ORG -u $APIGEE_USER -p $APIGEE_PASSWORD --productName "CDSOIDC"

echo "--->" Removing API Product "DynamicClientRegistration"
apigeetool deleteProduct -o $APIGEE_ORG -u $APIGEE_USER -p $APIGEE_PASSWORD --productName "CDSDynamicClientRegistration"

echo "--->" Removing API Product "Admin"
apigeetool deleteProduct -o $APIGEE_ORG -u $APIGEE_USER -p $APIGEE_PASSWORD --productName "CDSAdmin"

# Remove KVMs
echo "--->" Removing KVM CDSConfig
apigeetool deleteKVMmap -o $APIGEE_ORG -e $APIGEE_ENV -u $APIGEE_USER -p $APIGEE_PASSWORD --mapName CDSConfig
echo "--->" Removing KVM mockCDRRegister
apigeetool deleteKVMmap -o $APIGEE_ORG -e $APIGEE_ENV -u $APIGEE_USER -p $APIGEE_PASSWORD --mapName mockCDRRegister
echo "--->" Removing KVM mockADRClient
apigeetool deleteKVMmap -o $APIGEE_ORG -e $APIGEE_ENV -u $APIGEE_USER -p $APIGEE_PASSWORD --mapName mockADRClient
echo "--->"  Deleting dynamic KVM CDSConfig...
apigeetool deleteKVMmap -u $APIGEE_USER -p $APIGEE_PASSWORD -o $APIGEE_ORG -e $APIGEE_ENV --mapName Consents 


# Undeploy banking apiproxies
cd src/apiproxies/banking
for ap in $(ls .) 
do 
    echo "--->" Undeploying $ap Apiproxy
    cd $ap
    apigeetool undeploy -o $APIGEE_ORG -e $APIGEE_ENV -u $APIGEE_USER -p $APIGEE_PASSWORD -n $ap
    cd ..
 done

 # Undeploy common apiproxies
cd ../common
for ap in $(ls .) 
do 
    echo "--->" Undeploying $ap Apiproxy
    cd $ap
    apigeetool undeploy -o $APIGEE_ORG -e $APIGEE_ENV -u $APIGEE_USER -p $APIGEE_PASSWORD -n $ap
    cd ..
 done

# Undeploy authn/authz related proxies
cd ../authnz
for ap in $(ls .) 
do 
    echo "--->" Undeploying $ap Apiproxy
    cd $ap
    apigeetool undeploy -o $APIGEE_ORG -e $APIGEE_ENV -u $APIGEE_USER -p $APIGEE_PASSWORD -n $ap
    cd ..
done

# Undeploy CDS-Admin proxy
cd ../admin/CDS-Admin
echo "--->" Undeploying CDS-Admin Apiproxy
apigeetool undeploy -o $APIGEE_ORG -e $APIGEE_ENV -u $APIGEE_USER -p $APIGEE_PASSWORD -n CDS-Admin

# Undeploy Client Dynamic Registration proxy and the accompanying mock-register and mock-adr-client proxies
cd ../../dynamic-client-registration
for ap in $(ls .) 
do 
    echo "--->" Undeploying $ap Apiproxy
    cd $ap
    apigeetool undeploy -o $APIGEE_ORG -e $APIGEE_ENV -u $APIGEE_USER -p $APIGEE_PASSWORD -n $ap
    cd ..
 done

# Undeploy Shared flows
cd ../../shared-flows
for sf in $(ls .) 
do 
    echo "--->" Undeploying $sf Shared Flow 
    cd $sf
    apigeetool undeploySharedflow -o $APIGEE_ORG -e $APIGEE_ENV -u $APIGEE_USER -p $APIGEE_PASSWORD -n $sf 
    cd ..
done

# Revert to original directory
 cd ../../..

 # Delete Caches and dynamic KVM used by oidc proxy
echo "--->" Deleting cache OIDCState...
apigeetool deletecache -u $APIGEE_USER -p $APIGEE_PASSWORD -o $APIGEE_ORG -e $APIGEE_ENV -z OIDCState
echo "--->" Deleting cache PushedAuthReqs...
apigeetool deletecache -u $APIGEE_USER -p $APIGEE_PASSWORD -o $APIGEE_ORG -e $APIGEE_ENV -z PushedAuthReqs
echo "--->" Deleting dynamic KVM PPIDs...
apigeetool deleteKVMmap -u $APIGEE_USER -p $APIGEE_PASSWORD -o $APIGEE_ORG -e $APIGEE_ENV --mapName PPIDs
