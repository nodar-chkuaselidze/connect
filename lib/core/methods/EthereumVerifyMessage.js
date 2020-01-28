"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

exports.__esModule = true;
exports.default = void 0;

var _AbstractMethod = _interopRequireDefault(require("./AbstractMethod"));

var _paramsValidator = require("./helpers/paramsValidator");

var _formatUtils = require("../../utils/formatUtils");

class EthereumVerifyMessage extends _AbstractMethod.default {
  constructor(message) {
    super(message);
    this.requiredPermissions = ['read', 'write'];
    this.firmwareRange = (0, _paramsValidator.getFirmwareRange)(this.name, null, this.firmwareRange);
    this.info = 'Verify message';
    const payload = message.payload; // validate incoming parameters

    (0, _paramsValidator.validateParams)(payload, [{
      name: 'address',
      type: 'string',
      obligatory: true
    }, {
      name: 'signature',
      type: 'string',
      obligatory: true
    }, {
      name: 'message',
      type: 'string',
      obligatory: true
    }, {
      name: 'hex',
      type: 'boolean'
    }]);
    const messageHex = payload.hex ? (0, _formatUtils.messageToHex)(payload.message) : Buffer.from(payload.message, 'utf8').toString('hex');
    this.params = {
      address: (0, _formatUtils.stripHexPrefix)(payload.address),
      signature: (0, _formatUtils.stripHexPrefix)(payload.signature),
      message: messageHex
    };
  }

  async run() {
    return await this.device.getCommands().ethereumVerifyMessage(this.params.address, this.params.signature, this.params.message);
  }

}

exports.default = EthereumVerifyMessage;