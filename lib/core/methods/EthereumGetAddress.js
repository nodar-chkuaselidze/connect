"use strict";

var _interopRequireWildcard = require("@babel/runtime/helpers/interopRequireWildcard");

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

exports.__esModule = true;
exports.default = void 0;

var _defineProperty2 = _interopRequireDefault(require("@babel/runtime/helpers/defineProperty"));

var _AbstractMethod = _interopRequireDefault(require("./AbstractMethod"));

var _paramsValidator = require("./helpers/paramsValidator");

var _pathUtils = require("../../utils/pathUtils");

var _ethereumUtils = require("../../utils/ethereumUtils");

var _CoinInfo = require("../../data/CoinInfo");

var _formatUtils = require("../../utils/formatUtils");

var UI = _interopRequireWildcard(require("../../constants/ui"));

var _builder = require("../../message/builder");

function ownKeys(object, enumerableOnly) { var keys = Object.keys(object); if (Object.getOwnPropertySymbols) { var symbols = Object.getOwnPropertySymbols(object); if (enumerableOnly) symbols = symbols.filter(function (sym) { return Object.getOwnPropertyDescriptor(object, sym).enumerable; }); keys.push.apply(keys, symbols); } return keys; }

function _objectSpread(target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i] != null ? arguments[i] : {}; if (i % 2) { ownKeys(Object(source), true).forEach(function (key) { (0, _defineProperty2.default)(target, key, source[key]); }); } else if (Object.getOwnPropertyDescriptors) { Object.defineProperties(target, Object.getOwnPropertyDescriptors(source)); } else { ownKeys(Object(source)).forEach(function (key) { Object.defineProperty(target, key, Object.getOwnPropertyDescriptor(source, key)); }); } } return target; }

class EthereumGetAddress extends _AbstractMethod.default {
  constructor(message) {
    super(message);
    (0, _defineProperty2.default)(this, "confirmed", false);
    (0, _defineProperty2.default)(this, "progress", 0);
    this.requiredPermissions = ['read']; // create a bundle with only one batch if bundle doesn't exists

    this.hasBundle = Object.prototype.hasOwnProperty.call(message.payload, 'bundle');
    const payload = !this.hasBundle ? _objectSpread({}, message.payload, {
      bundle: [message.payload]
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
        name: 'address',
        type: 'string'
      }, {
        name: 'showOnTrezor',
        type: 'boolean'
      }]);
      const path = (0, _pathUtils.validatePath)(batch.path, 3);
      const network = (0, _CoinInfo.getEthereumNetwork)(path);
      this.firmwareRange = (0, _paramsValidator.getFirmwareRange)(this.name, network, this.firmwareRange);
      let showOnTrezor = true;

      if (Object.prototype.hasOwnProperty.call(batch, 'showOnTrezor')) {
        showOnTrezor = batch.showOnTrezor;
      }

      bundle.push({
        path,
        address: batch.address,
        network,
        showOnTrezor
      });
    }); // set info

    if (bundle.length === 1) {
      this.info = (0, _ethereumUtils.getNetworkLabel)('Export #NETWORK address', bundle[0].network);
    } else {
      const requestedNetworks = bundle.map(b => b.network);
      const uniqNetworks = (0, _CoinInfo.getUniqueNetworks)(requestedNetworks);

      if (uniqNetworks.length === 1 && uniqNetworks[0]) {
        this.info = (0, _ethereumUtils.getNetworkLabel)('Export multiple #NETWORK addresses', uniqNetworks[0]);
      } else {
        this.info = 'Export multiple addresses';
      }
    }

    const useEventListener = payload.useEventListener && bundle.length === 1 && typeof bundle[0].address === 'string' && bundle[0].showOnTrezor;
    this.confirmed = useEventListener;
    this.useUi = !useEventListener;
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

    this.postMessage((0, _builder.UiMessage)(UI.REQUEST_CONFIRMATION, {
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

    this.postMessage((0, _builder.UiMessage)(UI.REQUEST_CONFIRMATION, {
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
        const silent = await this.device.getCommands().ethereumGetAddress(batch.path, batch.network, false);

        if (typeof batch.address === 'string') {
          if ((0, _formatUtils.stripHexPrefix)(batch.address).toLowerCase() !== (0, _formatUtils.stripHexPrefix)(silent.address).toLowerCase()) {
            throw new Error('Addresses do not match');
          }
        } else {
          // save address for future verification in "getButtonRequestData"
          batch.address = silent.address;
        }
      }

      const response = await this.device.getCommands().ethereumGetAddress(batch.path, batch.network, batch.showOnTrezor);
      responses.push({
        address: response.address,
        path: batch.path,
        serializedPath: (0, _pathUtils.getSerializedPath)(batch.path)
      });

      if (this.hasBundle) {
        // send progress
        this.postMessage((0, _builder.UiMessage)(UI.BUNDLE_PROGRESS, {
          progress: i,
          response
        }));
      }

      this.progress++;
    }

    return this.hasBundle ? responses : responses[0];
  }

}

exports.default = EthereumGetAddress;