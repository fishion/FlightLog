"use strict";

let should  = require('should')
let FL      = require('../Flightlog');

describe('Test constructor', () => {
  
});

describe('Test object methods', () => {
  let fl = new FL();
  it('Should have a dump method', done => {
    fl.dump.should.be.a.Function();
    done();
  })
});