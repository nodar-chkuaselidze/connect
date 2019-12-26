"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

exports.__esModule = true;
exports.default = void 0;

var _AbstractMethod = _interopRequireDefault(require("./AbstractMethod"));

class GetDeviceState extends _AbstractMethod.default {
  constructor(message) {
    super(message);
    this.requiredPermissions = [];
  }

  async run() {
    if (this.device.getState()) {
      return {
        state: this.device.getState()
      };
    }

    const response = await this.device.getCommands().getDeviceState();
    const state = this.device.getState() || response;
    return {
      state
    };
  }

}

exports.default = GetDeviceState;