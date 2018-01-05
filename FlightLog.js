"use strict";

let fs          = require('fs')
  , csv_parser  = require('csv-parse/lib/sync');

module.exports = class FlightLog {
  constructor(csv){
    if (!csv) throw('Need a CVS file to parse')

    try {this.filecontents = fs.readFileSync(csv, {encoding: 'utf8'})}
    catch(e){ throw("Can't open file '"+csv+"'") }
    try {this.csvdata = csv_parser(this.filecontents, {columns: true})}
    catch(e){ throw("Failed to read csv data") }
    this.flights = this.generate_flightlog()
    this.routes_found = [];
  }

  generate_flightlog() {
    return this.csvdata.reduce((ob, row, index) => {
      if (!ob[row.from]) ob[row.from] = [];
      ob[row.from].push({code : row.to, dist: row.distance, rowno: index});
      return ob
    }, {})
  }

  dump(what = 'flights'){
    console.log(this[what])
  }

  filter_all(){
    this.filter_circular_flights();
    this.filter_out_and_return();
  }

  filter_circular_flights(){
    for (var start in this.flights){
      this.flights[start] = this.flights[start].filter(end => {
        if (start == end.code) this.routes_found.push([start, end.code]);
        return start != end.code;
      })
    }
  }

  filter_out_and_return(){
    for (var start in this.flights){
      this.flights[start] = this.flights[start].filter(end => this._dead_end(start, end.code))
    }
  }

  _dead_end(home, loc){
    if (home == loc) return true; // Circular route going nowhere
    if (!this.flights[loc]) return true; // no flights out of here to test

    // loop through other places we went from destination airport
    let returnIndex = this.flights[loc].findIndex(el => el.code == home)
    if ( returnIndex != -1){
      // Found a route home. Add to routes_found, remove from flight data and return
      this.routes_found.push([home, loc, home]);
      this.flights[loc].splice(returnIndex,1);
      return false; 
    }
    
    return true; // guess we didn't find a route back home.
  }

}