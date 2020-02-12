  /*
* Copyright 2020 Google LLC
*
* Licensed under the Apache License, Version 2.0 (the "License");
* you may not use this file except in compliance with the License.
* You may obtain a copy of the License at
*
*     https://www.apache.org/licenses/LICENSE-2.0
*
* Unless required by applicable law or agreed to in writing, software
* distributed under the License is distributed on an "AS IS" BASIS,
* WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
* See the License for the specific language governing permissions and
* limitations under the License.
*/

/**
 * @file
 * filterMetricsListBasedOnRequestFilters.js
 * Return only the metrics that meet the search criteria found in the request
 */

// Utility function. Remove the metrics not corresponding to the period filter
function removeMetrics(metricsObject,periodFilter) {
    
    var theFilteredMetricsObject = metricsObject;
    // The availability metric requires separate treatement as its elements have different names (based in months, not days)
    theAvailabilityMetric = metricsObject["availability"];
    newAvailabilityMetric = {};
    if (periodFilter == "CURRENT") {
        // Remove elements related to previous periods.
        newAvailabilityMetric.currentMonth = theAvailabilityMetric.currentMonth
        elementToKeep = "currentDay"
        
    }
    else {
        // Remove elements related to current period 
        newAvailabilityMetric.previousMonths = theAvailabilityMetric.previousMonths
        elementToKeep = "previousDays"
    }
    theFilteredMetricsObject["availability"] = newAvailabilityMetric;
    // Process all simple structure metrics
    listOfMetricsToProcess = ["performance","sessionCount","averageTps","peakTps","errors","rejections"];
    for(i = 0; i < listOfMetricsToProcess.length; i++) {
        currentMetricName = listOfMetricsToProcess[i];
        newMetric = {};
        newMetric[elementToKeep] = metricsObject[currentMetricName][elementToKeep];
        theFilteredMetricsObject[currentMetricName] = newMetric;
        
    }
    // Now process all metrics that use perfomanceTiers as dimensions
    listOfMetricsUsingPerformanceTiers = ["invocations","averageResponse"];
    listOfPerformanceTiers = ["unauthenticated","highPriority","lowPriority","unattended","largePayload"];
    for(i = 0; i < listOfMetricsUsingPerformanceTiers.length; i++) {
        currentMetricName = listOfMetricsUsingPerformanceTiers[i];
        newMetric = {};
        // Iterate over all the performance tier subelements
        for(j = 0; j < listOfPerformanceTiers.length; j++) {
            currentPerformanceTierName = listOfPerformanceTiers[j];
            newMetricForPerformanceTier = {};
            newMetricForPerformanceTier[elementToKeep] = metricsObject[currentMetricName][currentPerformanceTierName][elementToKeep];
            newMetric[currentPerformanceTierName] = newMetricForPerformanceTier;
        }
        theFilteredMetricsObject[currentMetricName] = newMetric;
    }
    return theFilteredMetricsObject;


}



// Get the period for which the metrics must be returned
var periodFilter = context.getVariable("metricsPeriod");
allMetrics = JSON.parse(context.getVariable("allMetrics")).data;
print("At start, allMetrics = " + JSON.stringify(allMetrics) + " - periodFilter = " + periodFilter);
var newResult = {};
if (periodFilter != "ALL") {
    // We need to remove either the current metrics or metrics for previous periods
    allMetrics = removeMetrics(allMetrics,periodFilter);
    
}
newResult.data = allMetrics;
context.setVariable("response.content", JSON.stringify(newResult));