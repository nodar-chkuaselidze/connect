"use strict";

var _interopRequireWildcard = require("@babel/runtime/helpers/interopRequireWildcard");

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

exports.__esModule = true;
exports.default = void 0;

var _AbstractMethod = _interopRequireDefault(require("./AbstractMethod"));

var _paramsValidator = require("./helpers/paramsValidator");

var _CoinInfo = require("../../data/CoinInfo");

var _pathUtils = require("../../utils/pathUtils");

var helper = _interopRequireWildcard(require("./helpers/binanceSignTx"));

class BinanceSignTransaction extends _AbstractMethod.default {
  constructor(message) {
    super(message);
    this.requiredPermissions = ['read', 'write'];
    this.firmwareRange = (0, _paramsValidator.getFirmwareRange)(this.name, (0, _CoinInfo.getMiscNetwork)('BNB'), this.firmwareRange);
    this.info = 'Sign Binance transaction';
    const payload = message.payload; // validate incoming parameters

    (0, _paramsValidator.validateParams)(payload, [{
      name: 'path',
      type: 'string',
      obligatory: true
    }, {
      name: 'transaction',
      obligatory: true
    }]);
    const path = (0, _pathUtils.validatePath)(payload.path, 3);
    const transaction = helper.validate(payload.transaction);
    this.params = {
      path,
      transaction
    };
  }

  async run() {
    return helper.signTx(this.device.getCommands().typedCall.bind(this.device.getCommands()), this.params.path, this.params.transaction);
  }

}

exports.default = BinanceSignTransaction;