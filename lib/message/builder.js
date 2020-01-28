"use strict";

exports.__esModule = true;
exports.BlockchainMessage = exports.ResponseMessage = exports.TransportMessage = exports.DeviceMessage = exports.UiMessage = void 0;

var _constants = require("../constants");

const UiMessage = (type, payload) => ({
  event: _constants.UI_EVENT,
  type,
  payload
});

exports.UiMessage = UiMessage;

const DeviceMessage = (type, payload) => ({
  event: _constants.DEVICE_EVENT,
  type,
  payload
});

exports.DeviceMessage = DeviceMessage;

const TransportMessage = (type, payload) => ({
  event: _constants.TRANSPORT_EVENT,
  type,
  payload
});

exports.TransportMessage = TransportMessage;

const ResponseMessage = (id, success, payload = null) => ({
  event: _constants.RESPONSE_EVENT,
  type: _constants.RESPONSE_EVENT,
  id,
  success,
  payload
});

exports.ResponseMessage = ResponseMessage;

const BlockchainMessage = (type, payload) => ({
  event: _constants.BLOCKCHAIN_EVENT,
  type,
  payload
});

exports.BlockchainMessage = BlockchainMessage;