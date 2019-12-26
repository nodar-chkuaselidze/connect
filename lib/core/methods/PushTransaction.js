"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

exports.__esModule = true;
exports.default = void 0;

var _AbstractMethod = _interopRequireDefault(require("./AbstractMethod"));

var _paramsValidator = require("./helpers/paramsValidator");

var _CoinInfo = require("../../data/CoinInfo");

var _errors = require("../../constants/errors");

var _BlockchainLink = require("../../backend/BlockchainLink");

class PushTransaction extends _AbstractMethod.default {
  constructor(message) {
    super(message);
    this.requiredPermissions = [];
    this.useUi = false;
    this.useDevice = false;
    const payload = message.payload; // validate incoming parameters

    (0, _paramsValidator.validateParams)(payload, [{
      name: 'tx',
      type: 'string',
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

    if (coinInfo.type === 'bitcoin' && !/^[0-9A-Fa-f]*$/.test(payload.tx)) {
      throw new Error('Invalid params: Transaction must be hexadecimal');
    }

    this.params = {
      tx: payload.tx,
      coinInfo
    };
  }

  async run() {
    const backend = await (0, _BlockchainLink.initBlockchain)(this.params.coinInfo, this.postMessage);
    const txid = await backend.pushTransaction(this.params.tx);
    return {
      txid
    };
  }

}

exports.default = PushTransaction;