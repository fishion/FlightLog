"use strict;"

const FlightLog = require('./lib/FlightLog');
const fl = new FlightLog('data/flightlog.csv');

fl
  .filter_out_and_return()
  .find_all_routes_neo4j(8)
  .then(result => {
    fl.close_graph_connection();
    fl.dump('flightstats')
      .dump('programstats')
  })
