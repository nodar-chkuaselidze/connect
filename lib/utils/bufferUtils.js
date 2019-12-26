"use strict";

exports.__esModule = true;
exports.reverseBuffer = void 0;

const reverseBuffer = buf => {
  const copy = Buffer.alloc(buf.length);
  buf.copy(copy);
  [].reverse.call(copy);
  return copy;
};

exports.reverseBuffer = reverseBuffer;