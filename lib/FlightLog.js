"use strict";

let fs          = require('fs')
  , csv_parser  = require('csv-parse/lib/sync')
  , csv_string  = require('csv-stringify/lib/sync')
  , neo4j       = require('neo4j-driver').v1;
const config = {
  neo4j : {
    host : "bolt://localhost",
    user: "neo4j",
    pass: "pw"
  }
}

module.exports = class FlightLog {
  constructor(csv){
    if (!csv) throw('Need a CVS file to parse')

    try {this.filecontents = fs.readFileSync(csv, {encoding: 'utf8'})}
    catch(e){ throw("Can't open file '"+csv+"'") }
    try {this.csvdata = csv_parser(this.filecontents, {columns: true})}
    catch(e){ throw("Failed to read csv data") }

    // make a flightlog keyed on source airport
    this.flights = this.init_flightlog(); 

    // set up some properties
    this.all_routes = [];
    this.filtered_flights = [];
    this.filtered_routes = [];
    this.flightstats = this.init_flightstats();
    this.programstats = {loopcountall:0, loopcountunused:0}

    // filter circular flights which get in the way
    // circular flights are ones taking off and landing from same location
    this.filter_circular_flights(); 
  }

  dump(what = 'flightstats'){
    console.log('*** This is all the ' + what)
    console.log(this[what])
  }
  debug(text){
    //console.log(text)
  }

  init_flightlog(){
    return this.csvdata.reduce((ob, row, index) => {
      if (!ob[row.Origin]) ob[row.Origin] = [];
      row.original_row_no = index+1;
      row.from            = row["Origin"];
      row.to              = row["Destination"];
      ob[row["Origin"]].push(row);
      return ob
    }, {})
  }

  init_flightstats(){
    let flightstats = {
      flight_count              : this.csvdata.length,
      distinct_source_airports  : Object.keys(this.flights).length,
      max_dests                 : 0
    };
    flightstats.average_dests_count = flightstats.flight_count / flightstats.distinct_source_airports;
    for (var source in this.flights){
      let flightcount = this.flights[source].length;
      flightstats.max_dests = flightcount > flightstats.max_dests ? flightcount : flightstats.max_dests;
    }
    return flightstats;
  }

  neo4j_driver(){
    if (!this.neodriver) this.neodriver = neo4j.driver(config.neo4j.host, neo4j.auth.basic(config.neo4j.user,config.neo4j.pass));
    return this.neodriver;
  }
  close_graph_connection(){
    if (this.neodriver) this.neodriver.close()
  }

  filter_circular_flights(){
    for (var start in this.flights){
      this.flights[start] = this.flights[start].filter(flight => {
        if (start == flight.to) {
          this.filtered_flights.push(flight);
          this.filtered_routes.push([flight]);
          this.all_routes.push([flight])
        }
        return start != flight.to;
      })
    }
    this.flightstats.circular_flights = this.filtered_flights.length;
  }

  filter_out_and_return(){
    const _dead_end = (flight) => {
      if (flight.from == flight.to) return true; // Circular route going nowhere
      if (!this.flights[flight.to]) return true; // no flights out of here to test
  
      // loop through other places we went from destination airport
      let returnIndex = this.flights[flight.to].findIndex(next_flight => next_flight.to == flight.from)
      if ( returnIndex != -1){
        // Found a route home. Add to filtered_flights, filtered_routes, remove from flight data
        this.filtered_flights.push(flight, this.flights[flight.to][returnIndex]);
        this.filtered_routes.push([flight, this.flights[flight.to][returnIndex]]);
        this.flights[flight.to].splice(returnIndex,1);
        return false; // not a dead end
      }
      return true; // we didn't find a route back home.
    };

    let filtered_flights_start = this.filtered_flights.length;
    for (var start in this.flights){
      this.flights[start] = this.flights[start].filter(flight => _dead_end(flight));
    }
    this.flightstats.out_and_return_flights = this.filtered_flights.length - filtered_flights_start;
  }

  find_all_routes(max_route_length){
    let within_route_length_limit = max_route_length ? 
      (length) => length < max_route_length :
      () => true;

    const _travel_home = (start, location = start, path_here = [], visited_locations = {}, dead_ends = {}) => {
      if (!this.flights[location]) return; // going nowhere from here

      let dead_end_count = 0;
      for (let i = this.flights[location].length - 1; i>=0; i--){
        let flight = this.flights[location][i];
  
        this.programstats.loopcountall++;
        if (visited_locations[flight.to] || dead_ends[flight.to]) continue;
        this.programstats.loopcountunused++;
  
        if (flight.to == start){
          // found a way home
          this.all_routes.push(path_here.concat(flight));
        } else if (this.flights[flight.to] && within_route_length_limit(path_here.length)) {
          // not home yet. Where can we go from here. 
          let new_visited = Object.assign({}, visited_locations);
          new_visited[flight.to] = true;
          if (!_travel_home(start, flight.to, path_here.concat(flight), new_visited, dead_ends)){
            dead_ends[flight.to] = true;
            dead_end_count++; 
          }
        }
      }
      return this.flights[location].length != dead_end_count; 
    }

    for (var start in this.flights){
      _travel_home(start)
    }
    this.flightstats.routes_found = this.all_routes.length
  }

  graph_data(){
    // find all the unique node names
    let all_flights = [];
    let all_locations = {};

    for (var start in this.flights){
      this.flights[start].forEach(f => {
        all_locations[f.from] = {
          name    : f["Origin Name"],
          city    : f["Origin City"],
          country : f["Origin Country"],
        }
        all_locations[f.to] = {
          name    : f["Destination Name"],
          city    : f["Destination City"],
          country : f["Destination Country"],
        }
        all_flights.push({
          from          : f.from,
          to            : f.to,
          time          : f["Total Time"],
          aircraft_reg  : f["Aircraft Registration"],
          aircraft_desc : f["Aircraft Description"],
          distance      : f["Distance Flown"],
        });
      });
    }
    let mystringify = (hash) => {
      return Object.keys(hash).map((e) => e + ':' + '"'+ hash[e] +'"').join(',')
    }
    let nodes_qry = ' CREATE ' +
      Object.keys(all_locations)
      .map(key => "(x" + key + ":Airport {" +  mystringify(all_locations[key]) + "})")
      .join(',');
    let flight_qry = ' CREATE ' +
      all_flights
      .map(f => '(x'+f.from+')-[:Flight {' + mystringify(f) + '}]->(x'+f.to+')')
      .join(',');

    let session = this.neo4j_driver().session();
    session
      .run(nodes_qry + flight_qry + ' RETURN *')
      .then(result => {
        console.log('that seemed to go well?')
        session.close();
        this.close_graph_connection()
      })
      .catch(error => {
        console.log(error);
        session.close();
        this.close_graph_connection()
      });

  }

  csv_output(dir){
    // write out filtered flights
    fs.writeFileSync('data/output_filtered.csv',
      csv_string(this.filtered_flights.sort((a,b)=>a.original_row_no-b.original_row_no), {header:true})
    );
    // write out remaining flights
    let remaining_flights = [];
    Object.keys(this.flights).forEach(key=>remaining_flights = remaining_flights.concat(this.flights[key]));
    fs.writeFileSync('data/output_remaining.csv',
      csv_string(remaining_flights.sort((a,b)=>a.original_row_no-b.original_row_no), {header:true})
    );
  }

}