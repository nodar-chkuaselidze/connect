"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

exports.__esModule = true;
exports.default = void 0;

var _AbstractMethod = _interopRequireDefault(require("./AbstractMethod"));

var _paramsValidator = require("./helpers/paramsValidator");

var _CoinInfo = require("../../data/CoinInfo");

var _pathUtils = require("../../utils/pathUtils");

var _errors = require("../../constants/errors");

class VerifyMessage extends _AbstractMethod.default {
  constructor(message) {
    super(message);
    this.requiredPermissions = ['read', 'write'];
    this.info = 'Verify message';
    const payload = message.payload; // validate incoming parameters for each batch

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
      name: 'coin',
      type: 'string',
      obligatory: true
    }]);
    const coinInfo = (0, _CoinInfo.getBitcoinNetwork)(payload.coin);

    if (!coinInfo) {
      throw _errors.NO_COIN_INFO;
    } else {
      // check required firmware with coinInfo support
      this.firmwareRange = (0, _paramsValidator.getFirmwareRange)(this.name, coinInfo, this.firmwareRange);
      this.info = (0, _pathUtils.getLabel)('Verify #NETWORK message', coinInfo);
    } // TODO: check if message is already a hex


    const messageHex = Buffer.from(payload.message, 'utf8').toString('hex');
    const signatureHex = Buffer.from(payload.signature, 'base64').toString('hex');
    this.params = {
      address: payload.address,
      signature: signatureHex,
      message: messageHex,
      coinInfo
    };
  }

  async run() {
    return await this.device.getCommands().verifyMessage(this.params.address, this.params.signature, this.params.message, this.params.coinInfo.name);
  }

}

exports.default = VerifyMessage;