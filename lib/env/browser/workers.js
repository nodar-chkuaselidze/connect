"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

exports.__esModule = true;
exports.ReactNativeUsbPlugin = exports.WebUsbPlugin = void 0;

var _sharedConnectionWorker = _interopRequireDefault(require("sharedworker-loader?name=workers/shared-connection-worker.[hash].js!trezor-link/lib/lowlevel/sharedConnectionWorker"));

var _index = _interopRequireDefault(require("worker-loader?name=workers/blockbook-worker.[hash].js!@trezor/blockchain-link/lib/workers/blockbook/index.js"));

exports.BlockbookWorker = _index.default;

var _index2 = _interopRequireDefault(require("worker-loader?name=workers/ripple-worker.[hash].js!@trezor/blockchain-link/lib/workers/ripple/index.js"));

exports.RippleWorker = _index2.default;

var _trezorLink = _interopRequireDefault(require("trezor-link"));

/* eslint-disable no-unused-vars */
const WebUsbPlugin = () => {
  return new _trezorLink.default.Lowlevel(new _trezorLink.default.WebUsb(), () => new _sharedConnectionWorker.default());
};

exports.WebUsbPlugin = WebUsbPlugin;
const ReactNativeUsbPlugin = undefined;
exports.ReactNativeUsbPlugin = ReactNativeUsbPlugin;