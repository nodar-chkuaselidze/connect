"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

exports.__esModule = true;
exports.default = void 0;

var _defineProperty2 = _interopRequireDefault(require("@babel/runtime/helpers/defineProperty"));

var _bignumber = _interopRequireDefault(require("bignumber.js"));

var _hdWallet = require("hd-wallet");

var _Fees = _interopRequireDefault(require("./Fees"));

var _BlockchainLink = _interopRequireDefault(require("../../../backend/BlockchainLink"));

var _pathUtils = require("../../../utils/pathUtils");

class TransactionComposer {
  constructor(options) {
    (0, _defineProperty2.default)(this, "blockHeight", 0);
    (0, _defineProperty2.default)(this, "composed", {});
    this.account = options.account;
    this.outputs = options.outputs;
    this.coinInfo = options.coinInfo;
    this.blockHeight = 0;
    this.feeLevels = new _Fees.default(options.coinInfo); // map to hd-wallet/buildTx format

    const {
      addresses
    } = options.account;
    const allAddresses = !addresses ? [] : addresses.used.concat(addresses.unused).concat(addresses.change).map(a => a.address);
    this.utxos = options.utxo.map(u => {
      const addressPath = (0, _pathUtils.getHDPath)(u.path);
      return {
        index: u.vout,
        transactionHash: u.txid,
        value: u.amount,
        addressPath: [addressPath[3], addressPath[4]],
        height: u.blockHeight,
        tsize: 0,
        // doesn't matter
        vsize: 0,
        // doesn't matter
        coinbase: typeof u.coinbase === 'boolean' ? u.coinbase : false,
        // decide it it can be spent immediately (false) or after 100 conf (true)
        own: allAddresses.indexOf(u.address) >= 0 // decide if it can be spent immediately (own) or after 6 conf (not own)

      };
    });
  }

  async init(blockchain) {
    const {
      blockHeight
    } = await blockchain.getNetworkInfo();
    this.blockHeight = blockHeight;
    await this.feeLevels.load(blockchain);
  } // Composing fee levels for SelectFee view in popup


  composeAllFeeLevels() {
    const {
      levels
    } = this.feeLevels;
    if (this.utxos.length < 1) return false;
    this.composed = {};
    let atLeastOneValid = false;

    for (const level of levels) {
      if (level.feePerUnit !== '0') {
        const tx = this.compose(level.feePerUnit);

        if (tx.type === 'final') {
          atLeastOneValid = true;
        }

        this.composed[level.label] = tx;
      }
    }

    if (!atLeastOneValid) {
      const lastLevel = levels[levels.length - 1];
      let lastFee = new _bignumber.default(lastLevel.feePerUnit);

      while (lastFee.gt(this.coinInfo.minFee) && this.composed['custom'] === undefined) {
        lastFee = lastFee.minus(1);
        const tx = this.compose(lastFee.toString());

        if (tx.type === 'final') {
          this.feeLevels.updateCustomFee(tx.feePerByte);
          this.composed['custom'] = tx;
          return true;
        }
      }

      return false;
    }

    return true;
  }

  composeCustomFee(fee) {
    const tx = this.compose(fee);
    this.composed['custom'] = tx;

    if (tx.type === 'final') {
      this.feeLevels.updateCustomFee(tx.feePerByte);
    } else {
      this.feeLevels.updateCustomFee(fee);
    }
  }

  getFeeLevelList() {
    const list = [];
    const {
      levels
    } = this.feeLevels;
    levels.forEach(level => {
      const tx = this.composed[level.label];

      if (tx && tx.type === 'final') {
        list.push({
          name: level.label,
          fee: tx.fee,
          feePerByte: level.feePerUnit,
          minutes: level.blocks * this.coinInfo.blocktime,
          total: tx.totalSpent
        });
      } else {
        list.push({
          name: level.label,
          fee: '0',
          disabled: true
        });
      }
    });
    return list;
  }

  compose(feeRate) {
    const account = this.account;
    const {
      addresses
    } = account;
    if (!addresses) return {
      type: 'error',
      error: 'ADDRESSES-NOT-SET'
    };
    const changeId = addresses.change.findIndex(a => a.transfers < 1);
    if (changeId < 0) return {
      type: 'error',
      error: 'CHANGE-ADDRESS-NOT-SET'
    };
    const changeAddress = addresses.change[changeId].address;
    return (0, _hdWallet.buildTx)({
      utxos: this.utxos,
      outputs: this.outputs,
      height: this.blockHeight,
      feeRate,
      segwit: this.coinInfo.segwit,
      inputAmounts: this.coinInfo.segwit || this.coinInfo.forkid !== null,
      basePath: account.address_n,
      network: this.coinInfo.network,
      changeId,
      changeAddress,
      dustThreshold: this.coinInfo.dustLimit
    });
  }

  dispose() {// TODO
  }

}

exports.default = TransactionComposer;