"use strict";

var _interopRequireWildcard = require("@babel/runtime/helpers/interopRequireWildcard");

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

exports.__esModule = true;
exports.initBlockchain = exports.find = exports.default = void 0;

var _defineProperty2 = _interopRequireDefault(require("@babel/runtime/helpers/defineProperty"));

var _utxoLib = require("@trezor/utxo-lib");

var _blockchainLink = _interopRequireDefault(require("@trezor/blockchain-link"));

var _builder = require("../message/builder");

var BLOCKCHAIN = _interopRequireWildcard(require("../constants/blockchain"));

var _workers = require("../env/node/workers");

function ownKeys(object, enumerableOnly) { var keys = Object.keys(object); if (Object.getOwnPropertySymbols) { var symbols = Object.getOwnPropertySymbols(object); if (enumerableOnly) symbols = symbols.filter(function (sym) { return Object.getOwnPropertyDescriptor(object, sym).enumerable; }); keys.push.apply(keys, symbols); } return keys; }

function _objectSpread(target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i] != null ? arguments[i] : {}; if (i % 2) { ownKeys(Object(source), true).forEach(function (key) { (0, _defineProperty2.default)(target, key, source[key]); }); } else if (Object.getOwnPropertyDescriptors) { Object.defineProperties(target, Object.getOwnPropertyDescriptors(source)); } else { ownKeys(Object(source)).forEach(function (key) { Object.defineProperty(target, key, Object.getOwnPropertyDescriptor(source, key)); }); } } return target; }

_utxoLib.Transaction.USE_STRING_VALUES = true;

const getWorker = type => {
  switch (type) {
    case 'blockbook':
      return _workers.BlockbookWorker;

    case 'ripple':
      return _workers.RippleWorker;

    default:
      return null;
  }
};

class Blockchain {
  constructor(options) {
    (0, _defineProperty2.default)(this, "feeForBlock", []);
    (0, _defineProperty2.default)(this, "feeTimestamp", 0);
    this.coinInfo = options.coinInfo;
    this.postMessage = options.postMessage;
    const settings = options.coinInfo.blockchainLink;

    if (!settings) {
      throw new Error('BlockchainLink settings not found in coins.json');
    }

    const worker = getWorker(settings.type);

    if (!worker) {
      throw new Error(`BlockchainLink worker not found ${settings.type}`);
    }

    this.link = new _blockchainLink.default({
      name: this.coinInfo.shortcut,
      worker: worker,
      server: settings.url,
      debug: false
    });
  }

  onError(error) {
    this.link.removeAllListeners();
    this.postMessage((0, _builder.BlockchainMessage)(BLOCKCHAIN.ERROR, {
      coin: this.coinInfo,
      error
    }));
    remove(this); // eslint-disable-line no-use-before-define
  }

  async init() {
    this.link.on('connected', async () => {
      const info = await this.link.getInfo();
      this.postMessage((0, _builder.BlockchainMessage)(BLOCKCHAIN.CONNECT, _objectSpread({
        coin: this.coinInfo
      }, info)));
    });
    this.link.on('disconnected', () => {
      this.onError('Disconnected');
    });
    this.link.on('error', error => {
      this.onError(error.message);
    });

    try {
      await this.link.connect();
    } catch (error) {
      this.onError(error.message);
      throw error;
    }
  }

  async loadTransaction(id) {
    const transaction = await this.link.getTransaction(id);
    return _utxoLib.Transaction.fromHex(transaction.tx.hex, this.coinInfo.network);
  }

  async getTransactions(txs) {
    return Promise.all(txs.map(id => this.link.getTransaction(id)));
  }

  async getReferencedTransactions(txs) {
    return Promise.all(txs.map(id => this.loadTransaction(id)));
  }

  async getNetworkInfo() {
    return this.link.getInfo();
  }

  async getAccountInfo(request) {
    return this.link.getAccountInfo(request);
  }

  async getAccountUtxo(descriptor) {
    return this.link.getAccountUtxo(descriptor);
  }

  async estimateFee(request) {
    const {
      blocks
    } = request;

    if (blocks) {
      const now = Date.now();
      const outdated = now - this.feeTimestamp > 20 * 60 * 1000;
      const unknownBlocks = blocks.filter(b => typeof this.feeForBlock !== 'string');

      if (!outdated && unknownBlocks.length < 1) {} // return cached
      // get new values


      const fees = await this.link.estimateFee(request); // cache blocks for future use

      blocks.forEach((block, index) => {
        this.feeForBlock[block] = fees[index];
      });
      this.feeTimestamp = now;
    }

    return this.link.estimateFee(request);
  }

  async subscribe(accounts) {
    // set block listener if it wasn't set before
    if (this.link.listenerCount('block') === 0) {
      this.link.on('block', block => {
        this.postMessage((0, _builder.BlockchainMessage)(BLOCKCHAIN.BLOCK, _objectSpread({
          coin: this.coinInfo
        }, block)));
      });
    } // set notification listener if it wasn't set before


    if (this.link.listenerCount('notification') === 0) {
      this.link.on('notification', notification => {
        this.postMessage((0, _builder.BlockchainMessage)(BLOCKCHAIN.NOTIFICATION, {
          coin: this.coinInfo,
          notification
        }));
      });
    }

    await this.link.subscribe({
      type: 'block'
    });
    return this.link.subscribe({
      type: 'accounts',
      accounts
    });
  }

  async unsubscribe(accounts) {
    if (!accounts) {
      this.link.removeAllListeners('block');
      this.link.removeAllListeners('notification'); // remove all subscriptions

      await this.link.unsubscribe({
        type: 'block'
      });
      return this.link.unsubscribe({
        type: 'notification'
      });
    } // unsubscribe only requested accounts


    return this.link.unsubscribe({
      type: 'accounts',
      accounts
    });
  }

  async pushTransaction(tx) {
    return await this.link.pushTransaction(tx);
  }

  async disconnect() {
    this.link.removeAllListeners();
    this.link.disconnect();
    this.onError('Disconnected');
  }

}

exports.default = Blockchain;
const instances = [];

const remove = backend => {
  const index = instances.indexOf(backend);

  if (index >= 0) {
    instances.splice(index, 1);
  }
};

const find = name => {
  for (let i = 0; i < instances.length; i++) {
    if (instances[i].coinInfo.name === name) {
      return instances[i];
    }
  }

  return null;
};

exports.find = find;

const initBlockchain = async (coinInfo, postMessage) => {
  let backend = find(coinInfo.name);

  if (!backend) {
    backend = new Blockchain({
      coinInfo,
      postMessage
    });

    try {
      await backend.init();
    } catch (error) {
      remove(backend);
      throw error;
    }

    instances.push(backend);
  }

  return backend;
};

exports.initBlockchain = initBlockchain;