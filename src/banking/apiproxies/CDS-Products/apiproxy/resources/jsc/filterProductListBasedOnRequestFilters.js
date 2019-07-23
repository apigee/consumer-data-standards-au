/*
 * Copyright 2019 Google LLC
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
 * filterProductListBasedOnRequestFilters.js
 * Return only the products that meet the search criteria found in the request
 */

// Utility function. Check whether a product meets updated-since, effect, product-category or brand filter criteria
function productMeetsSearchCriteria(prodDetails, prodCategory, prodBrand, prodUpdatedSince, prodEffectiveFilter)  {
	var prodMeetsCriteria = true;

     if ((prodCategory))  {
         prodMeetsCriteria = (prodDetails.productCategory == prodCategory);
     }
     if ( prodMeetsCriteria && prodBrand) {
         prodMeetsCriteria = (prodDetails.brand == prodBrand);
     }
    if (prodMeetsCriteria && (prodUpdatedSince) ) {
	    var prodUpdatedSinceDateVar = new Date(prodUpdatedSince);
		// Check transaction time
		var updatedDate = new Date(prodDetails.lastUpdated);
		prodMeetsCriteria = (prodUpdatedSinceDateVar &&  prodUpdatedSinceDateVar != "Invalid Date");
		prodMeetsCriteria = (prodMeetsCriteria && updatedDate && updatedDate !== null && updatedDate != "Invalid Date" && updatedDate >= prodUpdatedSinceDateVar);
	}
	 
	 if (prodMeetsCriteria && prodEffectiveFilter) {
	     // Possible values for prodFilter.effective: CURRENT, FUTURE, ALL - If ALL, then criteria will always be met
	     var effectiveFrom = new Date(prodDetails.effectiveFrom);
	     var effectiveTo = new Date(prodDetails.effectiveTo);
	     var curDateTime = new Date();
	     if (prodEffectiveFilter == "CURRENT") {
	         // Check that effectiveFrom <= curDateTime <=  effectiveTo, if these are defined
	         prodMeetsCriteria = (!effectiveFrom || effectiveFrom === null || effectiveFrom == "Invalid Date" || (effectiveFrom <= curDateTime));
	         prodMeetsCriteria = (prodMeetsCriteria && (!effectiveTo || effectiveTo === null || effectiveTo == "Invalid Date" || (curDateTime <= effectiveTo)));
	     }
	     else if (prodEffectiveFilter == "FUTURE") {
	         // Check that effectiveFrom > curDateTime, if defined
	         prodMeetsCriteria = (!effectiveFrom || effectiveFrom === null || effectiveFrom == "Invalid Date" || (curDateTime < effectiveFrom));
	     }
	 }
	 
	return prodMeetsCriteria;


} 
 
// Get the product filter criteria, if any
var prodEffectiveFilter = context.getVariable("prodFilter.effective");
var prodCategoryFilter = context.getVariable("prodFilter.product-category");
var prodUpdatedSinceFilter = context.getVariable("prodFilter.updated-since");
var prodBrandFilter = context.getVariable("prodFilter.brand");
var fullListOfProductDetails = JSON.parse(context.getVariable("listOfAllProductDetails"));
var newProductList = [];
if(fullListOfProductDetails && fullListOfProductDetails.length >0)
{
    for(var i = 0; i< fullListOfProductDetails.length; i++)
    {
        if (productMeetsSearchCriteria(fullListOfProductDetails[i], prodCategoryFilter, prodBrandFilter, prodUpdatedSinceFilter, prodEffectiveFilter)) {
            // Only include in the response products matching the filter criteria
            newProductList.push(fullListOfProductDetails[i]);
        }
    }
    
    context.setVariable("filteredProductList",JSON.stringify(newProductList));
}