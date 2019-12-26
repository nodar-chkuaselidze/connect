"use strict";

var _interopRequireWildcard = require("@babel/runtime/helpers/interopRequireWildcard");

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

exports.__esModule = true;
exports.default = void 0;

var _AbstractMethod = _interopRequireDefault(require("./AbstractMethod"));

var _paramsValidator = require("./helpers/paramsValidator");

var _CoinInfo = require("../../data/CoinInfo");

var _pathUtils = require("../../utils/pathUtils");

var helper = _interopRequireWildcard(require("./helpers/tezosSignTx"));

class TezosSignTransaction extends _AbstractMethod.default {
  constructor(message) {
    super(message);
    this.requiredPermissions = ['read', 'write'];
    this.firmwareRange = (0, _paramsValidator.getFirmwareRange)(this.name, (0, _CoinInfo.getMiscNetwork)('Tezos'), this.firmwareRange);
    this.info = 'Sign Tezos transaction';
    const payload = message.payload; // validate incoming parameters

    (0, _paramsValidator.validateParams)(payload, [{
      name: 'path',
      obligatory: true
    }, {
      name: 'branch',
      type: 'string',
      obligatory: true
    }, {
      name: 'operation',
      obligatory: true
    }]);
    const path = (0, _pathUtils.validatePath)(payload.path, 3);
    const branch = payload.branch;
    const operation = payload.operation;
    const transaction = helper.createTx(path, branch, operation);
    this.params = {
      transaction
    };
  }

  async run() {
    return await this.device.getCommands().tezosSignTransaction(this.params.transaction);
  }

}

exports.default = TezosSignTransaction;