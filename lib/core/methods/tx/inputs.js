"use strict";

exports.__esModule = true;
exports.inputToTrezor = exports.inputToHD = exports.validateTrezorInputs = void 0;

var _bufferUtils = require("../../../utils/bufferUtils");

var _pathUtils = require("../../../utils/pathUtils");

var _index = require("./index");

var _paramsValidator = require("../helpers/paramsValidator");

// local modules

/** *****
 * SignTx: validation
 *******/
const validateTrezorInputs = (inputs, coinInfo) => {
  const trezorInputs = inputs.map(_index.fixPath).map(_index.convertMultisigPubKey.bind(null, coinInfo.network));

  for (const input of trezorInputs) {
    (0, _pathUtils.validatePath)(input.address_n);
    const useAmount = (0, _pathUtils.isSegwitPath)(input.address_n);
    (0, _paramsValidator.validateParams)(input, [{
      name: 'prev_hash',
      type: 'string',
      obligatory: true
    }, {
      name: 'prev_index',
      type: 'number',
      obligatory: true
    }, {
      name: 'script_type',
      type: 'string'
    }, {
      name: 'amount',
      type: 'string',
      obligatory: useAmount
    }, {
      name: 'sequence',
      type: 'number'
    }, {
      name: 'multisig',
      type: 'object'
    }]);
  }

  return trezorInputs;
};
/** *****
 * Transform from Trezor format to hd-wallet, called from SignTx to get refTxs from bitcore
 *******/


exports.validateTrezorInputs = validateTrezorInputs;

const inputToHD = input => {
  return {
    hash: (0, _bufferUtils.reverseBuffer)(Buffer.from(input.prev_hash, 'hex')),
    index: input.prev_index,
    path: input.address_n,
    amount: input.amount,
    segwit: (0, _pathUtils.isSegwitPath)(input.address_n)
  };
};
/** *****
 * Transform from hd-wallet format to Trezor
 *******/


exports.inputToHD = inputToHD;

const inputToTrezor = (input, sequence) => {
  const {
    hash,
    index,
    path,
    amount
  } = input;
  return {
    address_n: path,
    prev_index: index,
    prev_hash: (0, _bufferUtils.reverseBuffer)(hash).toString('hex'),
    script_type: (0, _pathUtils.getScriptType)(path),
    amount,
    sequence
  };
};

exports.inputToTrezor = inputToTrezor;