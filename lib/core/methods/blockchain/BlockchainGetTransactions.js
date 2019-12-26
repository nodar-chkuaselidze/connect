"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

exports.__esModule = true;
exports.default = void 0;

var _AbstractMethod = _interopRequireDefault(require("../AbstractMethod"));

var _paramsValidator = require("../helpers/paramsValidator");

var _errors = require("../../../constants/errors");

var _BlockchainLink = require("../../../backend/BlockchainLink");

var _CoinInfo = require("../../../data/CoinInfo");

class BlockchainGetTransactions extends _AbstractMethod.default {
  constructor(message) {
    super(message);
    this.useDevice = false;
    this.useUi = false;
    const payload = message.payload; // validate incoming parameters

    (0, _paramsValidator.validateParams)(payload, [{
      name: 'txs',
      type: 'array',
      obligatory: true
    }, {
      name: 'coin',
      type: 'string',
      obligatory: true
    }]);
    const coinInfo = (0, _CoinInfo.getCoinInfo)(payload.coin);

    if (!coinInfo) {
      throw _errors.NO_COIN_INFO;
    }

    if (!coinInfo.blockchainLink) {
      throw (0, _errors.backendNotSupported)(coinInfo.name);
    }

    this.params = {
      txs: payload.txs,
      coinInfo
    };
  }

  async run() {
    const backend = await (0, _BlockchainLink.initBlockchain)(this.params.coinInfo, this.postMessage);
    return backend.getTransactions(this.params.txs);
  }

}

exports.default = BlockchainGetTransactions;