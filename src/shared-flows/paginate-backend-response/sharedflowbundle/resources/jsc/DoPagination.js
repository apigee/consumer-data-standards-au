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
 * DoPagination.js
 * Paginate the backend response. Only returns the response data 
 * corresponding to the requested page.
 * Returns an error if the requested page is past the total number of pages
 * 
 **/

var doPagination = context.getVariable("pagination.doPagination");

if (doPagination) {
	var pageNumber = parseInt(context.getVariable("pagination.page"));
	var pageSize = parseInt(context.getVariable("pagination.page-size"));
	var responseBody = JSON.parse(context.getVariable("response.content"));
	var firstKey = Object.keys(responseBody.data)[0];
	var responseArray = responseBody["data"][firstKey];
	var totalNumberOfEntries = responseArray.length;
	var totalPages = Math.ceil(totalNumberOfEntries / pageSize);
	if (totalNumberOfEntries > 0 && pageNumber > totalPages) {
		// When there are no records in the backend response, it shouldn't be considered an error
		context.setVariable("pagination.error", "Page requested is bigger than total number of pages available");
	} else {
		var responseSliceStart = (pageNumber - 1) * pageSize;		
		var responseSliceEnd = responseSliceStart + pageSize;
		if (responseSliceEnd > totalNumberOfEntries) {
			responseSliceEnd = totalNumberOfEntries;
		}
		// Now only leave this slice of the original response
		responseBody.data[firstKey] = responseArray.slice(responseSliceStart, responseSliceEnd);
		context.setVariable("response.content", JSON.stringify(responseBody));

		// Set the information necessary for generating the meta object
		context.setVariable("pagination.totalRecords", totalNumberOfEntries);
		context.setVariable("pagination.totalPages", totalPages);
	}

}
