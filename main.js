"use strict;"

const FlightLog = require('./lib/FlightLog');
const fl = new FlightLog('data/flightlog.csv');

fl.filter_out_and_return();

fl.csv_output();

fl.dump('flightstats')