"use strict";

let should  = require('should')
  , path    = require('path')
let FL      = require('../Flightlog');
let testcsv = path.join(__dirname,'flightlog.csv')

describe('Test constructor', () => {
  it('should throw an error if created with no csv', done => {
    let error = ''
    try { let fl = new FL() } catch (e){ error = e }
    error.should.equal('Need a CVS file to parse')
    done();
  })
  it('should throw an error if cant find csv file', done => {
    let error = ''
    try { let fl = new FL('notafile') } catch (e){ error = e }
    error.should.equal("Can't open file 'notafile'")
    done();
  })
  it('should be able to build an object with test object', done => {
    let fl = new FL(testcsv);
    fl.flights.should.be.an.Object();
    fl.flights.a.should.be.an.Array();
    done();
  })
});

describe('Test object methods', () => {

  it('should have a dump method', done => {
    let fl = new FL(testcsv);
    fl.dump.should.be.a.Function();
    done();
  })

  it('should have flights starting and ending at same place auto filtered', done => {
    let fl = new FL(testcsv);

    fl.flights.b.length.should.equal(3);
    fl.flights.b[2].to.should.not.equal('b');
    fl.filtered_routes.should.deepEqual([
      [{ from: 'a', to: 'a', distance: '0', id: 1 }],
      [{ from: 'b', to: 'b', distance: '0', id: 6 }]
    ])
    done();
  })

  it('should find all possible routes', done => {
    let fl = new FL(testcsv)
    fl.all_routes.should.deepEqual([
      [ { from: 'a', to: 'a', distance: '0', id: 1 } ],
      [ { from: 'b', to: 'b', distance: '0', id: 6 } ],
      [ { from: 'a', to: 'c', distance: '500', id: 3 },
        { from: 'c', to: 'a', distance: '500', id: 8 } ],
      [ { from: 'a', to: 'b', distance: '300', id: 2 },
        { from: 'b', to: 'c', distance: '400', id: 7 },
        { from: 'c', to: 'a', distance: '500', id: 8 } ],
      [ { from: 'a', to: 'b', distance: '300', id: 2 },
        { from: 'b', to: 'a', distance: '300', id: 5 } ],
      [ { from: 'a', to: 'b', distance: '300', id: 2 },
        { from: 'b', to: 'a', distance: '300', id: 4 } ],
      [ { from: 'b', to: 'c', distance: '400', id: 7 },
        { from: 'c', to: 'a', distance: '500', id: 8 },
        { from: 'a', to: 'b', distance: '300', id: 2 } ],
      [ { from: 'b', to: 'a', distance: '300', id: 5 },
        { from: 'a', to: 'b', distance: '300', id: 2 } ],
      [ { from: 'b', to: 'a', distance: '300', id: 4 },
        { from: 'a', to: 'b', distance: '300', id: 2 } ],
      [ { from: 'c', to: 'a', distance: '500', id: 8 },
        { from: 'a', to: 'c', distance: '500', id: 3 } ],
      [ { from: 'c', to: 'a', distance: '500', id: 8 },
        { from: 'a', to: 'b', distance: '300', id: 2 },
        { from: 'b', to: 'c', distance: '400', id: 7 } ]
    ]);
    done();
  });

  it('should find best route sets', done => {
    let fl = new FL(testcsv)
    //fl.find_best_sets();
    done();
  })

  it('should be able to pair and filter simple out and return flights', done => {
    let fl = new FL(testcsv)
      , a_dests = fl.flights.a.length
      , b_dests = fl.flights.b.length
      , c_dests = fl.flights.c.length
    ;

    fl.filter_out_and_return();
    fl.flights.a.length.should.equal(a_dests - 2);
    fl.flights.b.length.should.equal(b_dests - 1);
    fl.flights.c.length.should.equal(c_dests - 1);
    fl.filtered_routes.should.deepEqual([
      [{ from: 'a', to: 'a', distance: '0', id: 1 }],
      [{ from: 'b', to: 'b', distance: '0', id: 6 }],
      [{ from: 'a', to: 'b', distance: '300', id: 2 },
       { from: 'b', to: 'a', distance: '300', id: 4 }],
      [{ from: 'a', to: 'c', distance: '500', id: 3 },
       { from: 'c', to: 'a', distance: '500', id: 8 }]
    ])
    done();
  });




});