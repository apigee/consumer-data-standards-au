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

#### Utility functions

function replace_with_jwks_uri {
 POLICY_FILE=$1
 JWKS_PATH_SUFFIX=$2
 POLICY_BEFORE_JWKS_ELEM=$(sed  '/<JWKS/,$d' $POLICY_FILE)
 POLICY_AFTER_JWKS_ELEM=$(sed  '1,/<JWKS/d' $POLICY_FILE)
 echo $POLICY_BEFORE_JWKS_ELEM'<JWKS uri="https://'$APIGEE_ORG-$APIGEE_ENV'.apigee.net'$JWKS_PATH_SUFFIX'" />'$POLICY_AFTER_JWKS_ELEM > temp.xml
 # The following step is for pretty printing the resulting edited xml, we don't care if it fails. If failed, just use the original file
 xmllint --format temp.xml 1> temp2.xml 2> /dev/null
 if [ $? -eq 0 ]; then
    cp temp2.xml $POLICY_FILE
 else
    cp temp.xml $POLICY_FILE
 fi
 rm temp.xml temp2.xml 
}

function replace_okta_jwks_uri {
 POLICY_FILE=$1
 POLICY_BEFORE_JWKS_ELEM=$(sed  '/<JWKS/,$d' $POLICY_FILE)
 POLICY_AFTER_JWKS_ELEM=$(sed  '1,/<JWKS/d' $POLICY_FILE)
 echo $POLICY_BEFORE_JWKS_ELEM'<JWKS uri="https://'$OKTA_ORG'/oauth2/default/v1/keys" />'$POLICY_AFTER_JWKS_ELEM > temp.xml
 # The following step is for pretty printing the resulting edited xml, we don't care if it fails. If failed, just use the original file
 xmllint --format temp.xml 1> temp2.xml 2> /dev/null
 if [ $? -eq 0 ]; then
    cp temp2.xml $POLICY_FILE
 else
    cp temp.xml $POLICY_FILE
 fi
 rm temp.xml temp2.xml 
}

###### End Utility functions


 # Deploy banking apiproxies
cd src/apiproxies/banking
for ap in $(ls .) 
do 
    echo Deploying $ap Apiproxy
    cd $ap
    apigeetool deployproxy -o $APIGEE_ORG -e $APIGEE_ENV -u $APIGEE_USER -p $APIGEE_PASSWORD -n $ap
    cd ..
 done

 # Deploy Common Proxies
cd ../common
for ap in $(ls .) 
do 
    echo Deploying $ap Apiproxy
    cd $ap
    apigeetool deployproxy -o $APIGEE_ORG -e $APIGEE_ENV -u $APIGEE_USER -p $APIGEE_PASSWORD -n $ap
    cd ..
 done
 
 #Create Cache - Sathish

echo "Creating cache OIDCState..."
apigeetool createcache -u $APIGEE_USER -p $APIGEE_PASSWORD -o $APIGEE_ORG -e $APIGEE_ENV -z OIDCState --description "Cache redirect_uri, client_id, scope and other OIDC request params against state" --cacheExpiryInSecs 600
#curl  -s -o /dev/null -w "%{http_code}\n" --request PUT 'https://api.enterprise.apigee.com/v1/o/demo-au01/e/test/caches/OIDCState' \
#-u $APIGEE_USER:$APIGEE_PASSWORD \
#--header 'Content-Type: application/json' \
#--data-raw '{
#    "description": "Cache redirect_uri, client_id, scope and other OIDC request params against state",
#    "expirySettings": {
#        "timeoutInSec": {
#            "value": "600"
#        }
#    }
#}'

 # Deploy oidc proxy
cd ../oidc
echo Deploying oidc Apiproxy
apigeetool deployproxy -o $APIGEE_ORG -e $APIGEE_ENV -u $APIGEE_USER -p $APIGEE_PASSWORD -n oidc

# Deploy Client Dynamic Registration proxy and the required mock-register and mock-adr-client proxies
cd ../dynamic-client-registration
for ap in $(ls .) 
do 
    echo Deploying $ap Apiproxy
    cd $ap
    apigeetool deployproxy -o $APIGEE_ORG -e $APIGEE_ENV -u $APIGEE_USER -p $APIGEE_PASSWORD -n $ap
    cd ..
 done

 # Revert to original directory
 cd ../../..

# Create Products required for the different APIs
echo Creating API Product: "Accounts"
apigeetool createProduct -o $APIGEE_ORG -u $APIGEE_USER -p $APIGEE_PASSWORD \
   --productName "CDSAccounts" --displayName "Accounts" --approvalType "auto" --productDesc "Get access to Accounts APIs" \
   --environments $APIGEE_ENV --proxies CDS-Accounts --scopes "bank:accounts.basic:read,bank:accounts.detail:read" 

echo Creating API Product: "Transactions"
apigeetool createProduct -o $APIGEE_ORG -u $APIGEE_USER -p $APIGEE_PASSWORD \
   --productName "CDSTransactions" --displayName "Transactions" --approvalType "auto" --productDesc "Get access to Transactions APIs" \
   --environments $APIGEE_ENV --proxies CDS-Transactions --scopes "bank:transactions:read" 

echo Creating API Product: "OIDC"
apigeetool createProduct -o $APIGEE_ORG -u $APIGEE_USER -p $APIGEE_PASSWORD \
   --productName "CDSOIDC" --displayName "OIDC" --approvalType "auto" --productDesc "Get access to authentication and authorisation requests" \
   --environments $APIGEE_ENV --proxies oidc --scopes "openid, profile"

# Create product for dynamic client registration
echo Creating API Product: "DynamicClientRegistration"
apigeetool createProduct -o $APIGEE_ORG -u $APIGEE_USER -p $APIGEE_PASSWORD \
   --productName "CDSDynamicClientRegistration" --displayName "DynamicClientRegistration" --approvalType "auto" --productDesc "Dynamically register a client" \
   --environments $APIGEE_ENV --proxies CDS-DynamicClientRegistration --scopes "cdr:registration"

# Create a test developer who will own the test app

echo Creating Test Developer: $CDS_TEST_DEVELOPER_EMAIL
apigeetool createDeveloper -o $APIGEE_ORG -username $APIGEE_USER -p $APIGEE_PASSWORD --email $CDS_TEST_DEVELOPER_EMAIL --firstName "CDS Test" --lastName "Developer"  --userName $CDS_TEST_DEVELOPER_EMAIL

# Create a test app - Store the client key and secret
echo Creating Test App: CDSTestApp...
APP_CREDENTIALS=$(apigeetool createApp -o $APIGEE_ORG -u $APIGEE_USER -p $APIGEE_PASSWORD --name CDSTestApp --apiProducts "CDSTransactions,CDSAccounts,CDSOIDC" --email $CDS_TEST_DEVELOPER_EMAIL --json | jq .credentials[0])
APP_KEY=$(echo $APP_CREDENTIALS | jq -r .consumerKey)
APP_SECRET=$(echo $APP_CREDENTIALS | jq -r .consumerSecret)


# Update app attributes
# Sathish - changes to set RegistrationInfo custom attribute
export JWKS_URL=https://$APIGEE_ORG-$APIGEE_ENV.apigee.net/mock-adr-client/jwks
curl https://api.enterprise.apigee.com/v1/organizations/$APIGEE_ORG/developers/$CDS_TEST_DEVELOPER_EMAIL/apps/CDSTestApp \
  -u $APIGEE_USER:$APIGEE_PASSWORD \
  -H 'Accept: */*' \
  -H 'Content-Type: application/json' \
  -d '{
  "attributes": [
    {
      "name": "Notes",
      "value": "This TestApp is also registered in the OIDC Provider implementation, with the same client_id and client_secret"
    },
    {
      "name": "DisplayName",
      "value": "CDSTestApp"
    },
    {
      "name": "RegistrationInfo",
      "value": "{\"jwks_uri\": [\"'"$JWKS_URL"'\"]}"
    }
  ],
  "callbackUrl": "https://httpbin.org/post"
}'


# Generate RSA Private/public key pair for client app:
echo "Generating RSA Private/public key pair for Test App..."
mkdir setup/certs
cd setup/certs
openssl genpkey -algorithm RSA -out ./CDSTestApp_rsa_private.pem -pkeyopt rsa_keygen_bits:2048
openssl rsa -in ./CDSTestApp_rsa_private.pem -pubout -out ./CDSTestApp_rsa_public.pem
echo "Private/public key pair generated and stored in ./setup/certs. Please keep private key safe"
echo "----"

# Generate a public certificate based on the private key just generated
echo "Generating a public certificate for Test App..."
openssl req -new -key CDSTestApp_rsa_private.pem -out CDSTestApp.csr -subj "/CN=CDS-TestApp" -outform PEM
openssl x509 -req -days 365 -in CDSTestApp.csr -signkey CDSTestApp_rsa_private.pem -out CDSTestApp.crt
echo Certificate CDSTestApp.crt generated and stored in ./setup/certs. You will need this certificate and private key when/if enabling mTLS and HoK verification


# Generate jwk format for public key (and store it in a file too) - Add missing attributes in jwk generated by command line
APP_JWK=$(pem-jwk ./CDSTestApp_rsa_public.pem  | jq '. + { "kid": "CDSTestApp" } + { "use": "sig" }') 
echo $APP_JWK > ./CDSTestApp.jwk

# Generate RSA Private/public key pair for the mock CDR Register:
echo "Generating RSA Private/public key pair for Mock CDR Register..."
openssl genpkey -algorithm RSA -out ./MockCDRRegister_rsa_private.pem -pkeyopt rsa_keygen_bits:2048
openssl rsa -in ./MockCDRRegister_rsa_private.pem -pubout -out ./MockCDRRegister_rsa_public.pem
echo "Private/public key pair generated and stored in ./setup/certs. Please keep private key safe"
echo "Use private key when signing JWT tokens used for authentication in Admin API Endpoints"
echo "----"

# Generate jwk format for public key (and store it in a file too) - Add missing attributes in jwk generated by command line
MOCKREGISTER_JWK=$(pem-jwk ./MockCDRRegister_rsa_public.pem  | jq '{"keys": [. + { "kid": "MockCDRRegister" } + { "use": "sig" }]}')  
echo $MOCKREGISTER_JWK > ./MockCDRRegister.jwks

# Create KVMs that will hold the JWKS and private Key for both the mock cdr register, and the mock adr client
echo Creating KVM mockCDRRegister...
apigeetool createKVMmap -u $APIGEE_USER -p $APIGEE_PASSWORD -o $APIGEE_ORG -e $APIGEE_ENV --mapName mockCDRRegister --encrypted
echo Adding entries to mockCDRRegister...
MOCKREGISTER_PRIVATE_KEY=`cat ./MockCDRRegister_rsa_private.pem`
apigeetool addEntryToKVM -u $APIGEE_USER -p $APIGEE_PASSWORD -o $APIGEE_ORG -e $APIGEE_ENV --mapName mockCDRRegister --entryName jwks --entryValue "$MOCKREGISTER_JWK" 1> /dev/null | echo Added entry for jwks
apigeetool addEntryToKVM -u $APIGEE_USER -p $APIGEE_PASSWORD -o $APIGEE_ORG -e $APIGEE_ENV --mapName mockCDRRegister --entryName privateKey --entryValue "$MOCKREGISTER_PRIVATE_KEY"  1> /dev/null | echo Added entry for private key

echo Creating KVM mockADRClient...
apigeetool createKVMmap -u $APIGEE_USER -p $APIGEE_PASSWORD -o $APIGEE_ORG -e $APIGEE_ENV --mapName mockADRClient --encrypted
echo Adding entries to mockADRClient...
MOCKCLIENT_JWKS='{"keys": ['$APP_JWK']}'
MOCKCLIENT_PRIVATE_KEY=`cat ./CDSTestApp_rsa_private.pem`
apigeetool addEntryToKVM -u $APIGEE_USER -p $APIGEE_PASSWORD -o $APIGEE_ORG -e $APIGEE_ENV --mapName mockADRClient --entryName jwks --entryValue "$MOCKCLIENT_JWKS"  1> /dev/null | echo Added entry for jwks
apigeetool addEntryToKVM -u $APIGEE_USER -p $APIGEE_PASSWORD -o $APIGEE_ORG -e $APIGEE_ENV --mapName mockADRClient --entryName privateKey --entryValue "$MOCKCLIENT_PRIVATE_KEY"   1> /dev/null | echo Added entry for private key

# Create KVM that will hold Apigee credentials (necessary for dynamic client registration operations)
echo Creating KVM ApigeeAPICredentials...
apigeetool createKVMmap -u $APIGEE_USER -p $APIGEE_PASSWORD -o $APIGEE_ORG -e $APIGEE_ENV --mapName ApigeeAPICredentials --encrypted
echo Adding entries to ApigeeAPICredentials...
apigeetool addEntryToKVM -u $APIGEE_USER -p $APIGEE_PASSWORD -o $APIGEE_ORG -e $APIGEE_ENV --mapName ApigeeAPICredentials --entryName apigeeUser --entryValue $APIGEE_USER
apigeetool addEntryToKVM -u $APIGEE_USER -p $APIGEE_PASSWORD -o $APIGEE_ORG -e $APIGEE_ENV --mapName ApigeeAPICredentials --entryName apigeePassword --entryValue $APIGEE_PASSWORD 1> /dev/null | echo Added entry for password

# Sathish - Generate RSA Private/public key pair for Apigee JWT generation:
echo "Generating RSA Private/public key pair for Apigee JWT generation..."
openssl genpkey -algorithm RSA -out ./ApigeeJWTGenerator_rsa_private.pem -pkeyopt rsa_keygen_bits:2048
openssl rsa -in ./ApigeeJWTGenerator_rsa_private.pem -pubout -out ./ApigeeJWTGenerator_rsa_public.pem
echo "Private/public key pair generated and stored in ./setup/certs. Please keep private key safe"
echo "Use private key when signing id_token JWT issued by Apigee"
echo "----"

# Sathish - Generate jwk format for public key (and store it in a file too) - Add missing attributes in jwk generated by command line
APIGEEJWTGENERATOR_JWK=$(pem-jwk ./ApigeeJWTGenerator_rsa_public.pem  | jq '{"keys": [. + { "kid": "ApigeeJWTGenerator" } + { "use": "sig" }]}')  
echo $APIGEEJWTGENERATOR_JWK > ./ApigeeJWTGenerator.jwks

# Sathish - Create a KVM that will hold the JWKS and private Key for Apigee JWT generator
echo Creating KVM JWTKeys...
apigeetool createKVMmap -u $APIGEE_USER -p $APIGEE_PASSWORD -o $APIGEE_ORG -e $APIGEE_ENV --mapName JWTKeys --encrypted
echo Adding entries to JWTKeys...
APIGEEJWTGENERATOR_PRIVATE_KEY=`cat ./ApigeeJWTGenerator_rsa_private.pem`
apigeetool addEntryToKVM -u $APIGEE_USER -p $APIGEE_PASSWORD -o $APIGEE_ORG -e $APIGEE_ENV --mapName JWTKeys --entryName jwks --entryValue "$APIGEEJWTGENERATOR_JWK" 1> /dev/null | echo Added entry for jwks
apigeetool addEntryToKVM -u $APIGEE_USER -p $APIGEE_PASSWORD -o $APIGEE_ORG -e $APIGEE_ENV --mapName JWTKeys --entryName private_key --entryValue "$APIGEEJWTGENERATOR_PRIVATE_KEY"  1> /dev/null | echo Added entry for private key

# Sathish - Create KVM ApigeeOIDCCreds

echo Creating KVM ApigeeOIDCCreds...
apigeetool createKVMmap -u $APIGEE_USER -p $APIGEE_PASSWORD -o $APIGEE_ORG -e $APIGEE_ENV --mapName ApigeeOIDCCreds --encrypted
apigeetool addEntryToKVM -u $APIGEE_USER -p $APIGEE_PASSWORD -o $APIGEE_ORG -e $APIGEE_ENV --mapName ApigeeOIDCCreds --entryName client_id --entryValue $OKTA_CLIENT_ID
apigeetool addEntryToKVM -u $APIGEE_USER -p $APIGEE_PASSWORD -o $APIGEE_ORG -e $APIGEE_ENV --mapName ApigeeOIDCCreds --entryName client_secret --entryValue $OKTA_CLIENT_SECRET
apigeetool addEntryToKVM -u $APIGEE_USER -p $APIGEE_PASSWORD -o $APIGEE_ORG -e $APIGEE_ENV --mapName ApigeeOIDCCreds --entryName redirect_uri --entryValue $OKTA_REDIRECT_URI
apigeetool addEntryToKVM -u $APIGEE_USER -p $APIGEE_PASSWORD -o $APIGEE_ORG -e $APIGEE_ENV --mapName ApigeeOIDCCreds --entryName okta_org --entryValue $OKTA_ORG

# Revert to original directory
 cd ../..

# Replace the existing <JWKS> element in the JWT-VerifyCDRToken policy of validate-cdr-register-token shared flow, and JWT-VerifyCDRSSAToken policy in validate-ssa shared flow
# so that they point to the mock-cdr jwks endpoint
echo "Adding Mock CDR Register JWKS uri to policy used to validate CDR JWT Token"
replace_with_jwks_uri src/shared-flows/validate-cdr-register-token/sharedflowbundle/policies/JWT-VerifyCDRToken.xml /mock-cdr-register/jwks
echo "Adding Mock CDR Register JWKS uri to policy used to validate SSA Token"
replace_with_jwks_uri src/shared-flows/validate-ssa/sharedflowbundle/policies/JWT-VerifyCDRSSAToken.xml /mock-cdr-register/jwks
echo "Adding Okta JWKS URI to policy used to validate Okta ID Token"
replace_okta_jwks_uri src/shared-flows/oidc-generate-opaque-auth-code-and-id-token/sharedflowbundle/policies/Verify-OIDC-ID-Token.xml

 # Deploy Shared flows
cd src/shared-flows
for sf in $(ls .) 
do 
    echo Deploying $sf Shared Flow 
    cd $sf
    apigeetool deploySharedflow -o $APIGEE_ORG -e $APIGEE_ENV -u $APIGEE_USER -p $APIGEE_PASSWORD -n $sf 
    cd ..
 done


 # Deploy Admin Proxies
cd ../apiproxies/admin/CDS-Admin
echo Deploying CDS-Admin Apiproxy
apigeetool deployproxy -o $APIGEE_ORG -e $APIGEE_ENV -u $APIGEE_USER -p $APIGEE_PASSWORD -n CDS-Admin


# Sathish - Deploy oidctokenhash proxy
cd ../../oidctokenhash
echo Deploying oidctokenhash Apiproxy
apigeetool deployproxy -o $APIGEE_ORG -e $APIGEE_ENV -u $APIGEE_USER -p $APIGEE_PASSWORD -n oidctokenhash

# Revert to original directory
 cd ../../..