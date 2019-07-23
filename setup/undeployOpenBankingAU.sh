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

# Undeploy apiproxies
cd src/gateway/apiproxies
for ap in $(ls .) 
do 
    echo Undeploying $ap Apiproxy
    cd $ap
    apigeetool undeploy -o $APIGEE_ORG -e $APIGEE_ENV -u $APIGEE_USER -p $APIGEE_PWD -n $ap
    cd ..
 done

# Undeploy Shared flows
cd ../shared-flows
for sf in $(ls .) 
do 
    echo Undeploying $sf Shared Flow 
    cd $sf
    apigeetool undeploySharedflow -o $APIGEE_ORG -e $APIGEE_ENV -u $APIGEE_USER -p $APIGEE_PWD -n $sf 
    cd ..
done

# Revert to original directory
 cd ../../..