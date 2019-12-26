"use strict";

var _interopRequireWildcard = require("@babel/runtime/helpers/interopRequireWildcard");

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

exports.__esModule = true;
exports.default = void 0;

var _defineProperty2 = _interopRequireDefault(require("@babel/runtime/helpers/defineProperty"));

var _AbstractMethod = _interopRequireDefault(require("./AbstractMethod"));

var UI = _interopRequireWildcard(require("../../constants/ui"));

var _builder = require("../../message/builder");

var _paramsValidator = require("./helpers/paramsValidator");

class LoadDevice extends _AbstractMethod.default {
  constructor(message) {
    super(message);
    (0, _defineProperty2.default)(this, "confirmed", false);
    this.allowDeviceMode = [UI.INITIALIZE, UI.SEEDLESS];
    this.useDeviceState = false;
    this.requiredPermissions = ['management'];
    this.info = 'Load device';
    const payload = message.payload; // validate bundle type

    (0, _paramsValidator.validateParams)(payload, [{
      name: 'mnemonics',
      type: 'array'
    }, {
      name: 'node',
      type: 'object'
    }, {
      name: 'pin',
      type: 'string'
    }, {
      name: 'passphraseProtection',
      type: 'boolean'
    }, {
      name: 'language',
      type: 'string'
    }, {
      name: 'label',
      type: 'string'
    }, {
      name: 'skipChecksum',
      type: 'boolean'
    }, {
      name: 'u2fCounter',
      type: 'number'
    }]);
    this.params = {
      mnemonics: payload.mnemonics,
      node: payload.node,
      pin: payload.pin,
      passphrase_protection: payload.passphraseProtection,
      language: payload.language,
      label: payload.label,
      skip_checksum: payload.skipChecksum,
      u2f_counter: payload.u2fCounter || Math.floor(Date.now() / 1000)
    };
  }

  async confirmation() {
    if (this.confirmed) return true; // wait for popup window

    await this.getPopupPromise().promise; // initialize user response promise

    const uiPromise = this.createUiPromise(UI.RECEIVE_CONFIRMATION, this.device); // request confirmation view

    this.postMessage(new _builder.UiMessage(UI.REQUEST_CONFIRMATION, {
      view: 'device-management',
      customConfirmButton: {
        className: 'wipe',
        label: `Load ${this.device.toMessageObject().label}`
      },
      label: 'Are you sure you want to load your device?'
    })); // wait for user action

    const uiResp = await uiPromise.promise;
    this.confirmed = uiResp.payload;
    return this.confirmed;
  }

  async run() {
    // todo: remove when listed firmwares become mandatory
    if (!this.device.atLeast(['1.8.2', '2.1.2'])) {
      if (!this.params.mnemonics || typeof this.params.mnemonics[0] !== 'string') {
        throw new Error('invalid mnemonic array. should contain at least one mnemonic string');
      }

      this.params.mnemonic = this.params.mnemonics[0];
      delete this.params.mnemonics;
    }

    return await this.device.getCommands().load(this.params);
  }

}

exports.default = LoadDevice;