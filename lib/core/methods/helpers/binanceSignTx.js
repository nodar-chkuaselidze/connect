"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

exports.__esModule = true;
exports.signTx = exports.validate = void 0;

var _defineProperty2 = _interopRequireDefault(require("@babel/runtime/helpers/defineProperty"));

var _errors = require("../../../constants/errors");

var _paramsValidator = require("./paramsValidator");

function ownKeys(object, enumerableOnly) { var keys = Object.keys(object); if (Object.getOwnPropertySymbols) { var symbols = Object.getOwnPropertySymbols(object); if (enumerableOnly) symbols = symbols.filter(function (sym) { return Object.getOwnPropertyDescriptor(object, sym).enumerable; }); keys.push.apply(keys, symbols); } return keys; }

function _objectSpread(target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i] != null ? arguments[i] : {}; if (i % 2) { ownKeys(Object(source), true).forEach(function (key) { (0, _defineProperty2.default)(target, key, source[key]); }); } else if (Object.getOwnPropertyDescriptors) { Object.defineProperties(target, Object.getOwnPropertyDescriptors(source)); } else { ownKeys(Object(source)).forEach(function (key) { Object.defineProperty(target, key, Object.getOwnPropertyDescriptor(source, key)); }); } } return target; }

const processTxRequest = async (typedCall, response, messages, index) => {
  const msg = messages[index];
  const type = msg.type;
  const lastOp = index + 1 >= messages.length;

  if (lastOp) {
    const response = await typedCall(type, 'BinanceSignedTx', _objectSpread({}, msg, {
      type: null // 'type' is not a protobuf field and needs to be removed

    }));
    return response.message;
  }

  const ack = await typedCall(type, 'BinanceTxRequest', _objectSpread({}, msg, {
    type: null // 'type' is not a protobuf field and needs to be removed

  }));
  index++;
  return await processTxRequest(typedCall, ack, messages, index);
}; // validate and translate params to protobuf


const validate = tx => {
  (0, _paramsValidator.validateParams)(tx, [{
    name: 'chain_id',
    type: 'string',
    obligatory: true
  }, {
    name: 'account_number',
    type: 'number'
  }, {
    name: 'memo',
    type: 'string'
  }, {
    name: 'sequence',
    type: 'number'
  }, {
    name: 'source',
    type: 'number'
  }, {
    name: 'message',
    type: 'object'
  }]);
  const preparedTx = {
    chain_id: tx.chain_id,
    account_number: tx.account_number || 0,
    memo: tx.memo,
    sequence: tx.sequence || 0,
    source: tx.source || 0,
    messages: []
  };
  const {
    transfer,
    placeOrder,
    cancelOrder
  } = tx;

  if (transfer) {
    (0, _paramsValidator.validateParams)(transfer, [{
      name: 'inputs',
      type: 'array',
      obligatory: true
    }, {
      name: 'outputs',
      type: 'array',
      obligatory: true
    }]);
    preparedTx.messages.push(_objectSpread({}, transfer, {
      type: 'BinanceTransferMsg'
    }));
  }

  if (placeOrder) {
    (0, _paramsValidator.validateParams)(placeOrder, [{
      name: 'id',
      type: 'string'
    }, {
      name: 'ordertype',
      type: 'number'
    }, {
      name: 'price',
      type: 'number'
    }, {
      name: 'quantity',
      type: 'number'
    }, {
      name: 'sender',
      type: 'string'
    }, {
      name: 'side',
      type: 'number'
    }]);
    preparedTx.messages.push(_objectSpread({}, placeOrder, {
      type: 'BinanceOrderMsg'
    }));
  }

  if (cancelOrder) {
    (0, _paramsValidator.validateParams)(tx.cancelOrder, [{
      name: 'refid',
      type: 'string',
      obligatory: true
    }, {
      name: 'sender',
      type: 'string',
      obligatory: true
    }, {
      name: 'symbol',
      type: 'string',
      obligatory: true
    }]);
    preparedTx.messages.push(_objectSpread({}, cancelOrder, {
      type: 'BinanceCancelMsg'
    }));
  }

  if (preparedTx.messages.length < 1) {
    throw (0, _errors.invalidParameter)('Transaction does not have any message');
  }

  return preparedTx;
};

exports.validate = validate;

const signTx = async (typedCall, address_n, tx) => {
  const {
    account_number,
    chain_id,
    memo,
    sequence,
    source,
    messages
  } = tx;
  const msg_count = messages.length;
  const response = await typedCall('BinanceSignTx', 'BinanceTxRequest', {
    address_n,
    msg_count,
    account_number,
    chain_id,
    memo,
    sequence,
    source
  });
  return await processTxRequest(typedCall, response, messages, 0);
};

exports.signTx = signTx;