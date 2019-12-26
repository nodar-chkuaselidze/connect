"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

exports.__esModule = true;
exports.default = void 0;

var _AbstractMethod = _interopRequireDefault(require("./AbstractMethod"));

var _paramsValidator = require("./helpers/paramsValidator");

var _CoinInfo = require("../../data/CoinInfo");

var _pathUtils = require("../../utils/pathUtils");

class LiskSignMessage extends _AbstractMethod.default {
  constructor(message) {
    super(message);
    this.requiredPermissions = ['read', 'write'];
    this.firmwareRange = (0, _paramsValidator.getFirmwareRange)(this.name, (0, _CoinInfo.getMiscNetwork)('Lisk'), this.firmwareRange);
    const payload = message.payload; // validate incoming parameters

    (0, _paramsValidator.validateParams)(payload, [{
      name: 'path',
      obligatory: true
    }, {
      name: 'message',
      type: 'string',
      obligatory: true
    }]);
    const path = (0, _pathUtils.validatePath)(payload.path, 3);
    this.info = 'Sign Lisk Message'; // TODO: check if message is already in hex format

    const messageHex = Buffer.from(payload.message, 'utf8').toString('hex');
    this.params = {
      path,
      message: messageHex
    };
  }

  async run() {
    const response = await this.device.getCommands().liskSignMessage(this.params.path, this.params.message);
    return {
      publicKey: response.public_key,
      signature: response.signature
    };
  }

}

exports.default = LiskSignMessage;