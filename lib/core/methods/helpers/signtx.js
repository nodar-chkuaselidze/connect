"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

exports.__esModule = true;
exports.default = void 0;

var _defineProperty2 = _interopRequireDefault(require("@babel/runtime/helpers/defineProperty"));

function ownKeys(object, enumerableOnly) { var keys = Object.keys(object); if (Object.getOwnPropertySymbols) { var symbols = Object.getOwnPropertySymbols(object); if (enumerableOnly) symbols = symbols.filter(function (sym) { return Object.getOwnPropertyDescriptor(object, sym).enumerable; }); keys.push.apply(keys, symbols); } return keys; }

function _objectSpread(target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i] != null ? arguments[i] : {}; if (i % 2) { ownKeys(Object(source), true).forEach(function (key) { (0, _defineProperty2.default)(target, key, source[key]); }); } else if (Object.getOwnPropertyDescriptors) { Object.defineProperties(target, Object.getOwnPropertyDescriptors(source)); } else { ownKeys(Object(source)).forEach(function (key) { Object.defineProperty(target, key, Object.getOwnPropertyDescriptor(source, key)); }); } } return target; }

const requestPrevTxInfo = (reqTx, requestType, requestIndex, dataLen, dataOffset) => {
  const i = +requestIndex;

  if (requestType === 'TXINPUT') {
    return {
      inputs: [reqTx.inputs[i]]
    };
  }

  if (requestType === 'TXOUTPUT') {
    return {
      bin_outputs: [reqTx.bin_outputs[i]]
    };
  }

  if (requestType === 'TXEXTRADATA') {
    if (dataLen == null) {
      throw new Error('Missing extra_data_len');
    }

    const dataLenN = +dataLen;

    if (dataOffset == null) {
      throw new Error('Missing extra_data_offset');
    }

    const dataOffsetN = +dataOffset;

    if (reqTx.extra_data == null) {
      throw new Error('No extra data for transaction ' + reqTx.hash);
    }

    const data = reqTx.extra_data;
    const substring = data.substring(dataOffsetN * 2, (dataOffsetN + dataLenN) * 2);
    return {
      extra_data: substring
    };
  }

  if (requestType === 'TXMETA') {
    const outputCount = reqTx.bin_outputs.length;
    const data = reqTx.extra_data;
    const meta = {
      version: reqTx.version,
      lock_time: reqTx.lock_time,
      inputs_cnt: reqTx.inputs.length,
      outputs_cnt: outputCount,
      timestamp: reqTx.timestamp,
      version_group_id: reqTx.version_group_id
    };

    if (typeof data === 'string' && data.length !== 0) {
      return _objectSpread({}, meta, {
        extra_data_len: data.length / 2
      });
    }

    return meta;
  }

  throw new Error(`Unknown request type: ${requestType}`);
};

const requestSignedTxInfo = (inputs, outputs, requestType, requestIndex) => {
  const i = +requestIndex;

  if (requestType === 'TXINPUT') {
    return {
      inputs: [inputs[i]]
    };
  }

  if (requestType === 'TXOUTPUT') {
    return {
      outputs: [outputs[i]]
    };
  }

  if (requestType === 'TXMETA') {
    throw new Error('Cannot read TXMETA from signed transaction');
  }

  if (requestType === 'TXEXTRADATA') {
    throw new Error('Cannot read TXEXTRADATA from signed transaction');
  }

  throw new Error(`Unknown request type: ${requestType}`);
}; // requests information about a transaction
// can be either signed transaction iteslf of prev transaction


const requestTxInfo = (m, index, inputs, outputs) => {
  const md = m.details;
  const hash = md.tx_hash;

  if (hash) {
    const reqTx = index[hash.toLowerCase()];

    if (!reqTx) {
      throw new Error(`Requested unknown tx: ${hash}`);
    }

    return requestPrevTxInfo(reqTx, m.request_type, md.request_index, md.extra_data_len, md.extra_data_offset);
  } else {
    return requestSignedTxInfo(inputs, outputs, m.request_type, md.request_index);
  }
};

const saveTxSignatures = (ms, serializedTx, signatures) => {
  if (ms) {
    const _signatureIndex = ms.signature_index;
    const _signature = ms.signature;
    const _serializedTx = ms.serialized_tx;

    if (_serializedTx != null) {
      serializedTx.serialized += _serializedTx;
    }

    if (_signatureIndex != null) {
      if (_signature == null) {
        throw new Error('Unexpected null in trezor:TxRequestSerialized signature.');
      }

      signatures[_signatureIndex] = _signature;
    }
  }
};

const processTxRequest = async (typedCall, m, serializedTx, signatures, index, inputs, outputs) => {
  saveTxSignatures(m.serialized, serializedTx, signatures);

  if (m.request_type === 'TXFINISHED') {
    return Promise.resolve({
      signatures: signatures,
      serializedTx: serializedTx.serialized
    });
  }

  const resTx = requestTxInfo(m, index, inputs, outputs);
  const response = await typedCall('TxAck', 'TxRequest', {
    tx: resTx
  });
  return await processTxRequest(typedCall, response.message, serializedTx, signatures, index, inputs, outputs);
};

var _default = async (typedCall, inputs, outputs, refTxs, options, coinInfo) => {
  const index = {};
  refTxs.forEach(tx => {
    index[tx.hash.toLowerCase()] = tx;
  });
  const signatures = [];
  const serializedTx = {
    serialized: ''
  };
  const response = await typedCall('SignTx', 'TxRequest', _objectSpread({}, options, {
    inputs_count: inputs.length,
    outputs_count: outputs.length,
    coin_name: coinInfo.name
  }));
  const signed = await processTxRequest(typedCall, response.message, serializedTx, signatures, index, inputs, outputs);
  return signed;
};

exports.default = _default;