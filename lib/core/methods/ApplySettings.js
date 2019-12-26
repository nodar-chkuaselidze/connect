"use strict";

var _interopRequireWildcard = require("@babel/runtime/helpers/interopRequireWildcard");

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

exports.__esModule = true;
exports.default = void 0;

var _AbstractMethod = _interopRequireDefault(require("./AbstractMethod"));

var UI = _interopRequireWildcard(require("../../constants/ui"));

var _paramsValidator = require("./helpers/paramsValidator");

var _builder = require("../../message/builder");

class ApplySettings extends _AbstractMethod.default {
  constructor(message) {
    super(message);
    this.requiredPermissions = ['management'];
    this.useEmptyPassphrase = true;
    const payload = message.payload;
    (0, _paramsValidator.validateParams)(payload, [{
      name: 'language',
      type: 'string'
    }, {
      name: 'label',
      type: 'string'
    }, {
      name: 'use_passphrase',
      type: 'boolean'
    }, {
      name: 'homescreen',
      type: 'string'
    }, {
      name: 'passphrase_source',
      type: 'number'
    }, {
      name: 'auto_lock_delay_ms',
      type: 'number'
    }, {
      name: 'display_rotation',
      type: 'number'
    }]);
    this.params = {
      language: payload.language,
      label: payload.label,
      use_passphrase: payload.use_passphrase,
      homescreen: payload.homescreen,
      passhprase_source: payload.passhprase_source,
      auto_lock_delay_ms: payload.auto_lock_delay_ms,
      display_rotation: payload.display_rotation
    };
  }

  async confirmation() {
    // wait for popup window
    await this.getPopupPromise().promise; // initialize user response promise

    const uiPromise = this.createUiPromise(UI.RECEIVE_CONFIRMATION, this.device); // request confirmation view

    this.postMessage(new _builder.UiMessage(UI.REQUEST_CONFIRMATION, {
      view: 'device-management',
      customConfirmButton: {
        className: 'confirm',
        label: 'Proceed'
      },
      label: 'Do you really want to change device settings?'
    })); // wait for user action

    const uiResp = await uiPromise.promise;
    return uiResp.payload;
  }

  async run() {
    return await this.device.getCommands().applySettings(this.params);
  }

}

exports.default = ApplySettings;