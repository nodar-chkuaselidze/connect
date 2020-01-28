"use strict";

var _interopRequireWildcard = require("@babel/runtime/helpers/interopRequireWildcard");

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

exports.__esModule = true;
exports.default = void 0;

var _AbstractMethod = _interopRequireDefault(require("./AbstractMethod"));

var _paramsValidator = require("./helpers/paramsValidator");

var _pathUtils = require("../../utils/pathUtils");

var _CoinInfo = require("../../data/CoinInfo");

var _ethereumUtils = require("../../utils/ethereumUtils");

var _formatUtils = require("../../utils/formatUtils");

var helper = _interopRequireWildcard(require("./helpers/ethereumSignTx"));

class EthereumSignTx extends _AbstractMethod.default {
  constructor(message) {
    super(message);
    this.requiredPermissions = ['read', 'write'];
    const payload = message.payload; // validate incoming parameters

    (0, _paramsValidator.validateParams)(payload, [{
      name: 'path',
      obligatory: true
    }, {
      name: 'transaction',
      obligatory: true
    }]);
    const path = (0, _pathUtils.validatePath)(payload.path, 3);
    const network = (0, _CoinInfo.getEthereumNetwork)(path);
    this.firmwareRange = (0, _paramsValidator.getFirmwareRange)(this.name, network, this.firmwareRange);
    this.info = (0, _ethereumUtils.getNetworkLabel)('Sign #NETWORK transaction', network); // incoming transaction should be in EthereumTx format
    // https://github.com/ethereumjs/ethereumjs-tx

    const tx = payload.transaction;
    (0, _paramsValidator.validateParams)(tx, [{
      name: 'to',
      type: 'string',
      obligatory: true
    }, {
      name: 'value',
      type: 'string',
      obligatory: true
    }, {
      name: 'gasLimit',
      type: 'string',
      obligatory: true
    }, {
      name: 'gasPrice',
      type: 'string',
      obligatory: true
    }, {
      name: 'nonce',
      type: 'string',
      obligatory: true
    }, {
      name: 'data',
      type: 'string'
    }, {
      name: 'chainId',
      type: 'number'
    }, {
      name: 'txType',
      type: 'number'
    }]); // TODO: check if tx data is a valid hex
    // strip '0x' from values

    Object.keys(tx).map(key => {
      if (typeof tx[key] === 'string') {
        let value = (0, _formatUtils.stripHexPrefix)(tx[key]); // pad left even

        if (value.length % 2 !== 0) {
          value = '0' + value;
        } // $FlowIssue


        tx[key] = value;
      }
    });
    this.params = {
      path,
      transaction: tx
    };
  }

  async run() {
    const tx = this.params.transaction;
    return await helper.ethereumSignTx(this.device.getCommands().typedCall.bind(this.device.getCommands()), this.params.path, tx.to, tx.value, tx.gasLimit, tx.gasPrice, tx.nonce, tx.data, tx.chainId, tx.txType);
  }

}

exports.default = EthereumSignTx;