"use strict";

module.exports = class FlightLog {
  constructor(csv = ''){
    this.flights = {
      "a" : [
        { code : "b", dist: 200, rowno: 1 },
        { code : "c", dist: 300, rowno: 2 },
      ],
      "b": [
        { code : "b", dist: 0, rowno: 3 },
        { code : "c", dist: 100, rowno: 4 },
        { code : "a", dist: 200, rowno: 5 },
        { code : "a", dist: 200, rowno: 6 },
      ],
      "c": [
        { code : "a", dist: 300, rowno: 7 },
      ]
    }
  }

  dump(){
    console.log(this.flights)
  }

  filter_all(){
    this.filter_circular_flights();
    this.filter_out_and_return();
  }

  filter_circular_flights(){
    for (var start in this.flights){
      this.flights[start] = this.flights[start].filter(end => start != end.code )
    }
  }

  filter_out_and_return(){
    for (var start in this.flights){
      this.flights[start] = this.flights[start].filter(end => this.dead_end(start, end.code))
    }
  }

  dead_end(home, loc, flights = this.flights){
    if (!flights[loc]) return true; // no flights out of here to test

    // loop through other places we went from destination airport
    let returnIndex = flights[loc].findIndex(el => el.code == home)
    if ( returnIndex != -1){
      // Found a route home. Remove from flight data and return
      flights[loc].splice(returnIndex,1);
      return false; 
    }
    
    return true; // guess we didn't find a route back home.
  }

}