"use strict";

var _interopRequireWildcard = require("@babel/runtime/helpers/interopRequireWildcard");

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

exports.__esModule = true;
exports.default = void 0;

var _AbstractMethod = _interopRequireDefault(require("./AbstractMethod"));

var UI = _interopRequireWildcard(require("../../constants/ui"));

var _paramsValidator = require("./helpers/paramsValidator");

var _builder = require("../../message/builder");

class RecoveryDevice extends _AbstractMethod.default {
  constructor(message) {
    super(message);
    this.requiredPermissions = ['management'];
    this.useEmptyPassphrase = true;
    const payload = message.payload;
    (0, _paramsValidator.validateParams)(payload, [{
      name: 'word_count',
      type: 'number'
    }, {
      name: 'passphrase_protection',
      type: 'boolean'
    }, {
      name: 'pin_protection',
      type: 'boolean'
    }, {
      name: 'language',
      type: 'string'
    }, {
      name: 'label',
      type: 'string'
    }, {
      name: 'enforce_wordlist',
      type: 'boolean'
    }, {
      name: 'type',
      type: 'number'
    }, {
      name: 'u2f_counter',
      type: 'number'
    }, {
      name: 'dry_run',
      type: 'boolean'
    }]);
    this.params = {
      word_count: payload.word_count,
      passphrase_protection: payload.passphrase_protection,
      pin_protection: payload.pin_protection,
      language: payload.language,
      label: payload.label,
      enforce_wordlist: payload.enforce_wordlist,
      type: payload.type,
      u2f_counter: payload.u2f_counter,
      dry_run: payload.dry_run
    };
    this.allowDeviceMode = [...this.allowDeviceMode, UI.INITIALIZE];
    this.useDeviceState = false;
  }

  async confirmation() {
    // wait for popup window
    await this.getPopupPromise().promise; // initialize user response promise

    const uiPromise = this.createUiPromise(UI.RECEIVE_CONFIRMATION, this.device); // request confirmation view

    this.postMessage((0, _builder.UiMessage)(UI.REQUEST_CONFIRMATION, {
      view: 'device-management',
      customConfirmButton: {
        className: 'confirm',
        label: 'Proceed'
      },
      label: 'Do you want to recover device from seed?'
    })); // wait for user action

    const uiResp = await uiPromise.promise;
    return uiResp.payload;
  }

  async run() {
    return await this.device.getCommands().recoveryDevice(this.params);
  }

}

exports.default = RecoveryDevice;