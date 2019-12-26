"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

exports.__esModule = true;
exports.default = void 0;

var _AbstractMethod = _interopRequireDefault(require("./AbstractMethod"));

var _paramsValidator = require("./helpers/paramsValidator");

var _CoinInfo = require("../../data/CoinInfo");

class LiskVerifyMessage extends _AbstractMethod.default {
  constructor(message) {
    super(message);
    this.requiredPermissions = ['read', 'write'];
    this.firmwareRange = (0, _paramsValidator.getFirmwareRange)(this.name, (0, _CoinInfo.getMiscNetwork)('Lisk'), this.firmwareRange);
    this.info = 'Verify Lisk message';
    const payload = message.payload; // validate incoming parameters

    (0, _paramsValidator.validateParams)(payload, [{
      name: 'publicKey',
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
    }]); // TODO: check if message is already in hex format

    const messageHex = Buffer.from(payload.message, 'utf8').toString('hex');
    this.params = {
      publicKey: payload.publicKey,
      signature: payload.signature,
      message: messageHex
    };
  }

  async run() {
    return await this.device.getCommands().liskVerifyMessage(this.params.publicKey, this.params.signature, this.params.message);
  }

}

exports.default = LiskVerifyMessage;