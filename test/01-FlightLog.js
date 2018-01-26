"use strict";

let should  = require('should')
  , path    = require('path')
let FL      = require('../lib/Flightlog');
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
      [{ from: 'a', to: 'a', "Origin": "a", "Origin Name": "a", "Destination": "a", "Destination Name": "a", "Distance Flown": '0', original_row_no: 1, "Aircraft Description": "_", "Aircraft Registration": "_", "Destination City": "_", "Destination Country": "_", "Origin City": "_", "Origin Country": "_", "Total Time": "_" }],
      [{ from: 'b', to: 'b', "Origin": "b", "Origin Name": "b", "Destination": "b", "Destination Name": "b", "Distance Flown": '0', original_row_no: 6, "Aircraft Description": "_", "Aircraft Registration": "_", "Destination City": "_", "Destination Country": "_", "Origin City": "_", "Origin Country": "_", "Total Time": "_" }]
    ])
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
      [{ from: 'a', to: 'a', original_row_no: 1, "Origin": "a", "Origin Name": "a", "Destination": "a", "Destination Name": "a", "Distance Flown": '0', "Aircraft Description": "_", "Aircraft Registration": "_", "Destination City": "_", "Destination Country": "_", "Origin City": "_", "Origin Country": "_", "Total Time": "_" }],
      [{ from: 'b', to: 'b', original_row_no: 6, "Origin": "b", "Origin Name": "b", "Destination": "b", "Destination Name": "b", "Distance Flown": '0', "Aircraft Description": "_", "Aircraft Registration": "_", "Destination City": "_", "Destination Country": "_", "Origin City": "_", "Origin Country": "_", "Total Time": "_" }],
      [{ from: 'a', to: 'b', original_row_no: 2, "Origin": "a", "Origin Name": "a", "Destination": "b", "Destination Name": "b", "Distance Flown": '300', "Aircraft Description": "_", "Aircraft Registration": "_", "Destination City": "_", "Destination Country": "_", "Origin City": "_", "Origin Country": "_", "Total Time": "_" },
       { from: 'b', to: 'a', original_row_no: 4, "Origin": "b", "Origin Name": "b", "Destination": "a", "Destination Name": "a", "Distance Flown": '300', "Aircraft Description": "_", "Aircraft Registration": "_", "Destination City": "_", "Destination Country": "_", "Origin City": "_", "Origin Country": "_", "Total Time": "_" }],
      [{ from: 'a', to: 'c', original_row_no: 3, "Origin": "a", "Origin Name": "a", "Destination": "c", "Destination Name": "c", "Distance Flown": '500', "Aircraft Description": "_", "Aircraft Registration": "_", "Destination City": "_", "Destination Country": "_", "Origin City": "_", "Origin Country": "_", "Total Time": "_" },
       { from: 'c', to: 'a', original_row_no: 8, "Origin": "c", "Origin Name": "c", "Destination": "a", "Destination Name": "a", "Distance Flown": '500', "Aircraft Description": "_", "Aircraft Registration": "_", "Destination City": "_", "Destination Country": "_", "Origin City": "_", "Origin Country": "_", "Total Time": "_" }]
    ])
    done();
  });


  it('should find all possible routes', done => {
    let fl = new FL(testcsv);
    fl.find_all_routes();
    fl.all_routes.should.deepEqual([
      [ { from: 'a', to: 'a', original_row_no: 1, "Origin": "a", "Origin Name": "a", "Destination": "a", "Destination Name": "a", "Distance Flown": '0', "Aircraft Description": "_", "Aircraft Registration": "_", "Destination City": "_", "Destination Country": "_", "Origin City": "_", "Origin Country": "_", "Total Time": "_" } ],
      [ { from: 'b', to: 'b', original_row_no: 6, "Origin": "b", "Origin Name": "b", "Destination": "b", "Destination Name": "b", "Distance Flown": '0', "Aircraft Description": "_", "Aircraft Registration": "_", "Destination City": "_", "Destination Country": "_", "Origin City": "_", "Origin Country": "_", "Total Time": "_"  } ],
      [ { from: 'a', to: 'c', original_row_no: 3, "Origin": "a", "Origin Name": "a", "Destination": "c", "Destination Name": "c", "Distance Flown": '500', "Aircraft Description": "_", "Aircraft Registration": "_", "Destination City": "_", "Destination Country": "_", "Origin City": "_", "Origin Country": "_", "Total Time": "_"  },
        { from: 'c', to: 'a', original_row_no: 8, "Origin": "c", "Origin Name": "c", "Destination": "a", "Destination Name": "a", "Distance Flown": '500', "Aircraft Description": "_", "Aircraft Registration": "_", "Destination City": "_", "Destination Country": "_", "Origin City": "_", "Origin Country": "_", "Total Time": "_"  } ],
      [ { from: 'a', to: 'b', original_row_no: 2, "Origin": "a", "Origin Name": "a", "Destination": "b", "Destination Name": "b", "Distance Flown": '300', "Aircraft Description": "_", "Aircraft Registration": "_", "Destination City": "_", "Destination Country": "_", "Origin City": "_", "Origin Country": "_", "Total Time": "_"  },
        { from: 'b', to: 'c', original_row_no: 7, "Origin": "b", "Origin Name": "b", "Destination": "c", "Destination Name": "c", "Distance Flown": '400', "Aircraft Description": "_", "Aircraft Registration": "_", "Destination City": "_", "Destination Country": "_", "Origin City": "_", "Origin Country": "_", "Total Time": "_"  },
        { from: 'c', to: 'a', original_row_no: 8, "Origin": "c", "Origin Name": "c", "Destination": "a", "Destination Name": "a", "Distance Flown": '500', "Aircraft Description": "_", "Aircraft Registration": "_", "Destination City": "_", "Destination Country": "_", "Origin City": "_", "Origin Country": "_", "Total Time": "_"  } ],
      [ { from: 'a', to: 'b', original_row_no: 2, "Origin": "a", "Origin Name": "a", "Destination": "b", "Destination Name": "b", "Distance Flown": '300', "Aircraft Description": "_", "Aircraft Registration": "_", "Destination City": "_", "Destination Country": "_", "Origin City": "_", "Origin Country": "_", "Total Time": "_"  },
        { from: 'b', to: 'a', original_row_no: 5, "Origin": "b", "Origin Name": "b", "Destination": "a", "Destination Name": "a", "Distance Flown": '300', "Aircraft Description": "_", "Aircraft Registration": "_", "Destination City": "_", "Destination Country": "_", "Origin City": "_", "Origin Country": "_", "Total Time": "_"  } ],
      [ { from: 'a', to: 'b', original_row_no: 2, "Origin": "a", "Origin Name": "a", "Destination": "b", "Destination Name": "b", "Distance Flown": '300', "Aircraft Description": "_", "Aircraft Registration": "_", "Destination City": "_", "Destination Country": "_", "Origin City": "_", "Origin Country": "_", "Total Time": "_"  },
        { from: 'b', to: 'a', original_row_no: 4, "Origin": "b", "Origin Name": "b", "Destination": "a", "Destination Name": "a", "Distance Flown": '300', "Aircraft Description": "_", "Aircraft Registration": "_", "Destination City": "_", "Destination Country": "_", "Origin City": "_", "Origin Country": "_", "Total Time": "_"  } ],
      [ { from: 'b', to: 'c', original_row_no: 7, "Origin": "b", "Origin Name": "b", "Destination": "c", "Destination Name": "c", "Distance Flown": '400', "Aircraft Description": "_", "Aircraft Registration": "_", "Destination City": "_", "Destination Country": "_", "Origin City": "_", "Origin Country": "_", "Total Time": "_"  },
        { from: 'c', to: 'a', original_row_no: 8, "Origin": "c", "Origin Name": "c", "Destination": "a", "Destination Name": "a", "Distance Flown": '500', "Aircraft Description": "_", "Aircraft Registration": "_", "Destination City": "_", "Destination Country": "_", "Origin City": "_", "Origin Country": "_", "Total Time": "_"  },
        { from: 'a', to: 'b', original_row_no: 2, "Origin": "a", "Origin Name": "a", "Destination": "b", "Destination Name": "b", "Distance Flown": '300', "Aircraft Description": "_", "Aircraft Registration": "_", "Destination City": "_", "Destination Country": "_", "Origin City": "_", "Origin Country": "_", "Total Time": "_"  } ],
      [ { from: 'b', to: 'a', original_row_no: 5, "Origin": "b", "Origin Name": "b", "Destination": "a", "Destination Name": "a", "Distance Flown": '300', "Aircraft Description": "_", "Aircraft Registration": "_", "Destination City": "_", "Destination Country": "_", "Origin City": "_", "Origin Country": "_", "Total Time": "_"  },
        { from: 'a', to: 'b', original_row_no: 2, "Origin": "a", "Origin Name": "a", "Destination": "b", "Destination Name": "b", "Distance Flown": '300', "Aircraft Description": "_", "Aircraft Registration": "_", "Destination City": "_", "Destination Country": "_", "Origin City": "_", "Origin Country": "_", "Total Time": "_"  } ],
      [ { from: 'b', to: 'a', original_row_no: 4, "Origin": "b", "Origin Name": "b", "Destination": "a", "Destination Name": "a", "Distance Flown": '300', "Aircraft Description": "_", "Aircraft Registration": "_", "Destination City": "_", "Destination Country": "_", "Origin City": "_", "Origin Country": "_", "Total Time": "_"  },
        { from: 'a', to: 'b', original_row_no: 2, "Origin": "a", "Origin Name": "a", "Destination": "b", "Destination Name": "b", "Distance Flown": '300', "Aircraft Description": "_", "Aircraft Registration": "_", "Destination City": "_", "Destination Country": "_", "Origin City": "_", "Origin Country": "_", "Total Time": "_"  } ],
      [ { from: 'c', to: 'a', original_row_no: 8, "Origin": "c", "Origin Name": "c", "Destination": "a", "Destination Name": "a", "Distance Flown": '500', "Aircraft Description": "_", "Aircraft Registration": "_", "Destination City": "_", "Destination Country": "_", "Origin City": "_", "Origin Country": "_", "Total Time": "_"  },
        { from: 'a', to: 'c', original_row_no: 3, "Origin": "a", "Origin Name": "a", "Destination": "c", "Destination Name": "c", "Distance Flown": '500', "Aircraft Description": "_", "Aircraft Registration": "_", "Destination City": "_", "Destination Country": "_", "Origin City": "_", "Origin Country": "_", "Total Time": "_"  } ],
      [ { from: 'c', to: 'a', original_row_no: 8, "Origin": "c", "Origin Name": "c", "Destination": "a", "Destination Name": "a", "Distance Flown": '500', "Aircraft Description": "_", "Aircraft Registration": "_", "Destination City": "_", "Destination Country": "_", "Origin City": "_", "Origin Country": "_", "Total Time": "_"  },
        { from: 'a', to: 'b', original_row_no: 2, "Origin": "a", "Origin Name": "a", "Destination": "b", "Destination Name": "b", "Distance Flown": '300', "Aircraft Description": "_", "Aircraft Registration": "_", "Destination City": "_", "Destination Country": "_", "Origin City": "_", "Origin Country": "_", "Total Time": "_"  },
        { from: 'b', to: 'c', original_row_no: 7, "Origin": "b", "Origin Name": "b", "Destination": "c", "Destination Name": "c", "Distance Flown": '400', "Aircraft Description": "_", "Aircraft Registration": "_", "Destination City": "_", "Destination Country": "_", "Origin City": "_", "Origin Country": "_", "Total Time": "_"  } ]
    ]);
    done();
  });

});