#!/usr/bin/env node
"use strict";

const FlightLog = require('./lib/FlightLog');
const fl = new FlightLog('data/flightlog.csv');

fl.findAllRoutes(8);

fl.csv_output();

fl.dump('flightStats')
fl.dump('programStats')
