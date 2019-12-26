"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

exports.__esModule = true;
exports.default = void 0;

var _AbstractMethod = _interopRequireDefault(require("./AbstractMethod"));

var _paramsValidator = require("./helpers/paramsValidator");

class ChangePin extends _AbstractMethod.default {
  constructor(message) {
    super(message);
    this.useEmptyPassphrase = true;
    this.requiredPermissions = ['management'];
    const payload = message.payload;
    (0, _paramsValidator.validateParams)(payload, [{
      name: 'remove',
      type: 'boolean'
    }]);
    this.params = {
      remove: payload.remove
    };
  }

  async run() {
    return await this.device.getCommands().changePin(this.params);
  }

}

exports.default = ChangePin;