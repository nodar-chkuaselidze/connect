"use strict";

var _interopRequireWildcard = require("@babel/runtime/helpers/interopRequireWildcard");

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

exports.__esModule = true;
exports.default = void 0;

var _AbstractMethod = _interopRequireDefault(require("./AbstractMethod"));

var _paramsValidator = require("./helpers/paramsValidator");

var _CoinInfo = require("../../data/CoinInfo");

var _pathUtils = require("../../utils/pathUtils");

var helper = _interopRequireWildcard(require("./helpers/cardanoSignTx"));

class CardanoSignTransaction extends _AbstractMethod.default {
  constructor(message) {
    super(message);
    this.requiredPermissions = ['read', 'write'];
    this.firmwareRange = (0, _paramsValidator.getFirmwareRange)(this.name, (0, _CoinInfo.getMiscNetwork)('Cardano'), this.firmwareRange);
    this.info = 'Sign Cardano transaction';
    const payload = message.payload; // validate incoming parameters

    (0, _paramsValidator.validateParams)(payload, [{
      name: 'inputs',
      type: 'array',
      obligatory: true
    }, {
      name: 'outputs',
      type: 'array',
      obligatory: true
    }, {
      name: 'transactions',
      type: 'array',
      obligatory: true
    }, {
      name: 'protocol_magic',
      type: 'number',
      obligatory: true
    }]);
    const inputs = payload.inputs.map(input => {
      (0, _paramsValidator.validateParams)(input, [{
        name: 'path',
        obligatory: true
      }, {
        name: 'prev_hash',
        type: 'string',
        obligatory: true
      }, {
        name: 'prev_index',
        type: 'number',
        obligatory: true
      }, {
        name: 'type',
        type: 'number',
        obligatory: true
      }]);
      return {
        address_n: (0, _pathUtils.validatePath)(input.path, 5),
        prev_hash: input.prev_hash,
        prev_index: input.prev_index,
        type: input.type
      };
    });
    const outputs = payload.outputs.map(output => {
      (0, _paramsValidator.validateParams)(output, [{
        name: 'address',
        type: 'string'
      }, {
        name: 'amount',
        type: 'amount',
        obligatory: true
      }]);

      if (output.path) {
        return {
          address_n: (0, _pathUtils.validatePath)(output.path, 5),
          amount: output.amount
        };
      } else {
        return {
          address: output.address,
          amount: output.amount
        };
      }
    });
    this.params = {
      inputs,
      outputs,
      transactions: payload.transactions,
      protocol_magic: payload.protocol_magic
    };
  }

  async run() {
    const response = await helper.cardanoSignTx(this.device.getCommands().typedCall.bind(this.device.getCommands()), this.params.inputs, this.params.outputs, this.params.transactions, this.params.protocol_magic);
    return {
      hash: response.tx_hash,
      body: response.tx_body
    };
  }

}

exports.default = CardanoSignTransaction;