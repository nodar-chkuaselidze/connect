"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

exports.__esModule = true;
exports.dispose = exports.cancel = exports.renderWebUSBButton = exports.uiResponse = exports.requestLogin = exports.customMessage = exports.getSettings = exports.call = exports.init = exports.manifest = exports.eventEmitter = void 0;

var _events = _interopRequireDefault(require("events"));

const empty = () => {
  throw new Error('This version of trezor-connect is not suitable to work without browser');
};

const eventEmitter = new _events.default();
exports.eventEmitter = eventEmitter;
const manifest = empty;
exports.manifest = manifest;
const init = empty;
exports.init = init;
const call = empty;
exports.call = call;
const getSettings = empty;
exports.getSettings = getSettings;
const customMessage = empty;
exports.customMessage = customMessage;
const requestLogin = empty;
exports.requestLogin = requestLogin;
const uiResponse = empty;
exports.uiResponse = uiResponse;
const renderWebUSBButton = empty;
exports.renderWebUSBButton = renderWebUSBButton;
const cancel = empty;
exports.cancel = cancel;
const dispose = empty;
exports.dispose = dispose;