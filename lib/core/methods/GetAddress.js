"use strict";

var _interopRequireWildcard = require("@babel/runtime/helpers/interopRequireWildcard");

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

exports.__esModule = true;
exports.default = void 0;

var _defineProperty2 = _interopRequireDefault(require("@babel/runtime/helpers/defineProperty"));

var _AbstractMethod = _interopRequireDefault(require("./AbstractMethod"));

var _paramsValidator = require("./helpers/paramsValidator");

var _pathUtils = require("../../utils/pathUtils");

var _CoinInfo = require("../../data/CoinInfo");

var _errors = require("../../constants/errors");

var UI = _interopRequireWildcard(require("../../constants/ui"));

var _builder = require("../../message/builder");

function ownKeys(object, enumerableOnly) { var keys = Object.keys(object); if (Object.getOwnPropertySymbols) { var symbols = Object.getOwnPropertySymbols(object); if (enumerableOnly) symbols = symbols.filter(function (sym) { return Object.getOwnPropertyDescriptor(object, sym).enumerable; }); keys.push.apply(keys, symbols); } return keys; }

function _objectSpread(target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i] != null ? arguments[i] : {}; if (i % 2) { ownKeys(Object(source), true).forEach(function (key) { (0, _defineProperty2.default)(target, key, source[key]); }); } else if (Object.getOwnPropertyDescriptors) { Object.defineProperties(target, Object.getOwnPropertyDescriptors(source)); } else { ownKeys(Object(source)).forEach(function (key) { Object.defineProperty(target, key, Object.getOwnPropertyDescriptor(source, key)); }); } } return target; }

class GetAddress extends _AbstractMethod.default {
  constructor(message) {
    super(message);
    (0, _defineProperty2.default)(this, "confirmed", false);
    (0, _defineProperty2.default)(this, "progress", 0);
    this.requiredPermissions = ['read']; // create a bundle with only one batch if bundle doesn't exists

    this.hasBundle = Object.prototype.hasOwnProperty.call(message.payload, 'bundle');
    const payload = !this.hasBundle ? _objectSpread({}, message.payload, {
      bundle: [...message.payload]
    }) : message.payload; // validate bundle type

    (0, _paramsValidator.validateParams)(payload, [{
      name: 'bundle',
      type: 'array'
    }, {
      name: 'useEventListener',
      type: 'boolean'
    }]);
    const bundle = [];
    payload.bundle.forEach(batch => {
      // validate incoming parameters for each batch
      (0, _paramsValidator.validateParams)(batch, [{
        name: 'path',
        obligatory: true
      }, {
        name: 'coin',
        type: 'string'
      }, {
        name: 'address',
        type: 'string'
      }, {
        name: 'showOnTrezor',
        type: 'boolean'
      }, {
        name: 'multisig',
        type: 'object'
      }, {
        name: 'scriptType',
        type: 'string'
      }]);
      const path = (0, _pathUtils.validatePath)(batch.path, 1);
      let coinInfo;

      if (batch.coin) {
        coinInfo = (0, _CoinInfo.getBitcoinNetwork)(batch.coin);
      }

      if (coinInfo && !batch.crossChain) {
        (0, _paramsValidator.validateCoinPath)(coinInfo, path);
      } else if (!coinInfo) {
        coinInfo = (0, _CoinInfo.getBitcoinNetwork)(path);
      }

      let showOnTrezor = true;

      if (Object.prototype.hasOwnProperty.call(batch, 'showOnTrezor')) {
        showOnTrezor = batch.showOnTrezor;
      }

      if (!coinInfo) {
        throw _errors.NO_COIN_INFO;
      } else if (coinInfo) {
        // set required firmware from coinInfo support
        this.firmwareRange = (0, _paramsValidator.getFirmwareRange)(this.name, coinInfo, this.firmwareRange);
      } // fix coinInfo network values (segwit/legacy)


      coinInfo = (0, _CoinInfo.fixCoinInfoNetwork)(coinInfo, path);
      bundle.push({
        path,
        address: batch.address,
        coinInfo,
        showOnTrezor,
        multisig: batch.multisig,
        scriptType: batch.scriptType
      });
    });
    const useEventListener = payload.useEventListener && bundle.length === 1 && typeof bundle[0].address === 'string' && bundle[0].showOnTrezor;
    this.confirmed = useEventListener;
    this.useUi = !useEventListener; // set info

    if (bundle.length === 1) {
      this.info = (0, _pathUtils.getLabel)('Export #NETWORK address', bundle[0].coinInfo);
    } else {
      const requestedNetworks = bundle.map(b => b.coinInfo);
      const uniqNetworks = (0, _CoinInfo.getUniqueNetworks)(requestedNetworks);

      if (uniqNetworks.length === 1 && uniqNetworks[0]) {
        this.info = (0, _pathUtils.getLabel)('Export multiple #NETWORK addresses', uniqNetworks[0]);
      } else {
        this.info = 'Export multiple addresses';
      }
    }

    this.params = bundle;
  }

  getButtonRequestData(code) {
    if (code === 'ButtonRequest_Address') {
      const data = {
        type: 'address',
        serializedPath: (0, _pathUtils.getSerializedPath)(this.params[this.progress].path),
        address: this.params[this.progress].address || 'not-set'
      };
      return data;
    }

    return null;
  }

  async confirmation() {
    if (this.confirmed) return true; // wait for popup window

    await this.getPopupPromise().promise; // initialize user response promise

    const uiPromise = this.createUiPromise(UI.RECEIVE_CONFIRMATION, this.device);
    const label = this.info; // request confirmation view

    this.postMessage(new _builder.UiMessage(UI.REQUEST_CONFIRMATION, {
      view: 'export-address',
      label
    })); // wait for user action

    const uiResp = await uiPromise.promise;
    this.confirmed = uiResp.payload;
    return this.confirmed;
  }

  async noBackupConfirmation() {
    // wait for popup window
    await this.getPopupPromise().promise; // initialize user response promise

    const uiPromise = this.createUiPromise(UI.RECEIVE_CONFIRMATION, this.device); // request confirmation view

    this.postMessage(new _builder.UiMessage(UI.REQUEST_CONFIRMATION, {
      view: 'no-backup'
    })); // wait for user action

    const uiResp = await uiPromise.promise;
    return uiResp.payload;
  }

  async run() {
    const responses = [];

    for (let i = 0; i < this.params.length; i++) {
      const batch = this.params[i]; // silently get address and compare with requested address
      // or display as default inside popup

      if (batch.showOnTrezor) {
        const silent = await this.device.getCommands().getAddress(batch.path, batch.coinInfo, false, batch.multisig, batch.scriptType);

        if (typeof batch.address === 'string') {
          if (batch.address !== silent.address) {
            throw new Error('Addresses do not match');
          }
        } else {
          batch.address = silent.address;
        }
      }

      const response = await this.device.getCommands().getAddress(batch.path, batch.coinInfo, batch.showOnTrezor, batch.multisig, batch.scriptType);
      responses.push(response);

      if (this.hasBundle) {
        // send progress
        this.postMessage(new _builder.UiMessage(UI.BUNDLE_PROGRESS, {
          progress: i,
          response
        }));
      }

      this.progress++;
    }

    return this.hasBundle ? responses : responses[0];
  }

}

exports.default = GetAddress;