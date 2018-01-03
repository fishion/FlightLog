"use strict";

let should  = require('should')
let FL      = require('../Flightlog');

let test_data = {
  "a" : [
    { code : "a", dist: 0, rowno: 1 },
    { code : "b", dist: 300, rowno: 2 },
    { code : "c", dist: 500, rowno: 3 },
  ],
  "b": [
    { code : "a", dist: 300, rowno: 4 },
    { code : "a", dist: 300, rowno: 5 },
    { code : "b", dist: 0, rowno: 6 },
    { code : "c", dist: 400, rowno: 7 },
  ],
  "c": [
    { code : "a", dist: 500, rowno: 8 },
  ]
}

describe('Test constructor', () => {
  it('should be able to build an object with test object', done => {
    let fl = new FL(undefined, test_data);
    fl.flights.should.be.an.Object();
    fl.flights.a.should.be.an.Array();
    done();
  })
});

describe('Test object methods', () => {

  it('should have a dump method', done => {
    let fl = new FL(undefined, test_data);
    fl.dump.should.be.a.Function();
    done();
  })

  it('should be able to filter flights starting and ending at same place', done => {
    let fl = new FL(undefined, test_data)
      , b_dests = fl.flights.b.length
    ;

    fl.flights.b[2].code.should.equal('b');
    fl.filter_circular_flights();
    fl.flights.b.length.should.equal(b_dests - 1);
    fl.flights.b[2].code.should.not.equal('b');
    fl.routes_found.should.deepEqual([
      ['a','a'],
      ['b','b']
    ])
    done();
  })

  it('should be able to pair and filter simple out and return flights', done => {
    let fl = new FL(undefined, test_data)
      , a_dests = fl.flights.a.length
      , b_dests = fl.flights.b.length
      , c_dests = fl.flights.c.length
    ;

    fl.filter_out_and_return();
    fl.flights.a.length.should.equal(a_dests - 2);
    fl.flights.b.length.should.equal(b_dests - 1);
    fl.flights.c.length.should.equal(c_dests - 1);
    fl.routes_found.should.deepEqual([
      ['a','b','a'],
      ['a','c','a']
    ])
    done();
  });

  // it('should be able to preferentially filter longest routes', done => {
  //   let fl = new FL(undefined, test_data)
  //     , a_dests = fl.flights.a.length
  //     , b_dests = fl.flights.b.length
  //     , c_dests = fl.flights.c.length
  //   ;

  //   fl.filter_long_routes();
  //   fl.flights.a.length.should.equal(a_dests - 1);
  //   fl.flights.b.length.should.equal(b_dests - 1);
  //   fl.flights.c.length.should.equal(c_dests - 1);
  //   fl.routes_found.should.deepEqual([
  //     ['a','b','c']
  //   ])
  //   done();
  // });

});