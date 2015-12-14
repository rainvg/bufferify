'use strict';

var assert = require('assert');
var bufferify = require('../main');

describe('bufferify', function ()
{
  it('should pack and unpack json', function()
  {

    var original = {1: new Buffer(1024), "a": 3, "b": [1, 2, 3, new Buffer(2), new Buffer(2)]};

    var packed = bufferify.pack(original);
    var unpacked = bufferify.unpack(packed);

    assert.deepEqual(original, unpacked, 'Buffers not equal');
  });
});
