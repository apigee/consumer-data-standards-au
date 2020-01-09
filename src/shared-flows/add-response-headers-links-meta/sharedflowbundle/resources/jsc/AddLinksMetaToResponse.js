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
   * AddLinksMetaToResponse.js
   * Adds standard objects links and meta to response
   * Adds necessary pagination information to them, if proxy endpoints requires it
   **/

  var doPaginationLinksAndMeta = context.getVariable("generatePaginationLinksAndMeta");

  var metaObj = getObjectFromResponse("meta");
  var linksObj = getObjectFromResponse("links");

  // Add self link
  var linkBase = context.getVariable("selfLinkProtocol") + "://" + context.getVariable("selfLinkHost") + context.getVariable("selfLinkBasePath");
  selfLink = (context.getVariable("selfLinkQueryString") === null || context.getVariable("selfLinkQueryString") === "" ) ? linkBase : linkBase + "?" + context.getVariable("selfLinkQueryString");

  linksObj.self = selfLink;

  if (doPaginationLinksAndMeta) {
  	// Add links to prev, next, first and last pages
  	// Add total number of records and pages to meta

  	// Convert the original query string back into an array
  	var qryParams = splitQueryParams(context.getVariable("selfLinkQueryString"));
  	var pageNumber = parseInt(context.getVariable("pagination.page"),10);
  	var totalPages = parseInt(context.getVariable("pagination.totalPages"));
  	if (pageNumber > 1) {
  		// Generate first and prev links
  		linksObj.first = generateLinkForPage(linkBase, qryParams, 1);
  		linksObj.prev = generateLinkForPage(linkBase, qryParams, pageNumber - 1);
  	}
  	if (pageNumber < totalPages) {
  		// Generate next and last links
  		linksObj.next = generateLinkForPage(linkBase, qryParams, pageNumber + 1);
  		linksObj.last = generateLinkForPage(linkBase, qryParams, totalPages);
  	}

  	metaObj.totalRecords = context.getVariable("pagination.totalRecords");
  	metaObj.totalPages = totalPages;
  }
  var responseBody = JSON.parse(context.getVariable("response.content"));
  responseBody.meta = metaObj;
  responseBody.links = linksObj;
  context.setVariable("response.content", JSON.stringify(responseBody));



  // Utility function. Get  object from response, create new if it doesn't exist

  function getObjectFromResponse(objName) {
    var responseBody = JSON.parse(context.getVariable("response.content"));
    if (responseBody === null) {
        return {}
    }
  	var theObj = responseBody[objName];
  	theObj = (theObj && (theObj !== null)) ? theObj : {};
  	return theObj;

  }

  // Utility funcion generate link for a given page (using the original query parameters, replacing "page param")

  function generateLinkForPage(linkBase, qryParams, newPageNumber) {
  	qryParams.page = newPageNumber;
  	var theLink = linkBase + "?" + toQueryString(qryParams);
  	return theLink;
  }
  
  
// Utility function that splits a query string into an object 
function splitQueryParams(queryString) {
    var obj = queryString.split("&").reduce(function(prev, curr, i, arr) {
        var p = curr.split("=");
        prev[decodeURIComponent(p[0])] = decodeURIComponent(p[1]);
        return prev;
    }, {});

    return obj;
}

// Utility function that composes a query string from an object
function toQueryString(qryParams) {
  var strArray = [];
  for (var p in qryParams)
    if (qryParams.hasOwnProperty(p)) {
      strArray.push(encodeURIComponent(p) + "=" + encodeURIComponent(qryParams[p]));
    }
  return strArray.join("&");
}
    
