"use strict";

var _bufferUtils = require("../bufferUtils");

describe('utils/bufferUtils', () => {
  it('reverseBuffer', () => {
    expect((0, _bufferUtils.reverseBuffer)(Buffer.from('abcd', 'hex'))).toEqual(Buffer.from('cdab', 'hex'));
  });
});