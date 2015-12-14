'use strict';

var jsonpack = require('jsonpack');
var zlib = require('zlib');
var clone = require('clone');

function __total_buffers_size(object)
{
  if(object instanceof Buffer)
    return object.length

  var size = 0;

  for(var i in object)
    size += __total_buffers_size(object[i]);

  return size;
}

function __extract_buffers(binary, object)
{
  if(object instanceof Buffer)
  {
    object.copy(binary, binary.cursor);

    var meta = {"type": "__bufferify_placeholder__", "offset": binary.cursor, "length": object.length}
    binary.cursor += object.length;

    return meta;
  }

  for(var i in object)
    object[i] = __extract_buffers(binary, object[i]);

  return object;
}

function __insert_buffers(binary, object)
{
  if(object && object.type === "__bufferify_placeholder__")
  {
    var buffer = new Buffer(object.length);
    binary.copy(buffer, 0, object.offset, object.offset + object.length);

    return buffer;
  }

  for(var i in object)
    object[i] = __insert_buffers(binary, object[i]);

  return object;
}

function pack(object)
{
  object = clone(object);
  var binary = new Buffer(__total_buffers_size(object));
  binary.cursor = 0;

  var meta = new Buffer(jsonpack.pack(__extract_buffers(binary, object)));

  var buffer = new Buffer(4 + meta.length + binary.length);
  buffer.writeUInt32LE(meta.length);
  meta.copy(buffer, 4);
  binary.copy(buffer, 4 + meta.length);

  buffer = zlib.gzipSync(buffer);

  return buffer
}

function unpack(buffer)
{
  buffer = zlib.gunzipSync(buffer);

  // Add some exception..?
  var meta_length = buffer.readUInt32LE();
  var meta = jsonpack.unpack(buffer.toString("utf8", 4, 4 + meta_length));

  var binary = new Buffer(buffer.length - meta_length - 4);
  buffer.copy(binary, 0, 4 + meta_length, buffer.length);

  return __insert_buffers(binary, meta);
}

module.exports = {
  pack: pack,
  unpack: unpack
};
