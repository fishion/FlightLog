"use strict";

/* Glossary

  Flight        - A single flight with source and a destination airports
  Route         - one or more location-connected flights starting and ending at same location
  N leg routes  - A route containing N individual flights
*/

let fs          = require('fs')
  , csv_parser  = require('csv-parse/lib/sync')
  , csv_string  = require('csv-stringify/lib/sync')
  , neo4j       = require('neo4j-driver');

const config = {
  neo4j : {
    host : "neo4j://localhost",
    user: "neo4j",
    pass: "pw"
  }
}

module.exports = class FlightLog {
  constructor(csv){
    if (!csv) throw('Need a CVS file to parse')

    // check we can read the data
    try {this.fileContents = fs.readFileSync(csv, {encoding: 'utf8'})}
    catch(e){ throw("Can't open file '"+csv+"'") }
    try {this.csvdata = csv_parser(this.fileContents, {columns: true})}
    catch(e){ throw("Failed to read csv data") }

    // make a flightlog keyed on source airport
    this.flights = this.initFlightlog(); 
    // init up some properties
    this.allRoutes = [];
    this.filteredFlights = [];
    this.filteredRoutes = [];

    // initialise stats objects
    this.flightStats = this.initFlightStats();
    this.programStats = {routeLegsAnalized:0, routeLegsAnalizedUnique:0}

    // filter short routes, i.e. routes with one or two flights starting and ending at single Airport
    this.filterOneLegRoutes(); 
    this.filterTwoLegRoutes(); 
  }

  dump(what = 'flightStats'){
    console.log('*** This is all the ' + what)
    console.log(this[what])
  }
  debug(text){
    //console.log(text)
  }

  /*
    turns the csv rows into an object, with Origin airport as keys
  */
  initFlightlog(){
    return this.csvdata.reduce((ob, row, index) => {
      if (!ob[row.Origin]) ob[row.Origin] = [];
      row.originalRowNo = index+1;
      row.from            = row["Origin"];
      row.to              = row["Destination"];
      ob[row["Origin"]].push(row);
      return ob
    }, {})
  }

  /*
    Sets up a stats object with some basic stats on source data
  */
  initFlightStats(){
    let flightStats = {
      flightCount             : this.csvdata.length,
      distinctSourceAirports  : Object.keys(this.flights).length,
      maximumDestinations     : 0
    };
    flightStats.averageDestinations = flightStats.flightCount / flightStats.distinctSourceAirports;
    for (var source in this.flights){
      let flightcount = this.flights[source].length;
      flightStats.maximumDestinations = flightcount > flightStats.maximumDestinations ? flightcount : flightStats.maximumDestinations;
    }
    return flightStats;
  }

  /* Neo4j drivers */
  neo4jDriver(){
    if (!this.neoDriver) {
      this.neoDriver = neo4j.driver(
        config.neo4j.host,
        neo4j.auth.basic(config.neo4j.user, config.neo4j.pass)
      );
    }
    return this.neoDriver;
  }
  closeGraphConnection(){
    if (this.neoDriver) this.neoDriver.close()
  }

  /*
    remove flights which start and end at same location
    Add any found to 'filteredFlights', 'filteredRoutes' and 'allRoute' collections
  */
  filterOneLegRoutes(){
    for (var start in this.flights){
      this.flights[start] = this.flights[start].filter(flight => {
        if (start == flight.to) {
          this.filteredFlights.push(flight);
          this.filteredRoutes.push([flight]);
          this.allRoutes.push([flight])
        }
        return start != flight.to;
      })
    }
    this.flightStats.oneLegRoutes = this.filteredFlights.length;
  }

  /*
    remove flights in Two-leg routes.
    i.e. source and destination of one flight match destination and source of another
    Add any found to 'filteredFlights', 'filteredRoutes' and 'allRoute' collections
  */
  filterTwoLegRoutes(){
    const _deadEnd = (flight) => {
      if (flight.from == flight.to) return true; // One leg route going nowhere (should already have been filtered)
      if (!this.flights[flight.to]) return true; // no flights out of here to test
  
      // loop through other places we went from destination airport
      let returnIndex = this.flights[flight.to].findIndex(next_flight => next_flight.to == flight.from)
      if ( returnIndex != -1){
        // Found a route home. Add to filteredFlights, filteredRoutes, allRoutes remove from flight data
        this.filteredFlights.push(flight, this.flights[flight.to][returnIndex]);
        this.filteredRoutes.push([flight, this.flights[flight.to][returnIndex]]);
        this.allRoutes.push([flight, this.flights[flight.to][returnIndex]])
        this.flights[flight.to].splice(returnIndex,1);
        return false; // not a dead end
      }
      return true; // we didn't find a route back home.
    };

    let filteredFlightsCountStart = this.filteredFlights.length;
    for (var start in this.flights){
      this.flights[start] = this.flights[start].filter(flight => _deadEnd(flight));
    }
    this.flightStats.twoLegRoutes = this.filteredFlights.length - filteredFlightsCountStart;
  }

  /*
    Follow routes for maxRouteLength legs to try to find a lath back to original source airport
    Adds any found to 'allRoutes' but doesn't filter the flights out. This means that some flights
    may be used in multiple different routes found in this routine
  */
  findAllRoutes(maxRouteLength){
    const _withinRouteLengthLimit = maxRouteLength ? 
      length => length < maxRouteLength :
      () => true;

    const _travelHome = (start, location = start, path_here = [], visited_locations = {}, deadEnds = {}) => {
      const flightsFromHere = this.flights[location]
      if (!flightsFromHere) return; // going nowhere from here

      let deadEndCount = 0;
      for (let i = flightsFromHere.length - 1; i>=0; i--){
        let flight = flightsFromHere[i];
        this.programStats.routeLegsAnalized++;

        if (visited_locations[flight.to] || deadEnds[flight.to]) continue;
        this.programStats.routeLegsAnalizedUnique++;
  
        if (flight.to == start){
          // found a way home
          this.allRoutes.push(path_here.concat(flight));
        } else if (this.flights[flight.to] && _withinRouteLengthLimit(path_here.length)) {
          // not home yet. Where can we go from here. 
          let newVisited = Object.assign({}, visited_locations);
          newVisited[flight.to] = true;
          if (!_travelHome(start, flight.to, path_here.concat(flight), newVisited, deadEnds)){
            deadEnds[flight.to] = true;
            deadEndCount++; 
          }
        }
      }
      return this.flights[location].length != deadEndCount; 
    }

    for (var start in this.flights){
      _travelHome(start)
    }
    this.flightStats.routesFound = this.allRoutes.length
  }

  graph_data(){
    // find all the unique node names
    let allFlights = [];
    let allAirports = {};

    for (var start in this.flights){
      this.flights[start].forEach(f => {
        allAirports[f.from] = {
          name    : f["Origin Name"],
          city    : f["Origin City"],
          country : f["Origin Country"],
        }
        allAirports[f.to] = {
          name    : f["Destination Name"],
          city    : f["Destination City"],
          country : f["Destination Country"],
        }
        allFlights.push({
          from          : f.from,
          to            : f.to,
          time          : f["Total Time"],
          aircraft_reg  : f["Aircraft Registration"],
          aircraft_desc : f["Aircraft Description"],
          distance      : f["Distance Flown"],
        });
      });
    }
    this.flightStats.graphedAirports = Object.keys(allAirports).length;

    let mystringify = (hash) => {
      return Object.keys(hash).map((e) => e + ':' + '"'+ hash[e] +'"').join(',')
    }
    let nodesQuery = ' CREATE ' +
      Object.keys(allAirports)
      .map(key => "(x" + key + ":Airport {" +  mystringify(allAirports[key]) + "})")
      .join(',');
    let flightQuery = ' CREATE ' +
      allFlights
      .map(f => '(x'+f.from+')-[:Flight {' + mystringify(f) + '}]->(x'+f.to+')')
      .join(',');

    let session = this.neo4jDriver().session();
    session
      .run("MATCH (n) DETACH DELETE n")
      .then(result => {
        return session.run(nodesQuery + flightQuery + ' RETURN *')
      })
      .then(result => {
        console.log('that seemed to go well?')
        session.close();
        this.closeGraphConnection()
      })
      .catch(error => {
        console.log(error);
        session.close();
        this.closeGraphConnection()
      });
  }

  csv_output(dir){
    // write out filtered flights
    fs.writeFileSync('data/output_filtered.csv',
      csv_string(this.filteredFlights.sort((a,b)=>a.originalRowNo-b.originalRowNo), {header:true})
    );
    // write out remaining flights
    let remaining_flights = [];
    Object.keys(this.flights).forEach(key=>remaining_flights = remaining_flights.concat(this.flights[key]));
    fs.writeFileSync('data/output_remaining.csv',
      csv_string(remaining_flights.sort((a,b)=>a.originalRowNo-b.originalRowNo), {header:true})
    );
  }

}