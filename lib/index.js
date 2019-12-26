"use strict";

var _interopRequireWildcard = require("@babel/runtime/helpers/interopRequireWildcard");

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

exports.__esModule = true;
var _exportNames = {
  UI_EVENT: true,
  DEVICE_EVENT: true,
  RESPONSE_EVENT: true,
  TRANSPORT_EVENT: true,
  BLOCKCHAIN_EVENT: true,
  TRANSPORT: true,
  IFRAME: true,
  UI: true,
  DEVICE: true,
  BLOCKCHAIN: true
};
exports.BLOCKCHAIN = exports.DEVICE = exports.UI = exports.IFRAME = exports.TRANSPORT = exports.default = void 0;

var _defineProperty2 = _interopRequireDefault(require("@babel/runtime/helpers/defineProperty"));

var _constants = require("./constants");

exports.UI_EVENT = _constants.UI_EVENT;
exports.DEVICE_EVENT = _constants.DEVICE_EVENT;
exports.RESPONSE_EVENT = _constants.RESPONSE_EVENT;
exports.TRANSPORT_EVENT = _constants.TRANSPORT_EVENT;
exports.BLOCKCHAIN_EVENT = _constants.BLOCKCHAIN_EVENT;

var TRANSPORT = _interopRequireWildcard(require("./constants/transport"));

exports.TRANSPORT = TRANSPORT;

var IFRAME = _interopRequireWildcard(require("./constants/iframe"));

exports.IFRAME = IFRAME;

var UI = _interopRequireWildcard(require("./constants/ui"));

exports.UI = UI;

var DEVICE = _interopRequireWildcard(require("./constants/device"));

exports.DEVICE = DEVICE;

var BLOCKCHAIN = _interopRequireWildcard(require("./constants/blockchain"));

exports.BLOCKCHAIN = BLOCKCHAIN;

var $T = _interopRequireWildcard(require("./types"));

var _node = require("./env/node");

var _blockchainEvent = require("./types/blockchainEvent");

Object.keys(_blockchainEvent).forEach(function (key) {
  if (key === "default" || key === "__esModule") return;
  if (Object.prototype.hasOwnProperty.call(_exportNames, key)) return;
  exports[key] = _blockchainEvent[key];
});

var _account = require("./types/account");

Object.keys(_account).forEach(function (key) {
  if (key === "default" || key === "__esModule") return;
  if (Object.prototype.hasOwnProperty.call(_exportNames, key)) return;
  exports[key] = _account[key];
});

function ownKeys(object, enumerableOnly) { var keys = Object.keys(object); if (Object.getOwnPropertySymbols) { var symbols = Object.getOwnPropertySymbols(object); if (enumerableOnly) symbols = symbols.filter(function (sym) { return Object.getOwnPropertyDescriptor(object, sym).enumerable; }); keys.push.apply(keys, symbols); } return keys; }

function _objectSpread(target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i] != null ? arguments[i] : {}; if (i % 2) { ownKeys(Object(source), true).forEach(function (key) { (0, _defineProperty2.default)(target, key, source[key]); }); } else if (Object.getOwnPropertyDescriptors) { Object.defineProperties(target, Object.getOwnPropertyDescriptors(source)); } else { ownKeys(Object(source)).forEach(function (key) { Object.defineProperty(target, key, Object.getOwnPropertyDescriptor(source, key)); }); } } return target; }

class TrezorConnect {}

(0, _defineProperty2.default)(TrezorConnect, "manifest", data => {
  (0, _node.manifest)(data);
});
(0, _defineProperty2.default)(TrezorConnect, "getSettings", async () => {
  return await (0, _node.getSettings)();
});
(0, _defineProperty2.default)(TrezorConnect, "init", async settings => {
  return await (0, _node.init)(settings);
});
(0, _defineProperty2.default)(TrezorConnect, "on", (type, fn) => {
  _node.eventEmitter.on(type, fn);
});
(0, _defineProperty2.default)(TrezorConnect, "off", (type, fn) => {
  _node.eventEmitter.removeListener(type, fn);
});
(0, _defineProperty2.default)(TrezorConnect, "uiResponse", response => {
  (0, _node.uiResponse)(response);
});
(0, _defineProperty2.default)(TrezorConnect, "blockchainDisconnect", async params => {
  return await (0, _node.call)(_objectSpread({
    method: 'blockchainDisconnect'
  }, params));
});
(0, _defineProperty2.default)(TrezorConnect, "blockchainEstimateFee", async params => {
  return await (0, _node.call)(_objectSpread({
    method: 'blockchainEstimateFee'
  }, params));
});
(0, _defineProperty2.default)(TrezorConnect, "blockchainGetTransactions", async params => {
  return await (0, _node.call)(_objectSpread({
    method: 'blockchainGetTransactions'
  }, params));
});
(0, _defineProperty2.default)(TrezorConnect, "blockchainSubscribe", async params => {
  return await (0, _node.call)(_objectSpread({
    method: 'blockchainSubscribe'
  }, params));
});
(0, _defineProperty2.default)(TrezorConnect, "blockchainUnsubscribe", async params => {
  return await (0, _node.call)(_objectSpread({
    method: 'blockchainUnsubscribe'
  }, params));
});
(0, _defineProperty2.default)(TrezorConnect, "customMessage", async params => {
  return await (0, _node.customMessage)(params);
});
(0, _defineProperty2.default)(TrezorConnect, "requestLogin", async params => {
  return await (0, _node.requestLogin)(params);
});
(0, _defineProperty2.default)(TrezorConnect, "resetDevice", async params => {
  return await (0, _node.call)(_objectSpread({
    method: 'resetDevice'
  }, params));
});
(0, _defineProperty2.default)(TrezorConnect, "cardanoGetAddress", async params => {
  const useEventListener = _node.eventEmitter.listenerCount(UI.ADDRESS_VALIDATION) > 0;
  return await (0, _node.call)(_objectSpread({
    method: 'cardanoGetAddress'
  }, params, {
    useEventListener
  }));
});
(0, _defineProperty2.default)(TrezorConnect, "cardanoGetPublicKey", async params => {
  return await (0, _node.call)(_objectSpread({
    method: 'cardanoGetPublicKey'
  }, params));
});
(0, _defineProperty2.default)(TrezorConnect, "cardanoSignTransaction", async params => {
  return await (0, _node.call)(_objectSpread({
    method: 'cardanoSignTransaction'
  }, params));
});
(0, _defineProperty2.default)(TrezorConnect, "cipherKeyValue", async params => {
  return await (0, _node.call)(_objectSpread({
    method: 'cipherKeyValue'
  }, params));
});
(0, _defineProperty2.default)(TrezorConnect, "composeTransaction", async params => {
  return await (0, _node.call)(_objectSpread({
    method: 'composeTransaction'
  }, params));
});
(0, _defineProperty2.default)(TrezorConnect, "debugLinkDecision", async params => {
  return await (0, _node.call)(_objectSpread({
    method: 'debugLinkDecision'
  }, params));
});
(0, _defineProperty2.default)(TrezorConnect, "debugLinkGetState", async params => {
  return await (0, _node.call)(_objectSpread({
    method: 'debugLinkGetState'
  }, params));
});
(0, _defineProperty2.default)(TrezorConnect, "ethereumGetAddress", async params => {
  const useEventListener = _node.eventEmitter.listenerCount(UI.ADDRESS_VALIDATION) > 0;
  return await (0, _node.call)(_objectSpread({
    method: 'ethereumGetAddress'
  }, params, {
    useEventListener
  }));
});
(0, _defineProperty2.default)(TrezorConnect, "ethereumGetPublicKey", async params => {
  return await (0, _node.call)(_objectSpread({
    method: 'ethereumGetPublicKey'
  }, params));
});
(0, _defineProperty2.default)(TrezorConnect, "ethereumSignMessage", async params => {
  return await (0, _node.call)(_objectSpread({
    method: 'ethereumSignMessage'
  }, params));
});
(0, _defineProperty2.default)(TrezorConnect, "ethereumSignTransaction", async params => {
  return await (0, _node.call)(_objectSpread({
    method: 'ethereumSignTransaction'
  }, params));
});
(0, _defineProperty2.default)(TrezorConnect, "ethereumVerifyMessage", async params => {
  return await (0, _node.call)(_objectSpread({
    method: 'ethereumVerifyMessage'
  }, params));
});
(0, _defineProperty2.default)(TrezorConnect, "getAccountInfo", async params => {
  return await (0, _node.call)(_objectSpread({
    method: 'getAccountInfo'
  }, params));
});
(0, _defineProperty2.default)(TrezorConnect, "getAddress", async params => {
  const useEventListener = _node.eventEmitter.listenerCount(UI.ADDRESS_VALIDATION) > 0;
  return await (0, _node.call)(_objectSpread({
    method: 'getAddress'
  }, params, {
    useEventListener
  }));
});
(0, _defineProperty2.default)(TrezorConnect, "getDeviceState", async params => {
  return await (0, _node.call)(_objectSpread({
    method: 'getDeviceState'
  }, params));
});
(0, _defineProperty2.default)(TrezorConnect, "getFeatures", async params => {
  return await (0, _node.call)(_objectSpread({
    method: 'getFeatures'
  }, params));
});
(0, _defineProperty2.default)(TrezorConnect, "getPublicKey", async params => {
  return await (0, _node.call)(_objectSpread({
    method: 'getPublicKey'
  }, params));
});
(0, _defineProperty2.default)(TrezorConnect, "liskGetAddress", async params => {
  const useEventListener = _node.eventEmitter.listenerCount(UI.ADDRESS_VALIDATION) > 0;
  return await (0, _node.call)(_objectSpread({
    method: 'liskGetAddress'
  }, params, {
    useEventListener
  }));
});
(0, _defineProperty2.default)(TrezorConnect, "liskGetPublicKey", async params => {
  return await (0, _node.call)(_objectSpread({
    method: 'liskGetPublicKey'
  }, params));
});
(0, _defineProperty2.default)(TrezorConnect, "liskSignMessage", async params => {
  return await (0, _node.call)(_objectSpread({
    method: 'liskSignMessage'
  }, params));
});
(0, _defineProperty2.default)(TrezorConnect, "liskSignTransaction", async params => {
  return await (0, _node.call)(_objectSpread({
    method: 'liskSignTransaction'
  }, params));
});
(0, _defineProperty2.default)(TrezorConnect, "liskVerifyMessage", async params => {
  return await (0, _node.call)(_objectSpread({
    method: 'liskVerifyMessage'
  }, params));
});
(0, _defineProperty2.default)(TrezorConnect, "nemGetAddress", async params => {
  const useEventListener = _node.eventEmitter.listenerCount(UI.ADDRESS_VALIDATION) > 0;
  return await (0, _node.call)(_objectSpread({
    method: 'nemGetAddress'
  }, params, {
    useEventListener
  }));
});
(0, _defineProperty2.default)(TrezorConnect, "nemSignTransaction", async params => {
  return await (0, _node.call)(_objectSpread({
    method: 'nemSignTransaction'
  }, params));
});
(0, _defineProperty2.default)(TrezorConnect, "pushTransaction", async params => {
  return await (0, _node.call)(_objectSpread({
    method: 'pushTransaction'
  }, params));
});
(0, _defineProperty2.default)(TrezorConnect, "rippleGetAddress", async params => {
  const useEventListener = _node.eventEmitter.listenerCount(UI.ADDRESS_VALIDATION) > 0;
  return await (0, _node.call)(_objectSpread({
    method: 'rippleGetAddress'
  }, params, {
    useEventListener
  }));
});
(0, _defineProperty2.default)(TrezorConnect, "rippleSignTransaction", async params => {
  return await (0, _node.call)(_objectSpread({
    method: 'rippleSignTransaction'
  }, params));
});
(0, _defineProperty2.default)(TrezorConnect, "signMessage", async params => {
  return await (0, _node.call)(_objectSpread({
    method: 'signMessage'
  }, params));
});
(0, _defineProperty2.default)(TrezorConnect, "signTransaction", async params => {
  return await (0, _node.call)(_objectSpread({
    method: 'signTransaction'
  }, params));
});
(0, _defineProperty2.default)(TrezorConnect, "stellarGetAddress", async params => {
  const useEventListener = _node.eventEmitter.listenerCount(UI.ADDRESS_VALIDATION) > 0;
  return await (0, _node.call)(_objectSpread({
    method: 'stellarGetAddress'
  }, params, {
    useEventListener
  }));
});
(0, _defineProperty2.default)(TrezorConnect, "stellarSignTransaction", async params => {
  return await (0, _node.call)(_objectSpread({
    method: 'stellarSignTransaction'
  }, params));
});
(0, _defineProperty2.default)(TrezorConnect, "tezosGetAddress", async params => {
  const useEventListener = _node.eventEmitter.listenerCount(UI.ADDRESS_VALIDATION) > 0;
  return await (0, _node.call)(_objectSpread({
    method: 'tezosGetAddress'
  }, params, {
    useEventListener
  }));
});
(0, _defineProperty2.default)(TrezorConnect, "tezosGetPublicKey", async params => {
  return await (0, _node.call)(_objectSpread({
    method: 'tezosGetPublicKey'
  }, params));
});
(0, _defineProperty2.default)(TrezorConnect, "tezosSignTransaction", async params => {
  return await (0, _node.call)(_objectSpread({
    method: 'tezosSignTransaction'
  }, params));
});
(0, _defineProperty2.default)(TrezorConnect, "eosGetPublicKey", async params => {
  return await (0, _node.call)(_objectSpread({
    method: 'eosGetPublicKey'
  }, params));
});
(0, _defineProperty2.default)(TrezorConnect, "eosSignTransaction", async params => {
  return await (0, _node.call)(_objectSpread({
    method: 'eosSignTransaction'
  }, params));
});
(0, _defineProperty2.default)(TrezorConnect, "binanceGetAddress", async params => {
  const useEventListener = _node.eventEmitter.listenerCount(UI.ADDRESS_VALIDATION) > 0;
  return await (0, _node.call)(_objectSpread({
    method: 'binanceGetAddress'
  }, params, {
    useEventListener
  }));
});
(0, _defineProperty2.default)(TrezorConnect, "binanceGetPublicKey", async params => {
  return await (0, _node.call)(_objectSpread({
    method: 'binanceGetPublicKey'
  }, params));
});
(0, _defineProperty2.default)(TrezorConnect, "binanceSignTransaction", async params => {
  return await (0, _node.call)(_objectSpread({
    method: 'binanceSignTransaction'
  }, params));
});
(0, _defineProperty2.default)(TrezorConnect, "verifyMessage", async params => {
  return await (0, _node.call)(_objectSpread({
    method: 'verifyMessage'
  }, params));
});
(0, _defineProperty2.default)(TrezorConnect, "wipeDevice", async params => {
  return await (0, _node.call)(_objectSpread({
    method: 'wipeDevice'
  }, params));
});
(0, _defineProperty2.default)(TrezorConnect, "applyFlags", async params => {
  return await (0, _node.call)(_objectSpread({
    method: 'applyFlags'
  }, params));
});
(0, _defineProperty2.default)(TrezorConnect, "applySettings", async params => {
  return await (0, _node.call)(_objectSpread({
    method: 'applySettings'
  }, params));
});
(0, _defineProperty2.default)(TrezorConnect, "backupDevice", async () => {
  return await (0, _node.call)({
    method: 'backupDevice'
  });
});
(0, _defineProperty2.default)(TrezorConnect, "changePin", async params => {
  return await (0, _node.call)(_objectSpread({
    method: 'changePin'
  }, params));
});
(0, _defineProperty2.default)(TrezorConnect, "firmwareUpdate", async params => {
  return await (0, _node.call)(_objectSpread({
    method: 'firmwareUpdate'
  }, params));
});
(0, _defineProperty2.default)(TrezorConnect, "recoveryDevice", async params => {
  return await (0, _node.call)(_objectSpread({
    method: 'recoveryDevice'
  }, params));
});
(0, _defineProperty2.default)(TrezorConnect, "dispose", () => {
  (0, _node.dispose)();
});
(0, _defineProperty2.default)(TrezorConnect, "cancel", error => {
  (0, _node.cancel)(error);
});
(0, _defineProperty2.default)(TrezorConnect, "renderWebUSBButton", className => {
  (0, _node.renderWebUSBButton)(className);
});
(0, _defineProperty2.default)(TrezorConnect, "disableWebUSB", async () => {
  (0, _node.disableWebUSB)();
});
(0, _defineProperty2.default)(TrezorConnect, "stop", async () => {
  return (0, _node.stop)();
});
var _default = TrezorConnect;
exports.default = _default;