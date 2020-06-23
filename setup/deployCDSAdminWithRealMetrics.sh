#/bin/bash

#
# Copyright 2020 Google LLC
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


# Undeploy standard CDS-Admin 
echo Undeploying CDS-Admin Apiproxy
apigeetool undeploy -o $APIGEE_ORG -e $APIGEE_ENV -u $APIGEE_USER -p $APIGEE_PASSWORD -n CDS-Admin

# Create target server
echo Creating Target Server cds-metrics-collector
apigeetool createTargetServer -o $APIGEE_ORG -e $APIGEE_ENV -u $APIGEE_USER -p $APIGEE_PASSWORD --targetEnabled true --targetHost $METRICS_SERVICE_HOST --targetPort 443 --targetSSL true --targetServerName cds-metrics-collector

# Deploy CDS-AdminWithRealMetrics
cd src/apiproxies/admin/CDS-AdminWithRealMetrics
echo Deploying CDS-AdminWithRealMetrics Apiproxy
apigeetool deployproxy -o $APIGEE_ORG -e $APIGEE_ENV -u $APIGEE_USER -p $APIGEE_PASSWORD -n CDS-AdminWithRealMetrics

# Revert to original directory
cd ../../../..