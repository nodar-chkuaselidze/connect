"use strict";

var _interopRequireWildcard = require("@babel/runtime/helpers/interopRequireWildcard");

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

exports.__esModule = true;
exports.default = void 0;

var _utxoLib = require("@trezor/utxo-lib");

var _semverCompare = _interopRequireDefault(require("semver-compare"));

var _Device = _interopRequireDefault(require("../../device/Device"));

var _DataManager = _interopRequireDefault(require("../../data/DataManager"));

var UI = _interopRequireWildcard(require("../../constants/ui"));

var DEVICE = _interopRequireWildcard(require("../../constants/device"));

var ERROR = _interopRequireWildcard(require("../../constants/errors"));

var _storage = require("../../storage");

var _builder = require("../../message/builder");

class AbstractMethod {
  // method name
  // method info, displayed in popup info-panel
  // should use popup?
  // use device
  // should validate device state?
  // used in device management (like ResetDevice allow !UI.INITIALIZED)
  // // callbacks
  constructor(message) {
    const payload = message.payload;
    this.name = payload.method;
    this.responseID = message.id || 0;
    this.devicePath = payload.device ? payload.device.path : null;
    this.deviceInstance = payload.device ? payload.device.instance : 0; // expected state from method parameter.
    // it could be null

    this.deviceState = payload.device ? payload.device.state : null;
    this.hasExpectedDeviceState = payload.device ? Object.prototype.hasOwnProperty.call(payload.device, 'state') : false;
    this.keepSession = typeof payload.keepSession === 'boolean' ? payload.keepSession : false;
    this.skipFinalReload = typeof payload.skipFinalReload === 'boolean' ? payload.skipFinalReload : false;
    this.skipFirmwareCheck = false;
    this.overridePreviousCall = typeof payload.override === 'boolean' ? payload.override : false;
    this.overridden = false;
    this.useEmptyPassphrase = typeof payload.useEmptyPassphrase === 'boolean' ? payload.useEmptyPassphrase : false;
    this.allowSeedlessDevice = typeof payload.allowSeedlessDevice === 'boolean' ? payload.allowSeedlessDevice : false;
    this.allowDeviceMode = [];
    this.requireDeviceMode = [];

    if (this.allowSeedlessDevice) {
      this.allowDeviceMode = [UI.SEEDLESS];
    }

    this.debugLink = false; // default values for all methods

    this.firmwareRange = {
      '1': {
        min: '1.0.0',
        max: '0'
      },
      '2': {
        min: '2.0.0',
        max: '0'
      }
    };
    this.requiredPermissions = [];
    this.useDevice = true;
    this.useDeviceState = true;
    this.useUi = true;
  }

  setDevice(device) {
    this.device = device;
    this.devicePath = device.getDevicePath();
  }

  async run() {
    // to override
    return new Promise(resolve => resolve({}));
  }

  async requestPermissions() {
    // wait for popup window
    await this.getPopupPromise().promise; // initialize user response promise

    const uiPromise = this.createUiPromise(UI.RECEIVE_PERMISSION, this.device);
    this.postMessage(new _builder.UiMessage(UI.REQUEST_PERMISSION, {
      permissions: this.requiredPermissions,
      device: this.device.toMessageObject()
    })); // wait for response

    const uiResp = await uiPromise.promise;
    const permissionsResponse = uiResp.payload;

    if (permissionsResponse.granted) {
      this.savePermissions(!permissionsResponse.remember);
      return true;
    }

    return false;
  }

  checkPermissions() {
    const savedPermissions = (0, _storage.load)(_storage.PERMISSIONS_KEY);
    let notPermitted = [...this.requiredPermissions];

    if (savedPermissions && Array.isArray(savedPermissions)) {
      // find permissions for this origin
      const originPermissions = savedPermissions.filter(p => p.origin === _DataManager.default.getSettings('origin'));

      if (originPermissions.length > 0) {
        // check if permission was granted
        notPermitted = notPermitted.filter(np => {
          const granted = originPermissions.find(p => p.type === np && p.device === this.device.features.device_id);
          return !granted;
        });
      }
    }

    this.requiredPermissions = notPermitted;
  }

  savePermissions(temporary = false) {
    let savedPermissions = (0, _storage.load)(_storage.PERMISSIONS_KEY, temporary);

    if (!savedPermissions || !Array.isArray(savedPermissions)) {
      savedPermissions = JSON.parse('[]');
    }

    let permissionsToSave = this.requiredPermissions.map(p => {
      return {
        origin: _DataManager.default.getSettings('origin'),
        type: p,
        device: this.device.features.device_id
      };
    }); // check if this will be first time granted permission to read this device
    // if so, emit "device_connect" event because this wasn't send before

    let emitEvent = false;

    if (this.requiredPermissions.indexOf('read') >= 0) {
      const wasAlreadyGranted = savedPermissions.filter(p => p.origin === _DataManager.default.getSettings('origin') && p.type === 'read' && p.device === this.device.features.device_id);

      if (wasAlreadyGranted.length < 1) {
        emitEvent = true;
      }
    } // find permissions for this origin


    const originPermissions = savedPermissions.filter(p => p.origin === _DataManager.default.getSettings('origin'));

    if (originPermissions.length > 0) {
      permissionsToSave = permissionsToSave.filter(p2s => {
        const granted = originPermissions.find(p => p.type === p2s.type && p.device === p2s.device);
        return !granted;
      });
    }

    (0, _storage.save)(_storage.PERMISSIONS_KEY, savedPermissions.concat(permissionsToSave), temporary);

    if (emitEvent) {
      this.postMessage(new _builder.DeviceMessage(DEVICE.CONNECT, this.device.toMessageObject()));
    }
  }

  async checkFirmwareRange(isUsingPopup) {
    if (this.skipFirmwareCheck) {
      return null;
    }

    const device = this.device;
    if (!device.features) return null;
    const model = device.features.major_version;
    const range = this.firmwareRange[model];

    if (device.firmwareStatus === 'none') {
      return UI.FIRMWARE_NOT_INSTALLED;
    }

    if (range.min === '0') {
      return UI.FIRMWARE_NOT_SUPPORTED;
    }

    if (device.firmwareStatus === 'required' || (0, _semverCompare.default)(device.getVersion(), range.min) < 0) {
      return UI.FIRMWARE_OLD;
    }

    if (range.max !== '0' && (0, _semverCompare.default)(device.getVersion(), range.max) > 0) {
      if (isUsingPopup) {
        // wait for popup handshake
        await this.getPopupPromise().promise; // initialize user response promise

        const uiPromise = this.createUiPromise(UI.RECEIVE_CONFIRMATION, device); // show unexpected state information and wait for confirmation

        this.postMessage(new _builder.UiMessage(UI.FIRMWARE_NOT_COMPATIBLE, device.toMessageObject()));
        const uiResp = await uiPromise.promise;

        if (!uiResp.payload) {
          throw ERROR.PERMISSIONS_NOT_GRANTED;
        }
      } else {
        return UI.FIRMWARE_NOT_COMPATIBLE;
      }
    }

    return null;
  }

  getCustomMessages() {
    return null;
  }

  __hash(permission) {
    const host = _DataManager.default.getSettings('origin');

    const secret = `${permission}#${this.device.features.device_id}#${host}`;

    const hash = _utxoLib.crypto.hash256(Buffer.from(secret, 'binary'));

    return hash.toString('hex');
  }

  dispose() {// to override
  }

}

exports.default = AbstractMethod;