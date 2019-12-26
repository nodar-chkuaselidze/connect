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

class WipeDevice extends _AbstractMethod.default {
  constructor(message) {
    super(message);
    (0, _defineProperty2.default)(this, "confirmed", false);
    this.allowDeviceMode = [UI.INITIALIZE, UI.SEEDLESS];
    this.useDeviceState = false;
    this.requiredPermissions = ['management'];
    this.firmwareRange = (0, _paramsValidator.getFirmwareRange)(this.name, null, this.firmwareRange);
    this.info = 'Wipe device';
  }

  async confirmation() {
    if (this.confirmed) return true; // wait for popup window

    await this.getPopupPromise().promise; // initialize user response promise

    const uiPromise = this.createUiPromise(UI.RECEIVE_CONFIRMATION, this.device); // request confirmation view

    this.postMessage(new _builder.UiMessage(UI.REQUEST_CONFIRMATION, {
      view: 'device-management',
      customConfirmButton: {
        className: 'wipe',
        label: `Wipe ${this.device.toMessageObject().label}`
      },
      label: 'Are you sure you want to wipe your device?'
    })); // wait for user action

    const uiResp = await uiPromise.promise;
    this.confirmed = uiResp.payload;
    return this.confirmed;
  }

  async run() {
    return await this.device.getCommands().wipe();
  }

}

exports.default = WipeDevice;