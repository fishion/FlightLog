"use strict;"

const FlightLog = require('./FlightLog');
const fl = new FlightLog('test/flightlog.csv');

fl.dump()
fl.dump('all_routes')

// filtered routes at this point just has the circular flights which take off and land at same location
fl.dump('filtered_routes')

// this will filter all 2-log flights returning to their start
fl.filter_out_and_return()
fl.dump('filtered_routes')
