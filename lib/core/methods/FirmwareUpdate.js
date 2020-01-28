"use strict";

var _interopRequireWildcard = require("@babel/runtime/helpers/interopRequireWildcard");

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

exports.__esModule = true;
exports.default = void 0;

var _AbstractMethod = _interopRequireDefault(require("./AbstractMethod"));

var UI = _interopRequireWildcard(require("../../constants/ui"));

var _paramsValidator = require("./helpers/paramsValidator");

var _uploadFirmware = require("./helpers/uploadFirmware");

var _builder = require("../../message/builder");

class FirmwareUpdate extends _AbstractMethod.default {
  constructor(message) {
    super(message);
    this.useEmptyPassphrase = true;
    this.requiredPermissions = ['management'];
    this.allowDeviceMode = [UI.BOOTLOADER, UI.INITIALIZE];
    this.requireDeviceMode = [UI.BOOTLOADER];
    this.useDeviceState = false;
    this.skipFirmwareCheck = true;
    const payload = message.payload;
    (0, _paramsValidator.validateParams)(payload, [{
      name: 'payload',
      type: 'buffer',
      obligatory: true
    } // { name: 'hash', type: 'string' },
    ]);
    this.params = {
      payload: payload.payload,
      length: payload.payload.byteLength
    };
  }

  async confirmation() {
    // wait for popup window
    await this.getPopupPromise().promise; // initialize user response promise

    const uiPromise = this.createUiPromise(UI.RECEIVE_CONFIRMATION, this.device); // request confirmation view

    this.postMessage((0, _builder.UiMessage)(UI.REQUEST_CONFIRMATION, {
      view: 'device-management',
      customConfirmButton: {
        className: 'wipe',
        label: 'Proceed'
      },
      label: 'Do you want to update firmware? Never do this without your recovery card.'
    })); // wait for user action

    const uiResp = await uiPromise.promise;
    return uiResp.payload;
  }

  async run() {
    const {
      device,
      params
    } = this;
    const response = await (0, _uploadFirmware.uploadFirmware)(this.device.getCommands().typedCall.bind(this.device.getCommands()), this.postMessage, device, params);
    return response;
  }

}

exports.default = FirmwareUpdate;