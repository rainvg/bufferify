'use strict';

var assert = require('assert');
var zlib = require('zlib');
var bufferify = require('../main');

describe('bufferify', function ()
{
  it('should pack and unpack json', function()
  {
    var original = {1: new Buffer(1024), "a": 3, "b": [1, 2, 3, new Buffer(2), new Buffer(2), "test string"]};

    var packed = bufferify.pack(original);
    var unpacked = bufferify.unpack(packed);

    assert.deepEqual(original, unpacked, 'Buffers not equal');
  });

  it('should throw error 0 when gzip fails', function()
  {
    try
    {
      bufferify.unpack(new Buffer(1024));
      assert(false);
    }
    catch (error)
    {
      assert.equal(error.code, 0);
    }
  });

  it('should throw error 1 when buffer is smaller than 4 bytes', function()
  {
    try
    {
      bufferify.unpack(zlib.gzipSync(new Buffer(3)));
      assert(false);
    }
    catch (error)
    {
      assert.equal(error.code, 1);
    }
  });

  it('should throw error 2 when meta is smaller than declared', function()
  {
    try
    {
      var buffer = new Buffer(4);
      buffer.writeUInt32LE(1024);

      bufferify.unpack(zlib.gzipSync(buffer));
      assert(false);
    }
    catch (error)
    {
      assert.equal(error.code, 2);
    }
  });

  it('should throw error 3 when meta is corrupted', function()
  {
    try
    {
      var buffer = new Buffer(14);
      buffer.writeUInt32LE(10);
      buffer.write("Wrong data!", 10);

      bufferify.unpack(zlib.gzipSync(buffer));
      assert(false);
    }
    catch (error)
    {
      assert.equal(error.code, 3);
    }
  });

  it('should throw error 4 when placeholder is corrupted', function()
  {
    var buffer = bufferify.pack({"type": "__bufferify_placeholder__"});

    try
    {
      bufferify.unpack(buffer);
      assert(false);
    }
    catch (error)
    {
      assert.equal(error.code, 4);
    }
  });

  it('should throw error 5 when placeholder references data beyond the end of buffer', function()
  {
    var buffer = bufferify.pack({"type": "__bufferify_placeholder__", "offset": 0, "length": 1});

    try
    {
      bufferify.unpack(buffer);
      assert(false);
    }
    catch (error)
    {
      assert.equal(error.code, 5);
    }
  });
});
