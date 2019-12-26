"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

exports.__esModule = true;
exports.RippleWorker = exports.BlockbookWorker = exports.ReactNativeUsbPlugin = exports.WebUsbPlugin = void 0;

var _blockbookWorker = _interopRequireDefault(require("@trezor/blockchain-link/build/module/blockbook-worker.js"));

var _rippleWorker = _interopRequireDefault(require("@trezor/blockchain-link/build/module/ripple-worker.js"));

var _trezorLink = _interopRequireDefault(require("trezor-link"));

var _RNUsbPlugin = _interopRequireDefault(require("./RNUsbPlugin"));

// $FlowIssue
// $FlowIssue
const WebUsbPlugin = undefined;
exports.WebUsbPlugin = WebUsbPlugin;

const ReactNativeUsbPlugin = () => {
  return new _trezorLink.default.Lowlevel(new _RNUsbPlugin.default());
};

exports.ReactNativeUsbPlugin = ReactNativeUsbPlugin;

const BlockbookWorker = () => {
  return new _blockbookWorker.default();
};

exports.BlockbookWorker = BlockbookWorker;

const RippleWorker = () => {
  return new _rippleWorker.default();
};

exports.RippleWorker = RippleWorker;