"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

exports.__esModule = true;
exports.ethereumSignTx = void 0;

var _defineProperty2 = _interopRequireDefault(require("@babel/runtime/helpers/defineProperty"));

function ownKeys(object, enumerableOnly) { var keys = Object.keys(object); if (Object.getOwnPropertySymbols) { var symbols = Object.getOwnPropertySymbols(object); if (enumerableOnly) symbols = symbols.filter(function (sym) { return Object.getOwnPropertyDescriptor(object, sym).enumerable; }); keys.push.apply(keys, symbols); } return keys; }

function _objectSpread(target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i] != null ? arguments[i] : {}; if (i % 2) { ownKeys(Object(source), true).forEach(function (key) { (0, _defineProperty2.default)(target, key, source[key]); }); } else if (Object.getOwnPropertyDescriptors) { Object.defineProperties(target, Object.getOwnPropertyDescriptors(source)); } else { ownKeys(Object(source)).forEach(function (key) { Object.defineProperty(target, key, Object.getOwnPropertyDescriptor(source, key)); }); } } return target; }

const splitString = (str, len) => {
  if (str == null) {
    return ['', ''];
  }

  const first = str.slice(0, len);
  const second = str.slice(len);
  return [first, second];
};

const processTxRequest = async (typedCall, request, data, chain_id) => {
  if (!request.data_length) {
    let v = request.signature_v;
    const r = request.signature_r;
    const s = request.signature_s;

    if (v == null || r == null || s == null) {
      throw new Error('Unexpected request.');
    } // recompute "v" value
    // from: https://github.com/kvhnuke/etherwallet/commit/288bd35497e00ad3947e9d11f60154bae1bf3c2f


    if (chain_id && v <= 1) {
      v += 2 * chain_id + 35;
    }

    return Promise.resolve({
      v: '0x' + v.toString(16),
      r: '0x' + r,
      s: '0x' + s
    });
  }

  const [first, rest] = splitString(data, request.data_length * 2);
  const response = await typedCall('EthereumTxAck', 'EthereumTxRequest', {
    data_chunk: first
  });
  return await processTxRequest(typedCall, response.message, rest, chain_id);
};

function stripLeadingZeroes(str) {
  while (/^00/.test(str)) {
    str = str.slice(2);
  }

  return str;
}

const ethereumSignTx = async (typedCall, address_n, to, value, gas_limit, gas_price, nonce, data, chain_id, tx_type) => {
  const length = data == null ? 0 : data.length / 2;
  const [first, rest] = splitString(data, 1024 * 2);
  let message = {
    address_n,
    nonce: stripLeadingZeroes(nonce),
    gas_price: stripLeadingZeroes(gas_price),
    gas_limit: stripLeadingZeroes(gas_limit),
    to,
    value: stripLeadingZeroes(value)
  };

  if (length !== 0) {
    message = _objectSpread({}, message, {
      data_length: length,
      data_initial_chunk: first
    });
  }

  if (chain_id) {
    message = _objectSpread({}, message, {
      chain_id
    });
  }

  if (tx_type !== null) {
    message = _objectSpread({}, message, {
      tx_type
    });
  }

  const response = await typedCall('EthereumSignTx', 'EthereumTxRequest', message);
  return await processTxRequest(typedCall, response.message, rest, chain_id);
};

exports.ethereumSignTx = ethereumSignTx;