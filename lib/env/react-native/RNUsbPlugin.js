"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

exports.__esModule = true;
exports.default = void 0;

var _defineProperty2 = _interopRequireDefault(require("@babel/runtime/helpers/defineProperty"));

var _reactNative = require("react-native");

// $FlowIssue: 'react-native' is not a dependency
const bufferToHex = buffer => {
  return Array.prototype.map.call(new Uint8Array(buffer), x => ('00' + x.toString(16)).slice(-2)).join('');
};

const toArrayBuffer = buffer => {
  const ab = new ArrayBuffer(buffer.length);
  const view = new Uint8Array(ab);
  const len = buffer.length;

  for (let i = 0; i < len; ++i) {
    view[i] = buffer[i];
  }

  return ab;
};

class ReactNativePlugin {
  constructor() {
    (0, _defineProperty2.default)(this, "name", 'ReactNativePlugin');
    (0, _defineProperty2.default)(this, "version", '1.0.0');
    (0, _defineProperty2.default)(this, "debug", false);
    (0, _defineProperty2.default)(this, "allowsWriteAndEnumerate", true);
    (0, _defineProperty2.default)(this, "requestNeeded", false);
    this.usb = _reactNative.NativeModules.RNBridge;
  }

  async init(debug) {
    this.debug = !!debug;

    if (!this.usb) {
      throw new Error('ReactNative plugin is not available');
    }
  }

  async enumerate() {
    return this.usb.enumerate();
  }

  async send(path, data, debugLink) {
    const dataHex = bufferToHex(data);
    return this.usb.write(path, debugLink, dataHex);
  }

  async receive(path, debugLink) {
    const {
      data
    } = await this.usb.read(path, debugLink);
    return toArrayBuffer(Buffer.from(data, 'hex'));
  }

  async connect(path, debugLink) {
    for (let i = 0; i < 5; i++) {
      if (i > 0) {
        await new Promise(resolve => setTimeout(() => resolve(), i * 200));
      }

      try {
        await this.usb.acquire(path, debugLink);
        return;
      } catch (e) {
        if (i === 4) {
          throw e;
        }
      }
    }
  }

  async disconnect(path, debugLink, last) {
    return this.usb.release(path, debugLink, last);
  }

}

exports.default = ReactNativePlugin;