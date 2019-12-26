"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

exports.__esModule = true;
exports.default = void 0;

var _defineProperty2 = _interopRequireDefault(require("@babel/runtime/helpers/defineProperty"));

var _bignumber = _interopRequireDefault(require("bignumber.js"));

var _AbstractMethod = _interopRequireDefault(require("./AbstractMethod"));

var _paramsValidator = require("./helpers/paramsValidator");

var _CoinInfo = require("../../data/CoinInfo");

var _pathUtils = require("../../utils/pathUtils");

var _errors = require("../../constants/errors");

var _BlockchainLink = require("../../backend/BlockchainLink");

var _signtx = _interopRequireDefault(require("./helpers/signtx"));

var _signtxVerify = _interopRequireDefault(require("./helpers/signtxVerify"));

var _tx = require("./tx");

function ownKeys(object, enumerableOnly) { var keys = Object.keys(object); if (Object.getOwnPropertySymbols) { var symbols = Object.getOwnPropertySymbols(object); if (enumerableOnly) symbols = symbols.filter(function (sym) { return Object.getOwnPropertyDescriptor(object, sym).enumerable; }); keys.push.apply(keys, symbols); } return keys; }

function _objectSpread(target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i] != null ? arguments[i] : {}; if (i % 2) { ownKeys(Object(source), true).forEach(function (key) { (0, _defineProperty2.default)(target, key, source[key]); }); } else if (Object.getOwnPropertyDescriptors) { Object.defineProperties(target, Object.getOwnPropertyDescriptors(source)); } else { ownKeys(Object(source)).forEach(function (key) { Object.defineProperty(target, key, Object.getOwnPropertyDescriptor(source, key)); }); } } return target; }

class SignTransaction extends _AbstractMethod.default {
  constructor(message) {
    super(message);
    this.requiredPermissions = ['read', 'write'];
    this.info = 'Sign transaction';
    const payload = message.payload; // validate incoming parameters

    (0, _paramsValidator.validateParams)(payload, [{
      name: 'coin',
      type: 'string',
      obligatory: true
    }, {
      name: 'inputs',
      type: 'array',
      obligatory: true
    }, {
      name: 'outputs',
      type: 'array',
      obligatory: true
    }, {
      name: 'refTxs',
      type: 'array',
      allowEmpty: true
    }, {
      name: 'locktime',
      type: 'number'
    }, {
      name: 'timestamp',
      type: 'number'
    }, {
      name: 'version',
      type: 'number'
    }, {
      name: 'expiry',
      type: 'number'
    }, {
      name: 'overwintered',
      type: 'boolean'
    }, {
      name: 'versionGroupId',
      type: 'number'
    }, {
      name: 'branchId',
      type: 'number'
    }, {
      name: 'push',
      type: 'boolean'
    }]);
    const coinInfo = (0, _CoinInfo.getBitcoinNetwork)(payload.coin);

    if (!coinInfo) {
      throw _errors.NO_COIN_INFO;
    } else {
      // set required firmware from coinInfo support
      this.firmwareRange = (0, _paramsValidator.getFirmwareRange)(this.name, coinInfo, this.firmwareRange);
      this.info = (0, _pathUtils.getLabel)('Sign #NETWORK transaction', coinInfo);
    }

    if (Object.prototype.hasOwnProperty.call(payload, 'refTxs')) {
      payload.refTxs.forEach(tx => {
        (0, _paramsValidator.validateParams)(tx, [{
          name: 'hash',
          type: 'string',
          obligatory: true
        }, {
          name: 'inputs',
          type: 'array',
          obligatory: true
        }, {
          name: 'bin_outputs',
          type: 'array',
          obligatory: true
        }, {
          name: 'version',
          type: 'number',
          obligatory: true
        }, {
          name: 'lock_time',
          type: 'number',
          obligatory: true
        }, {
          name: 'extra_data',
          type: 'string'
        }, {
          name: 'timestamp',
          type: 'number'
        }, {
          name: 'version_group_id',
          type: 'number'
        }]);
      });
    }

    const inputs = (0, _tx.validateTrezorInputs)(payload.inputs, coinInfo);
    const outputs = (0, _tx.validateTrezorOutputs)(payload.outputs, coinInfo);
    const outputsWithAmount = outputs.filter(output => typeof output.amount === 'string' && !Object.prototype.hasOwnProperty.call(output, 'op_return_data'));

    if (outputsWithAmount.length > 0) {
      const total = outputsWithAmount.reduce((bn, output) => {
        return bn.plus(typeof output.amount === 'string' ? output.amount : '0');
      }, new _bignumber.default(0));

      if (total.lte(coinInfo.dustLimit)) {
        throw new Error('Total amount is below dust limit.');
      }
    }

    this.params = {
      inputs,
      outputs: payload.outputs,
      refTxs: payload.refTxs,
      options: {
        lock_time: payload.locktime,
        timestamp: payload.timestamp,
        version: payload.version,
        expiry: payload.expiry,
        overwintered: payload.overwintered,
        version_group_id: payload.versionGroupId,
        branch_id: payload.branchId
      },
      coinInfo,
      push: typeof payload.push === 'boolean' ? payload.push : false
    };

    if (coinInfo.hasTimestamp && !Object.prototype.hasOwnProperty.call(payload, 'timestamp')) {
      const d = new Date();
      this.params.options.timestamp = Math.round(d.getTime() / 1000);
    }
  }

  async run() {
    const {
      device,
      params
    } = this;
    let refTxs = [];

    if (!params.refTxs) {
      // initialize backend
      const hdInputs = params.inputs.map(_tx.inputToHD);
      const refTxsIds = (0, _tx.getReferencedTransactions)(hdInputs);

      if (refTxsIds.length > 0) {
        if (!params.coinInfo.blockchainLink) {
          throw (0, _errors.backendNotSupported)(params.coinInfo.name);
        }

        const blockchain = await (0, _BlockchainLink.initBlockchain)(params.coinInfo, this.postMessage);
        const bjsRefTxs = await blockchain.getReferencedTransactions(refTxsIds);
        refTxs = (0, _tx.transformReferencedTransactions)(bjsRefTxs);
      }
    } else {
      refTxs = params.refTxs;
    }

    const response = await (0, _signtx.default)(device.getCommands().typedCall.bind(device.getCommands()), params.inputs, params.outputs, refTxs, params.options, params.coinInfo);
    await (0, _signtxVerify.default)(device.getCommands().getHDNode.bind(device.getCommands()), params.inputs, params.outputs, response.serializedTx, params.coinInfo);

    if (params.push) {
      if (!params.coinInfo.blockchainLink) {
        throw (0, _errors.backendNotSupported)(params.coinInfo.name);
      }

      const blockchain = await (0, _BlockchainLink.initBlockchain)(params.coinInfo, this.postMessage);
      const txid = await blockchain.pushTransaction(response.serializedTx);
      return _objectSpread({}, response, {
        txid
      });
    }

    return response;
  }

}

exports.default = SignTransaction;