"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

exports.__esModule = true;
exports.default = void 0;

var _AbstractMethod = _interopRequireDefault(require("../AbstractMethod"));

var _paramsValidator = require("../helpers/paramsValidator");

class DebugLinkDecision extends _AbstractMethod.default {
  constructor(message) {
    super(message);
    this.useDevice = true;
    this.debugLink = true;
    this.useUi = false;
    this.requiredPermissions = ['management'];
    const payload = message.payload;
    (0, _paramsValidator.validateParams)(payload, [{
      name: 'yes_no',
      type: 'boolean'
    }, {
      name: 'up_down',
      type: 'boolean'
    }, {
      name: 'input',
      type: 'string'
    }]);
    this.params = {
      yes_no: payload.yes_no,
      up_down: payload.up_down,
      input: payload.input
    };
  }

  async run() {
    if (!this.device.hasDebugLink) {
      throw new Error('Device is not a debug link');
    }

    if (!this.device.isUsedHere()) {
      throw new Error('Device is not acquired!');
    }

    await this.device.getCommands().debugLinkDecision(this.params);
    return {
      debugLink: true
    };
  }

}

exports.default = DebugLinkDecision;