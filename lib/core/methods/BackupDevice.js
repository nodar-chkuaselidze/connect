"use strict";

var _interopRequireWildcard = require("@babel/runtime/helpers/interopRequireWildcard");

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

exports.__esModule = true;
exports.default = void 0;

var _AbstractMethod = _interopRequireDefault(require("./AbstractMethod"));

var UI = _interopRequireWildcard(require("../../constants/ui"));

var _builder = require("../../message/builder");

class BackupDevice extends _AbstractMethod.default {
  constructor(message) {
    super(message);
    this.requiredPermissions = ['management'];
    this.useEmptyPassphrase = true;
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
      label: 'Do you want to initiate backup procedure?'
    })); // wait for user action

    const uiResp = await uiPromise.promise;
    return uiResp.payload;
  }

  async run() {
    return await this.device.getCommands().backupDevice();
  }

}

exports.default = BackupDevice;