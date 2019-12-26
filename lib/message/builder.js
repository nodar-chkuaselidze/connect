"use strict";

exports.__esModule = true;
exports.UiMessage = UiMessage;
exports.DeviceMessage = DeviceMessage;
exports.TransportMessage = TransportMessage;
exports.ResponseMessage = ResponseMessage;
exports.BlockchainMessage = BlockchainMessage;

var _constants = require("../constants");

function UiMessage(type, payload) {
  return {
    event: _constants.UI_EVENT,
    type,
    payload
  };
}

function DeviceMessage(type, payload) {
  return {
    event: _constants.DEVICE_EVENT,
    type,
    payload
  };
}

function TransportMessage(type, payload) {
  return {
    event: _constants.TRANSPORT_EVENT,
    type,
    payload
  };
}

function ResponseMessage(id, success, payload = null) {
  return {
    event: _constants.RESPONSE_EVENT,
    type: _constants.RESPONSE_EVENT,
    id,
    success,
    payload
  };
}

function BlockchainMessage(type, payload) {
  return {
    event: _constants.BLOCKCHAIN_EVENT,
    type,
    payload
  };
}