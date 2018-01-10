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

    this.flights = this.generate_flightlog(); // make a flightlog keyed on source airport

    // set up filtered_routes property and filter circular flights which get in the way
    // circular flights are ones taking off and landing from same location
    this.filtered_routes = [];
    this.filter_circular_flights(); 

    // populate 'all_routes' property
    this.all_routes = this.filtered_routes.slice(); // add filtered circular routes to 'all routes' for completeness
    this.find_all_routes(); // find all possible longer routes
  }

  dump(what = 'flights'){
    console.log('*** This is all the ' + what)
    console.log(this[what])
  }

  generate_flightlog() {
    return this.csvdata.reduce((ob, row, index) => {
      row.id = index+1;
      if (!ob[row.from]) ob[row.from] = [];
      ob[row.from].push(row);
      return ob
    }, {})
  }

  filter_circular_flights(){
    for (var start in this.flights){
      this.flights[start] = this.flights[start].filter(flight => {
        if (start == flight.to) this.filtered_routes.push([flight]);
        return start != flight.to;
      })
    }
  }

  find_all_routes(){
    for (var start in this.flights){
      this._travel(start)
    }
  }

  _travel(start, path_here = [], used_flights = {}, location = start){
    if (!this.flights[location]) return; // going nowhere from here

    this.flights[location].forEach(flight => {
      if (used_flights[flight.id]) return;

      // Keep track of path so far
      let new_path = path_here.concat(flight);

      if (flight.to == start){
        this.all_routes.push(new_path); // we have one.
      } else {
        // not home yet. Where can we go from here. 
        let new_used = Object.assign({}, used_flights);
        new_used[flight.id] = true;
        this._travel(start, new_path, new_used, flight.to)
      }
    })
  }

  filter_out_and_return(){
    for (var start in this.flights){
      this.flights[start] = this.flights[start].filter(flight => this._dead_end(flight))
    }
  }

  _dead_end(flight){
    if (flight.from == flight.to) return true; // Circular route going nowhere
    if (!this.flights[flight.to]) return true; // no flights out of here to test

    // loop through other places we went from destination airport
    let returnIndex = this.flights[flight.to].findIndex(next_flight => next_flight.to == flight.from)
    if ( returnIndex != -1){
      // Found a route home. Add to filtered_routes, remove from flight data and return
      this.filtered_routes.push([flight, this.flights[flight.to][returnIndex]]);
      this.flights[flight.to].splice(returnIndex,1);
      return false; 
    }
    return true; // we didn't find a route back home.
  }

  filter_long_routes(){ // smart_filter?
    this.all_routes = this.find_all_routes();
    // possible tactics
    // * Get rid of longest routes until no more available
    //   * longest by number of hops, or by distance
    // * Find biggest set of of non-colliding routes
    //   * biggest by number of hops, or by distance
  }

}