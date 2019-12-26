"use strict";

var _interopRequireWildcard = require("@babel/runtime/helpers/interopRequireWildcard");

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

exports.__esModule = true;
exports.default = void 0;

var _defineProperty2 = _interopRequireDefault(require("@babel/runtime/helpers/defineProperty"));

var _AbstractMethod = _interopRequireDefault(require("./AbstractMethod"));

var _paramsValidator = require("./helpers/paramsValidator");

var _pathUtils = require("../../utils/pathUtils");

var UI = _interopRequireWildcard(require("../../constants/ui"));

var _builder = require("../../message/builder");

var _CoinInfo = require("../../data/CoinInfo");

function ownKeys(object, enumerableOnly) { var keys = Object.keys(object); if (Object.getOwnPropertySymbols) { var symbols = Object.getOwnPropertySymbols(object); if (enumerableOnly) symbols = symbols.filter(function (sym) { return Object.getOwnPropertyDescriptor(object, sym).enumerable; }); keys.push.apply(keys, symbols); } return keys; }

function _objectSpread(target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i] != null ? arguments[i] : {}; if (i % 2) { ownKeys(Object(source), true).forEach(function (key) { (0, _defineProperty2.default)(target, key, source[key]); }); } else if (Object.getOwnPropertyDescriptors) { Object.defineProperties(target, Object.getOwnPropertyDescriptors(source)); } else { ownKeys(Object(source)).forEach(function (key) { Object.defineProperty(target, key, Object.getOwnPropertyDescriptor(source, key)); }); } } return target; }

class GetPublicKey extends _AbstractMethod.default {
  constructor(message) {
    super(message);
    (0, _defineProperty2.default)(this, "confirmed", false);
    this.requiredPermissions = ['read'];
    this.info = 'Export public key'; // create a bundle with only one batch if bundle doesn't exists

    this.hasBundle = Object.prototype.hasOwnProperty.call(message.payload, 'bundle');
    const payload = !this.hasBundle ? _objectSpread({}, message.payload, {
      bundle: [message.payload]
    }) : message.payload; // validate bundle type

    (0, _paramsValidator.validateParams)(payload, [{
      name: 'bundle',
      type: 'array'
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
        name: 'crossChain',
        type: 'boolean'
      }]);
      let coinInfo;

      if (batch.coin) {
        coinInfo = (0, _CoinInfo.getBitcoinNetwork)(batch.coin);
      }

      const path = (0, _pathUtils.validatePath)(batch.path, coinInfo ? 3 : 0);

      if (coinInfo && !batch.crossChain) {
        (0, _paramsValidator.validateCoinPath)(coinInfo, path);
      } else if (!coinInfo) {
        coinInfo = (0, _CoinInfo.getBitcoinNetwork)(path);
      }

      bundle.push({
        path,
        coinInfo
      }); // set required firmware from coinInfo support

      if (coinInfo) {
        this.firmwareRange = (0, _paramsValidator.getFirmwareRange)(this.name, coinInfo, this.firmwareRange);
      }
    });
    this.params = bundle;
  }

  async confirmation() {
    if (this.confirmed) return true; // wait for popup window

    await this.getPopupPromise().promise; // initialize user response promise

    const uiPromise = this.createUiPromise(UI.RECEIVE_CONFIRMATION, this.device);
    let label;

    if (this.params.length > 1) {
      label = 'Export multiple public keys';
    } else {
      label = (0, _pathUtils.getPublicKeyLabel)(this.params[0].path, this.params[0].coinInfo);
    } // request confirmation view


    this.postMessage(new _builder.UiMessage(UI.REQUEST_CONFIRMATION, {
      view: 'export-xpub',
      label
    })); // wait for user action

    const uiResp = await uiPromise.promise;
    this.confirmed = uiResp.payload;
    return this.confirmed;
  }

  async run() {
    const responses = [];

    for (let i = 0; i < this.params.length; i++) {
      const batch = this.params[i];
      const response = await this.device.getCommands().getHDNode(batch.path, batch.coinInfo);
      responses.push(response);

      if (this.hasBundle) {
        // send progress
        this.postMessage(new _builder.UiMessage(UI.BUNDLE_PROGRESS, {
          progress: i,
          response
        }));
      }
    }

    return this.hasBundle ? responses : responses[0];
  }

}

exports.default = GetPublicKey;