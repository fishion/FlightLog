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

    // generate flightstats
    this.flightstats = {flight_count: this.csvdata.length, distinct_source_airports:Object.keys(this.flights).length, max_dests: 0};
    this.flightstats.average_dests_count = this.flightstats.flight_count / this.flightstats.distinct_source_airports;
    for (var source in this.flights){
      let flightcount = this.flights[source].length;
      this.flightstats.max_dests = flightcount > this.flightstats.max_dests ? flightcount : this.flightstats.max_dests;
    }
    this.programstats = {loopcountall:0, loopcountunused:0}

    // set up filtered_routes property and filter circular flights which get in the way
    // circular flights are ones taking off and landing from same location
    this.filtered_routes = [];
    this.filter_circular_flights(); 

    // populate 'all_routes' property
    this.all_routes = this.filtered_routes.slice(); // add filtered circular routes to 'all routes' for completeness
    this.find_all_routes(); // find all possible longer routes
  }

  dump(what = 'flightstats'){
    console.log('*** This is all the ' + what)
    console.log(this[what])
  }
  debug(text){
    //console.log(text)
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
    this.flightstats.routes_found = this.all_routes.length
  }

  _travel(start, location = start, path_here = [], visited_locations = {}){
    if (!this.flights[location]) return; // going nowhere from here

    for (let i = this.flights[location].length - 1; i>=0; i--){
      let flight = this.flights[location][i];
      this.programstats.loopcountall++;
      if (visited_locations[flight.to]) continue;

      this.programstats.loopcountunused++;

      if (flight.to == start){
        // found a way home
        this.all_routes.push(path_here.concat(flight));
      } else if (this.flights[flight.to]) {
        // not home yet. Where can we go from here. 
        let new_visited = Object.assign({}, visited_locations);
        new_visited[flight.to] = true;
        this._travel(start, flight.to, path_here.concat(flight), new_visited)
      }
    }
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