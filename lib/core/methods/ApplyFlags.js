"use strict";

var _interopRequireWildcard = require("@babel/runtime/helpers/interopRequireWildcard");

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

exports.__esModule = true;
exports.default = void 0;

var _AbstractMethod = _interopRequireDefault(require("./AbstractMethod"));

var _paramsValidator = require("./helpers/paramsValidator");

var UI = _interopRequireWildcard(require("../../constants/ui"));

var _builder = require("../../message/builder");

class ApplyFlags extends _AbstractMethod.default {
  constructor(message) {
    super(message);
    this.requiredPermissions = ['management'];
    this.useEmptyPassphrase = true;
    const payload = message.payload;
    (0, _paramsValidator.validateParams)(payload, [{
      name: 'flags',
      type: 'number',
      obligatory: true
    }]);
    this.params = {
      flags: payload.flags
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
      label: 'Do you really want to apply flags?'
    })); // wait for user action

    const uiResp = await uiPromise.promise;
    return uiResp.payload;
  }

  async run() {
    return await this.device.getCommands().applyFlags(this.params);
  }

}

exports.default = ApplyFlags;