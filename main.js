"use strict;"

const FlightLog = require('./FlightLog');
const fl = new FlightLog('data.csv');

fl.dump()
fl.filter_all()
fl.dump()
