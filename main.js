"use strict;"

const FlightLog = require('./FlightLog');
const fl = new FlightLog('data.csv');
fl.dump()

fl.find_all_routes()

fl.dump('filtered_routes')
fl.dump('all_routes')
