"use strict";

var _interopRequireWildcard = require("@babel/runtime/helpers/interopRequireWildcard");

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

exports.__esModule = true;
exports.default = void 0;

var _defineProperty2 = _interopRequireDefault(require("@babel/runtime/helpers/defineProperty"));

var _bignumber = _interopRequireDefault(require("bignumber.js"));

var _AbstractMethod = _interopRequireDefault(require("./AbstractMethod"));

var _Discovery = _interopRequireDefault(require("./helpers/Discovery"));

var _paramsValidator = require("./helpers/paramsValidator");

var _pathUtils = require("../../utils/pathUtils");

var _promiseUtils = require("../../utils/promiseUtils");

var UI = _interopRequireWildcard(require("../../constants/ui"));

var _CoinInfo = require("../../data/CoinInfo");

var _formatUtils = require("../../utils/formatUtils");

var _errors = require("../../constants/errors");

var _BlockchainLink = require("../../backend/BlockchainLink");

var _TransactionComposer = _interopRequireDefault(require("./tx/TransactionComposer"));

var _tx = require("./tx");

var _signtx = _interopRequireDefault(require("./helpers/signtx"));

var _signtxVerify = _interopRequireDefault(require("./helpers/signtxVerify"));

var _builder = require("../../message/builder");

function ownKeys(object, enumerableOnly) { var keys = Object.keys(object); if (Object.getOwnPropertySymbols) { var symbols = Object.getOwnPropertySymbols(object); if (enumerableOnly) symbols = symbols.filter(function (sym) { return Object.getOwnPropertyDescriptor(object, sym).enumerable; }); keys.push.apply(keys, symbols); } return keys; }

function _objectSpread(target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i] != null ? arguments[i] : {}; if (i % 2) { ownKeys(Object(source), true).forEach(function (key) { (0, _defineProperty2.default)(target, key, source[key]); }); } else if (Object.getOwnPropertyDescriptors) { Object.defineProperties(target, Object.getOwnPropertyDescriptors(source)); } else { ownKeys(Object(source)).forEach(function (key) { Object.defineProperty(target, key, Object.getOwnPropertyDescriptor(source, key)); }); } } return target; }

class ComposeTransaction extends _AbstractMethod.default {
  constructor(message) {
    super(message);
    this.requiredPermissions = ['read', 'write'];
    const payload = message.payload; // validate incoming parameters

    (0, _paramsValidator.validateParams)(payload, [{
      name: 'outputs',
      type: 'array',
      obligatory: true,
      allowEmpty: true
    }, {
      name: 'coin',
      type: 'string',
      obligatory: true
    }, {
      name: 'push',
      type: 'boolean'
    }, {
      name: 'account',
      type: 'object'
    }, {
      name: 'feeLevels',
      type: 'array'
    }]);
    const coinInfo = (0, _CoinInfo.getBitcoinNetwork)(payload.coin);

    if (!coinInfo) {
      throw _errors.NO_COIN_INFO;
    }

    if (!coinInfo.blockchainLink) {
      throw (0, _errors.backendNotSupported)(coinInfo.name);
    } // set required firmware from coinInfo support


    this.firmwareRange = (0, _paramsValidator.getFirmwareRange)(this.name, coinInfo, this.firmwareRange); // validate each output and transform into hd-wallet format

    const outputs = [];
    let total = new _bignumber.default(0);
    payload.outputs.forEach(out => {
      const output = (0, _tx.validateHDOutput)(out, coinInfo);

      if (typeof output.amount === 'string') {
        total = total.plus(output.amount);
      }

      outputs.push(output);
    });
    const sendMax = outputs.find(o => o.type === 'send-max') !== undefined; // there should be only one output when using send-max option

    if (sendMax && outputs.length > 1) {
      throw new Error('Only one output allowed when using "send-max" option.');
    } // if outputs contains regular items
    // check if total amount is not lower than dust limit
    // if (outputs.find(o => o.type === 'complete') !== undefined && total.lte(coinInfo.dustLimit)) {
    //     throw new Error('Total amount is too low. ');
    // }


    if (sendMax) {
      this.info = 'Send maximum amount';
    } else {
      this.info = `Send ${(0, _formatUtils.formatAmount)(total.toString(), coinInfo)}`;
    }

    this.useDevice = this.useUi = !payload.account && !payload.feeLevels;
    this.params = {
      outputs,
      coinInfo,
      account: payload.account,
      feeLevels: payload.feeLevels,
      push: typeof payload.push === 'boolean' ? payload.push : false
    };
  }

  async precompose(account, feeLevels) {
    const {
      coinInfo,
      outputs
    } = this.params;
    const composer = new _TransactionComposer.default({
      account: {
        type: 'normal',
        label: 'normal',
        descriptor: 'normal',
        address_n: (0, _pathUtils.validatePath)(account.path),
        addresses: account.addresses
      },
      utxo: account.utxo,
      coinInfo,
      outputs
    }); // This is mandatory, hd-wallet expects current block height
    // TODO: make it possible without it (offline composing)

    const blockchain = await (0, _BlockchainLink.initBlockchain)(this.params.coinInfo, this.postMessage);
    await composer.init(blockchain);
    return feeLevels.map(level => {
      composer.composeCustomFee(level.feePerUnit);
      const tx = composer.composed.custom;

      if (tx.type === 'final') {
        const inputs = tx.transaction.inputs.map(inp => (0, _tx.inputToTrezor)(inp, 0));
        const outputs = tx.transaction.outputs.sorted.map(out => (0, _tx.outputToTrezor)(out, coinInfo));
        return {
          type: 'final',
          max: tx.max,
          totalSpent: tx.totalSpent,
          fee: tx.fee,
          feePerByte: tx.feePerByte,
          bytes: tx.bytes,
          transaction: {
            inputs,
            outputs
          }
        };
      }

      return tx;
    });
  }

  async run() {
    if (this.params.account && this.params.feeLevels) {
      return this.precompose(this.params.account, this.params.feeLevels);
    } // discover accounts and wait for user action


    const {
      account,
      utxo
    } = await this.selectAccount(); // wait for fee selection

    const response = await this.selectFee(account, utxo); // check for interruption

    if (!this.discovery) {
      throw new Error('ComposeTransaction selectFee response received after dispose');
    }

    if (typeof response === 'string') {
      // back to account selection
      return this.run();
    } else {
      return response;
    }
  }

  async selectAccount() {
    const {
      coinInfo
    } = this.params;
    const blockchain = await (0, _BlockchainLink.initBlockchain)(coinInfo, this.postMessage);
    const dfd = this.createUiPromise(UI.RECEIVE_ACCOUNT, this.device);

    if (this.discovery && this.discovery.completed) {
      const {
        discovery
      } = this;
      this.postMessage(new _builder.UiMessage(UI.SELECT_ACCOUNT, {
        type: 'end',
        coinInfo,
        accountTypes: discovery.types.map(t => t.type),
        accounts: discovery.accounts
      }));
      const uiResp = await dfd.promise;
      const account = discovery.accounts[uiResp.payload];
      const utxo = await blockchain.getAccountUtxo(account.descriptor);
      return {
        account,
        utxo
      };
    } // initialize backend


    const discovery = this.discovery || new _Discovery.default({
      blockchain,
      commands: this.device.getCommands()
    });
    this.discovery = discovery;
    discovery.on('progress', accounts => {
      this.postMessage(new _builder.UiMessage(UI.SELECT_ACCOUNT, {
        type: 'progress',
        // preventEmpty: true,
        coinInfo,
        accounts
      }));
    });
    discovery.on('complete', () => {
      this.postMessage(new _builder.UiMessage(UI.SELECT_ACCOUNT, {
        type: 'end',
        coinInfo
      }));
    }); // get accounts with addresses (tokens)

    discovery.start('tokens').catch(error => {
      // catch error from discovery process
      dfd.reject(error);
    }); // set select account view
    // this view will be updated from discovery events

    this.postMessage(new _builder.UiMessage(UI.SELECT_ACCOUNT, {
      type: 'start',
      accountTypes: discovery.types.map(t => t.type),
      coinInfo
    })); // wait for user action

    const uiResp = await dfd.promise;
    discovery.removeAllListeners();
    discovery.stop();

    if (!discovery.completed) {
      await (0, _promiseUtils.resolveAfter)(501); // temporary solution, TODO: immediately resolve will cause "device call in progress"
    }

    const account = discovery.accounts[uiResp.payload];
    this.params.coinInfo = (0, _CoinInfo.fixCoinInfoNetwork)(this.params.coinInfo, account.address_n);
    const utxo = await blockchain.getAccountUtxo(account.descriptor);
    return {
      account,
      utxo
    };
  }

  async selectFee(account, utxo) {
    const {
      coinInfo,
      outputs
    } = this.params; // get backend instance (it should be initialized before)

    const blockchain = await (0, _BlockchainLink.initBlockchain)(coinInfo, this.postMessage);
    const composer = new _TransactionComposer.default({
      account,
      utxo,
      coinInfo,
      outputs
    });
    await composer.init(blockchain); // try to compose multiple transactions with different fee levels
    // check if any of composed transactions is valid

    const hasFunds = composer.composeAllFeeLevels();

    if (!hasFunds) {
      // show error view
      this.postMessage(new _builder.UiMessage(UI.INSUFFICIENT_FUNDS)); // wait few seconds...

      await (0, _promiseUtils.resolveAfter)(2000, null); // and go back to discovery

      return 'change-account';
    } // set select account view
    // this view will be updated from discovery events


    this.postMessage(new _builder.UiMessage(UI.SELECT_FEE, {
      feeLevels: composer.getFeeLevelList(),
      coinInfo: this.params.coinInfo
    })); // wait for user action

    return await this._selectFeeUiResponse(composer);
  }

  async _selectFeeUiResponse(composer) {
    const resp = await this.createUiPromise(UI.RECEIVE_FEE, this.device).promise;

    switch (resp.payload.type) {
      case 'compose-custom':
        // recompose custom fee level with requested value
        composer.composeCustomFee(resp.payload.value);
        this.postMessage(new _builder.UiMessage(UI.UPDATE_CUSTOM_FEE, {
          feeLevels: composer.getFeeLevelList(),
          coinInfo: this.params.coinInfo
        })); // wait for user action

        return await this._selectFeeUiResponse(composer);

      case 'send':
        return await this._sign(composer.composed[resp.payload.value]);

      default:
        return 'change-account';
    }
  }

  async _sign(tx) {
    if (tx.type !== 'final') throw new Error('Trying to sign unfinished tx');
    const {
      coinInfo
    } = this.params;
    let refTxs = [];
    const refTxsIds = (0, _tx.getReferencedTransactions)(tx.transaction.inputs);

    if (refTxsIds.length > 0) {
      const blockchain = await (0, _BlockchainLink.initBlockchain)(coinInfo, this.postMessage);
      const bjsRefTxs = await blockchain.getReferencedTransactions(refTxsIds);
      refTxs = (0, _tx.transformReferencedTransactions)(bjsRefTxs);
    }

    const timestamp = coinInfo.hasTimestamp ? Math.round(new Date().getTime() / 1000) : undefined; // const inputs = tx.transaction.inputs.map(inp => inputToTrezor(inp, (0xffffffff - 2))); // TODO: RBF

    const inputs = tx.transaction.inputs.map(inp => (0, _tx.inputToTrezor)(inp, 0));
    const outputs = tx.transaction.outputs.sorted.map(out => (0, _tx.outputToTrezor)(out, coinInfo));
    const response = await (0, _signtx.default)(this.device.getCommands().typedCall.bind(this.device.getCommands()), inputs, outputs, refTxs, {
      timestamp
    }, coinInfo);
    await (0, _signtxVerify.default)(this.device.getCommands().getHDNode.bind(this.device.getCommands()), inputs, outputs, response.serializedTx, coinInfo);

    if (this.params.push) {
      const blockchain = await (0, _BlockchainLink.initBlockchain)(coinInfo, this.postMessage);
      const txid = await blockchain.pushTransaction(response.serializedTx);
      return _objectSpread({}, response, {
        txid
      });
    }

    return response;
  }

  dispose() {
    const {
      discovery
    } = this;

    if (discovery) {
      discovery.stop();
      discovery.removeAllListeners();
      this.discovery = undefined;
    }
  }

}

exports.default = ComposeTransaction;