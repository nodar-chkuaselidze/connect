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

class ResetDevice extends _AbstractMethod.default {
  constructor(message) {
    super(message);
    (0, _defineProperty2.default)(this, "confirmed", false);
    this.allowDeviceMode = [UI.INITIALIZE, UI.SEEDLESS];
    this.useDeviceState = false;
    this.requiredPermissions = ['management'];
    this.firmwareRange = (0, _paramsValidator.getFirmwareRange)(this.name, null, this.firmwareRange);
    this.info = 'Setup device';
    const payload = message.payload; // validate bundle type

    (0, _paramsValidator.validateParams)(payload, [{
      name: 'displayRandom',
      type: 'boolean'
    }, {
      name: 'strength',
      type: 'number'
    }, {
      name: 'passphraseProtection',
      type: 'boolean'
    }, {
      name: 'pinProtection',
      type: 'boolean'
    }, {
      name: 'language',
      type: 'string'
    }, {
      name: 'label',
      type: 'string'
    }, {
      name: 'u2fCounter',
      type: 'number'
    }, {
      name: 'skipBackup',
      type: 'boolean'
    }, {
      name: 'noBackup',
      type: 'boolean'
    }, {
      name: 'backupType',
      type: 'number'
    }]);
    this.params = {
      display_random: payload.displayRandom,
      strength: payload.strength || 256,
      passphrase_protection: payload.passphraseProtection,
      pin_protection: payload.pinProtection,
      language: payload.language,
      label: payload.label,
      u2f_counter: payload.u2fCounter || Math.floor(Date.now() / 1000),
      skip_backup: payload.skipBackup,
      no_backup: payload.noBackup,
      backup_type: payload.backupType
    };
  }

  async confirmation() {
    if (this.confirmed) return true; // wait for popup window

    await this.getPopupPromise().promise; // initialize user response promise

    const uiPromise = this.createUiPromise(UI.RECEIVE_CONFIRMATION, this.device); // request confirmation view

    this.postMessage(new _builder.UiMessage(UI.REQUEST_CONFIRMATION, {
      view: 'device-management',
      label: 'Do you really you want to create a new wallet?'
    })); // wait for user action

    const uiResp = await uiPromise.promise;
    this.confirmed = uiResp.payload;
    return this.confirmed;
  }

  async run() {
    return await this.device.getCommands().reset(this.params);
  }

}

exports.default = ResetDevice;