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
    this.loopcountall = 0;
    this.loopcountunused = 0
    this.find_all_routes(); // find all possible longer routes
  }

  dump(what = 'flights'){
    console.log('*** This is all the ' + what)
    console.log(this[what])
  }

  generate_flightlog() {
    return this.csvdata.reduce((ob, row, index) => {
      if (!ob[row.Origin]) ob[row.Origin] = [];
      ob[row.Origin].push({
        from    : row["Origin"],
        to      : row["Destination"],
        distance: row['Distance Flown'],
        id      : index+1
      });
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
    console.log(this.loopcountall + ' total iterations and ' +  this.loopcountunused + ' unused iterations')
  }

  _travel(start, path_here = [], used_locations = {}, location = start){
    if (!this.flights[location]) return; // going nowhere from here

    this.flights[location].forEach(flight => {
      this.loopcountall++;
      //if(this.loopcountall % 1000000 == 0) console.log(this.loopcountall + ' total iterations')
      if (used_locations[flight.to]) return;

      this.loopcountunused++;
      //if(this.loopcountunused % 1000000 == 0) console.log(this.loopcountunused + ' unused iterations')

      if (flight.to == start){
        this.all_routes.push(path_here.concat(flight)); // we have one.
      } else if (this.flights[flight.to]) {
        // not home yet. Where can we go from here. 
        let new_used = Object.assign({}, used_locations);
        new_used[flight.to] = true;
        this._travel(start, path_here.concat(flight), new_used, flight.to)
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

}