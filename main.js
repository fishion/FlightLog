"use strict;"

const FlightLog = require('./FlightLog');
const fl = new FlightLog(
  'data/flightlog.csv',
  {
    max_route_length: 5
  }
);

fl.dump('flightstats')
fl.dump('programstats')

//fl.dump('all_routes')
//fl.filter_out_and_return()
// this will have all 1 or 2 leg flights returning to their start filtered
//fl.dump('filtered_routes')