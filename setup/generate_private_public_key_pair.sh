#!/usr/bin/env bash
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


# This script generates a RSA Private/public key pair, and the corresponding JWKS file

if [ "$#" -ne 3 ]; then
    echo "This script generates a RSA Private/public key pair, and the corresponding JWKS file"
    echo "Usage: generate_private_public_key_pair.sh KEY_PAIR_NAME KEY_PAIR_FRIENDLY_NAME KEY_PAIR_OUTPUT_DIR"
    exit
fi

KEY_PAIR_NAME=$1
KEY_PAIR_FRIENDLY_NAME=$2
KEY_PAIR_OUTPUT_DIR=$3

# Add end slash if not present
if [[ "$KEY_PAIR_OUTPUT_DIR" != *"/" ]]; then
    KEY_PAIR_OUTPUT_DIR="$KEY_PAIR_OUTPUT_DIR/"
fi


# Generate RSA Private/public key pair
echo "--->"  "Generating RSA Private/public key pair for "$KEY_PAIR_FRIENDLY_NAME"..."

OUT_FILE=$KEY_PAIR_OUTPUT_DIR$KEY_PAIR_NAME"_rsa_private.pem"
openssl genpkey -algorithm RSA -out $OUT_FILE -pkeyopt rsa_keygen_bits:2048
IN_FILE=$OUT_FILE
OUT_FILE=$KEY_PAIR_OUTPUT_DIR$KEY_PAIR_NAME"_rsa_public.pem"
openssl rsa -in $IN_FILE -pubout -out $OUT_FILE
echo "Private/public key pair generated and stored in $KEY_PAIR_OUTPUT_DIR. Please keep private key safe"
echo "----"

# Generate jwk format for public key (and store it in a file too) - Add missing attributes in jwk generated by command line
IN_FILE=$OUT_FILE
APP_JWK=$(pem-jwk $IN_FILE  | jq '{"keys": [. + { "kid": "PlaceHolderKid" } + { "use": "sig" }]}')  
echo $APP_JWK > $KEY_PAIR_OUTPUT_DIR$KEY_PAIR_NAME.jwks
sed -i.bak "s/PlaceHolderKid/$KEY_PAIR_NAME/" $KEY_PAIR_OUTPUT_DIR$KEY_PAIR_NAME.jwks
