"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

exports.__esModule = true;
exports.default = void 0;

var _AbstractMethod = _interopRequireDefault(require("./AbstractMethod"));

var _paramsValidator = require("./helpers/paramsValidator");

var _CoinInfo = require("../../data/CoinInfo");

var _pathUtils = require("../../utils/pathUtils");

class RippleSignTransaction extends _AbstractMethod.default {
  constructor(message) {
    super(message);
    this.requiredPermissions = ['read', 'write'];
    this.firmwareRange = (0, _paramsValidator.getFirmwareRange)(this.name, (0, _CoinInfo.getMiscNetwork)('Ripple'), this.firmwareRange);
    this.info = 'Sign Ripple transaction';
    const payload = message.payload; // validate incoming parameters

    (0, _paramsValidator.validateParams)(payload, [{
      name: 'path',
      obligatory: true
    }, {
      name: 'transaction',
      obligatory: true
    }]);
    const path = (0, _pathUtils.validatePath)(payload.path, 5); // incoming data should be in ripple-sdk format

    const transaction = payload.transaction;
    (0, _paramsValidator.validateParams)(transaction, [{
      name: 'fee',
      type: 'string'
    }, {
      name: 'flags',
      type: 'number'
    }, {
      name: 'sequence',
      type: 'number'
    }, {
      name: 'maxLedgerVersion',
      type: 'number'
    }, {
      name: 'payment',
      type: 'object'
    }]);
    (0, _paramsValidator.validateParams)(transaction.payment, [{
      name: 'amount',
      type: 'string',
      obligatory: true
    }, {
      name: 'destination',
      type: 'string',
      obligatory: true
    }, {
      name: 'destinationTag',
      type: 'number'
    }]);
    this.params = {
      path,
      transaction
    };
  }

  async run() {
    const tx = this.params.transaction;
    const response = await this.device.getCommands().rippleSignTx({
      address_n: this.params.path,
      fee: parseInt(tx.fee),
      flags: tx.flags,
      sequence: tx.sequence,
      last_ledger_sequence: tx.maxLedgerVersion,
      payment: {
        amount: tx.payment.amount,
        destination: tx.payment.destination,
        destination_tag: tx.payment.destinationTag
      }
    });
    return {
      serializedTx: response.serialized_tx,
      signature: response.signature
    };
  }

}

exports.default = RippleSignTransaction;