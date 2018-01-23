"use strict;"

const FlightLog = require('./lib/FlightLog');
const fl = new FlightLog('data/flightlog.csv');

fl.filter_out_and_return();
fl.find_all_routes(8);

fl.csv_output();
fl.dump('flightstats')
fl.dump('programstats')