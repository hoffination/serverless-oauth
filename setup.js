global.td = require('testdouble');
global.expect = require('expect');

require('testdouble-jest')(td, jest);

afterEach(function() {
  td.reset();
});
