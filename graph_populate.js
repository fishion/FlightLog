"use strict;"

const FlightLog = require('./lib/FlightLog');
const fl = new FlightLog('data/flightlog.csv');

fl
  .filter_out_and_return()
  .graph_data()
  .then(result => {
    fl.close_graph_connection();
  })