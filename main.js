#!/usr/bin/env node
"use strict";

const FlightLog = require('./lib/FlightLog');
const fl = new FlightLog('data/flightlog.csv');

fl.csv_output();

fl.dump('flightStats')