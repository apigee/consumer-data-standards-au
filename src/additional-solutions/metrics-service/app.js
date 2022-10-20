// Copyright 2017 Google LLC
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//      http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

// [START gae_flex_datastore_app]
'use strict';

const express = require('express');

const app = express();
app.enable('trust proxy');
const refreshMetrics = require('./refresh-metrics-service');
const healthcheck = require('./healthcheck-service');
const getMetrics = require('./get-metrics-service');

// Set up routes
app.get('/refreshmetrics', async (req, res, next) => {
  try {
    const from = ((typeof req.query.from === 'undefined') || (req.query.from === null)) ? null : req.query.from;
    const to = ((typeof req.query.to === 'undefined') || (req.query.to === null)) ? null : req.query.to;
    refreshMetrics.refreshDailyAndCurrentMetrics(from, to);
    res
      .status(200)
      .set('Content-Type', 'text/plain')
      .send("Refresh metrics process initiated...")
      .end();
  } catch (error) {
    next(error);
  }
}
);

app.get('/consolidatemetrics', async (req, res, next) => {
  try {
    refreshMetrics.consolidatePreviousDayMetrics();
    res
      .status(200)
      .set('Content-Type', 'text/plain')
      .send("Consolidate previous day metrics process initiated...")
      .end();
  } catch (error) {
    next(error);
  }
}
);



app.get('/metrics', async (req, res, next) => {
  try {
    const periodForMetrics = ((typeof req.query.period === 'undefined') || (req.query.period === null)) ? "ALL" : req.query.period;
    const metricsResponse = await getMetrics.getMetrics(periodForMetrics);
    res
      .status(200)
      .set('Content-Type', 'application/json')
      .send(metricsResponse)
      .end();
  } catch (error) {
    next(error);
  }

}
);

app.get('/healthcheck', async (req, res, next) => {
  try {
    healthcheck.healthcheck();;
    res
      .status(200)
      .set('Content-Type', 'text/plain')
      .send("Healthcheck and refresh availability metrics process initiated...")
      .end();
  } catch (error) {
    next(error);
  }
}
);


const PORT = process.env.PORT || 8080;
app.listen(process.env.PORT || 8080, () => {
  console.log(`App listening on port ${PORT}`);
  console.log('Press Ctrl+C to quit.');

});

module.exports = app;
