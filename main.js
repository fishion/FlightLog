"use strict;"

const FlightLog = require('./lib/FlightLog');
const fl = new FlightLog('data/flightlog.csv');

fl
  .filter_out_and_return()
  .csv_output()
  .dump('flightstats')