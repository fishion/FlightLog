#!/usr/bin/env node
"use strict";

const FlightLog = require('./lib/FlightLog');
const fl = new FlightLog('data/flightlog.csv');

fl.graph_data();

fl.dump('flightStats')
fl.dump('programStats')
