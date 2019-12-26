"use strict";

var _inputs = require("../inputs");

var _refTx = require("../refTx");

describe('core/methods/tx/refTx', () => {
  it('getReferencedTransactions', () => {
    const inputs = [(0, _inputs.inputToHD)({
      prev_hash: 'abcd'
    }), (0, _inputs.inputToHD)({
      prev_hash: 'abcd'
    }), (0, _inputs.inputToHD)({
      prev_hash: 'deadbeef'
    }), (0, _inputs.inputToHD)({
      prev_hash: 'abcd'
    }), (0, _inputs.inputToHD)({
      prev_hash: 'deadbeef'
    }), (0, _inputs.inputToHD)({
      prev_hash: 'dcba'
    })];
    const result = ['abcd', 'deadbeef', 'dcba'];
    expect((0, _refTx.getReferencedTransactions)(inputs)).toEqual(result);
  });
});