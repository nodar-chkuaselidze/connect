"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

exports.__esModule = true;
exports.default = void 0;

var _AbstractMethod = _interopRequireDefault(require("../AbstractMethod"));

var _paramsValidator = require("../helpers/paramsValidator");

var _errors = require("../../../constants/errors");

var _Fees = _interopRequireDefault(require("../tx/Fees"));

var _BlockchainLink = require("../../../backend/BlockchainLink");

var _CoinInfo = require("../../../data/CoinInfo");

class BlockchainEstimateFee extends _AbstractMethod.default {
  constructor(message) {
    super(message);
    this.useDevice = false;
    this.useUi = false;
    const payload = message.payload; // validate incoming parameters

    (0, _paramsValidator.validateParams)(payload, [{
      name: 'coin',
      type: 'string',
      obligatory: true
    }, {
      name: 'request',
      type: 'object'
    }]);
    const request = payload.request;

    if (request) {
      (0, _paramsValidator.validateParams)(request, [{
        name: 'blocks',
        type: 'array'
      }, {
        name: 'specific',
        type: 'object'
      }, {
        name: 'feeLevels',
        type: 'string'
      }]);

      if (request.specific) {
        (0, _paramsValidator.validateParams)(request.specific, [{
          name: 'conservative',
          type: 'boolean'
        }, {
          name: 'data',
          type: 'string'
        }, {
          name: 'from',
          type: 'string'
        }, {
          name: 'to',
          type: 'string'
        }, {
          name: 'txsize',
          type: 'number'
        }]);
      }
    }

    const coinInfo = (0, _CoinInfo.getCoinInfo)(payload.coin);

    if (!coinInfo) {
      throw _errors.NO_COIN_INFO;
    }

    if (!coinInfo.blockchainLink) {
      throw (0, _errors.backendNotSupported)(coinInfo.name);
    }

    this.params = {
      coinInfo,
      request
    };
  }

  async run() {
    const {
      coinInfo,
      request
    } = this.params;
    const feeInfo = {
      blockTime: coinInfo.blocktime,
      minFee: coinInfo.minFee,
      maxFee: coinInfo.maxFee,
      levels: []
    };

    if (request && request.feeLevels) {
      const fees = new _Fees.default(coinInfo);

      if (request.feeLevels === 'smart') {
        const backend = await (0, _BlockchainLink.initBlockchain)(coinInfo, this.postMessage);
        await fees.load(backend);
      }

      feeInfo.levels = fees.levels;
    } else {
      const backend = await (0, _BlockchainLink.initBlockchain)(coinInfo, this.postMessage);
      feeInfo.levels = await backend.estimateFee(request || {});
    }

    return feeInfo;
  }

}

exports.default = BlockchainEstimateFee;