"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

exports.__esModule = true;
exports.default = void 0;

var _AbstractMethod = _interopRequireDefault(require("./AbstractMethod"));

var _paramsValidator = require("./helpers/paramsValidator");

var _CoinInfo = require("../../data/CoinInfo");

var _pathUtils = require("../../utils/pathUtils");

var _liskSignTx = require("./helpers/liskSignTx");

class LiskSignTransaction extends _AbstractMethod.default {
  constructor(message) {
    super(message);
    this.requiredPermissions = ['read', 'write'];
    this.firmwareRange = (0, _paramsValidator.getFirmwareRange)(this.name, (0, _CoinInfo.getMiscNetwork)('Lisk'), this.firmwareRange);
    const payload = message.payload; // validate incoming parameters

    (0, _paramsValidator.validateParams)(payload, [{
      name: 'path',
      obligatory: true
    }, {
      name: 'transaction',
      obligatory: true
    }]);
    const path = (0, _pathUtils.validatePath)(payload.path, 3);
    this.info = 'Sign Lisk transaction';
    const tx = payload.transaction;
    (0, _paramsValidator.validateParams)(tx, [{
      name: 'type',
      type: 'number',
      obligatory: true
    }, {
      name: 'fee',
      type: 'string',
      obligatory: true
    }, {
      name: 'amount',
      type: 'amount',
      obligatory: true
    }, {
      name: 'timestamp',
      type: 'number',
      obligatory: true
    }, {
      name: 'recipientId',
      type: 'string'
    }, {
      name: 'signature',
      type: 'string'
    }, {
      name: 'asset',
      type: 'object'
    }]);
    const transaction = (0, _liskSignTx.prepareTx)(tx);
    this.params = {
      path,
      transaction
    };
  }

  async run() {
    return await this.device.getCommands().liskSignTx(this.params.path, this.params.transaction);
  }

}

exports.default = LiskSignTransaction;