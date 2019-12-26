"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

exports.__esModule = true;
exports.RippleWorker = exports.BlockbookWorker = exports.ReactNativeUsbPlugin = exports.WebUsbPlugin = void 0;

var _tinyWorker = _interopRequireDefault(require("tiny-worker"));

const WebUsbPlugin = undefined;
exports.WebUsbPlugin = WebUsbPlugin;
const ReactNativeUsbPlugin = undefined;
exports.ReactNativeUsbPlugin = ReactNativeUsbPlugin;

const BlockbookWorker = () => {
  return new _tinyWorker.default(() => {
    // $FlowIssue
    require('@trezor/blockchain-link/build/node/blockbook-worker');
  });
};

exports.BlockbookWorker = BlockbookWorker;

const RippleWorker = () => {
  return new _tinyWorker.default(() => {
    // $FlowIssue
    require('@trezor/blockchain-link/build/node/ripple-worker');
  });
};

exports.RippleWorker = RippleWorker;