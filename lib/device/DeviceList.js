"use strict";

var _interopRequireWildcard = require("@babel/runtime/helpers/interopRequireWildcard");

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

exports.__esModule = true;
exports.getDeviceList = exports.default = void 0;

var _defineProperty2 = _interopRequireDefault(require("@babel/runtime/helpers/defineProperty"));

var _events = _interopRequireDefault(require("events"));

var TRANSPORT = _interopRequireWildcard(require("../constants/transport"));

var DEVICE = _interopRequireWildcard(require("../constants/device"));

var ERROR = _interopRequireWildcard(require("../constants/errors"));

var _DescriptorStream = _interopRequireDefault(require("./DescriptorStream"));

var _Device = _interopRequireDefault(require("./Device"));

var _trezorLink = _interopRequireDefault(require("trezor-link"));

var _DataManager = _interopRequireDefault(require("../data/DataManager"));

var _TransportInfo = require("../data/TransportInfo");

var _debug = _interopRequireWildcard(require("../utils/debug"));

var _promiseUtils = require("../utils/promiseUtils");

var _workers = require("../env/node/workers");

const {
  BridgeV2,
  Fallback
} = _trezorLink.default; // custom log

const _log = (0, _debug.init)('DeviceList'); // TODO: plugins are not typed in 'trezor-link'


class DeviceList extends _events.default {
  constructor() {
    super();
    (0, _defineProperty2.default)(this, "devices", {});
    (0, _defineProperty2.default)(this, "creatingDevicesDescriptors", {});
    (0, _defineProperty2.default)(this, "hasCustomMessages", false);
    (0, _defineProperty2.default)(this, "transportStartPending", 0);
    const {
      debug,
      env,
      webusb
    } = _DataManager.default.settings;
    _log.enabled = debug;
    const transports = [];

    if (env === 'react-native' && typeof _workers.ReactNativeUsbPlugin !== 'undefined') {
      transports.push((0, _workers.ReactNativeUsbPlugin)());
    } else {
      // $FlowIssue: `version` is missing in `JSON`
      const bridgeVersion = (0, _TransportInfo.getBridgeInfo)().version.join('.');

      if (env === 'node' || env === 'electron') {
        BridgeV2.setFetch(fetch, true);
      }

      transports.push(new BridgeV2(null, null, bridgeVersion));
    }

    if (webusb && typeof _workers.WebUsbPlugin !== 'undefined') {
      transports.push((0, _workers.WebUsbPlugin)());
    }

    this.transport = new Fallback(transports);
    this.defaultMessages = _DataManager.default.getMessages();
    this.currentMessages = this.defaultMessages;
  }

  async init() {
    const {
      transport
    } = this;

    try {
      _log.debug('Initializing transports');

      await transport.init(_log.enabled);

      _log.debug('Configuring transports');

      await transport.configure(this.defaultMessages);

      _log.debug('Configuring transports done');

      const {
        activeName
      } = transport;

      if (activeName === 'LowlevelTransportWithSharedConnections') {
        // $FlowIssue "activeTransport" is not typed in trezor-link
        this.transportPlugin = transport.activeTransport.plugin;
      }

      await this._initStream(); // listen for self emitted events and resolve pending transport event if needed

      this.on(DEVICE.CONNECT, this.resolveTransportEvent.bind(this));
      this.on(DEVICE.CONNECT_UNACQUIRED, this.resolveTransportEvent.bind(this));
    } catch (error) {
      this.emit(TRANSPORT.ERROR, error);
    }
  }

  async reconfigure(json, custom) {
    if (this.currentMessages === json) return;

    try {
      await this.transport.configure(json);
      this.currentMessages = json;
      this.hasCustomMessages = typeof custom === 'boolean' ? custom : false;
    } catch (error) {
      throw ERROR.WRONG_TRANSPORT_CONFIG;
    }
  }

  async restoreMessages() {
    if (!this.hasCustomMessages) return;

    try {
      await this.transport.configure(this.defaultMessages);
      this.hasCustomMessages = false;
    } catch (error) {
      throw ERROR.WRONG_TRANSPORT_CONFIG;
    }
  }

  resolveTransportEvent() {
    this.transportStartPending--;

    if (this.transportStartPending === 0) {
      this.stream.emit(TRANSPORT.START);
    }
  }

  async waitForTransportFirstEvent() {
    await new Promise(resolve => {
      const handler = () => {
        this.removeListener(TRANSPORT.START, handler);
        this.removeListener(TRANSPORT.ERROR, handler);
        resolve();
      };

      this.on(TRANSPORT.START, handler);
      this.on(TRANSPORT.ERROR, handler);
    });
  }
  /**
   * Transport events handler
   * @param {Transport} transport
   * @memberof DeviceList
   */


  async _initStream() {
    const stream = new _DescriptorStream.default(this.transport);
    stream.on(TRANSPORT.START_PENDING, pending => {
      this.transportStartPending = pending;
    });
    stream.on(TRANSPORT.START, () => {
      this.emit(TRANSPORT.START, this.getTransportInfo());
    });
    stream.on(TRANSPORT.UPDATE, diff => {
      new DiffHandler(this, diff).handle();
    });
    stream.on(TRANSPORT.ERROR, error => {
      this.emit(TRANSPORT.ERROR, error);
      stream.stop();
    });
    stream.listen();
    this.stream = stream;

    if (this.transportPlugin && this.transportPlugin.name === 'WebUsbPlugin') {
      const {
        unreadableHidDevice,
        unreadableHidDeviceChange
      } = this.transportPlugin;
      unreadableHidDeviceChange.on('change', async () => {
        if (unreadableHidDevice) {
          const device = await this._createUnacquiredDevice({
            path: DEVICE.UNREADABLE,
            session: null,
            debugSession: null,
            debug: false
          });
          this.devices[DEVICE.UNREADABLE] = device;
          this.emit(DEVICE.CONNECT_UNACQUIRED, device.toMessageObject());
        } else {
          const device = this.devices[DEVICE.UNREADABLE];
          delete this.devices[DEVICE.UNREADABLE];
          this.emit(DEVICE.DISCONNECT, device.toMessageObject());
        }
      });
    }

    this.emit(TRANSPORT.STREAM, stream);
  }

  async _createAndSaveDevice(descriptor) {
    _log.debug('Creating Device', descriptor);

    await new CreateDeviceHandler(descriptor, this).handle();
  }

  async _createUnacquiredDevice(descriptor) {
    const currentDescriptor = this.stream.current && this.stream.current.find(d => d.path === descriptor.path) || descriptor;

    _log.debug('Creating Unacquired Device', currentDescriptor);

    const device = await _Device.default.createUnacquired(this.transport, currentDescriptor);
    device.once(DEVICE.ACQUIRED, () => {
      this.emit(DEVICE.CONNECT, device.toMessageObject());
    });
    return device;
  }

  getDevice(path) {
    return this.devices[path];
  }

  getFirstDevicePath() {
    return this.asArray()[0].path;
  }

  asArray() {
    return this.allDevices().map(device => device.toMessageObject());
  }

  allDevices() {
    return Object.keys(this.devices).map(key => this.devices[key]);
  }

  length() {
    return this.asArray().length;
  }

  transportType() {
    const {
      transport,
      transportPlugin
    } = this;
    const {
      activeName
    } = transport;

    if (activeName === 'BridgeTransport') {
      return 'bridge';
    }

    if (transportPlugin) {
      return transportPlugin.name;
    }

    return transport.name;
  }

  getTransportInfo() {
    return {
      type: this.transportType(),
      version: this.transport.version,
      outdated: this.transport.isOutdated
    };
  }

  onBeforeUnload() {
    if (this.stream) {
      this.stream.stop();
    }

    this.allDevices().forEach(device => device.onBeforeUnload());
  }

  disconnectDevices() {
    this.allDevices().forEach(device => {
      // device.disconnect();
      this.emit(DEVICE.DISCONNECT, device.toMessageObject());
    });
  }

  enumerate() {
    this.stream.enumerate();
    if (!this.stream.current) return; // update current values

    this.stream.current.forEach(descriptor => {
      const path = descriptor.path.toString();
      const device = this.devices[path];

      if (device) {
        device.updateDescriptor(descriptor);
      }
    });
  }

  stop() {
    this.onBeforeUnload();
    this.transport.stop();
  }

}
/**
 * DeviceList initialization
 * returns instance of DeviceList
 * @returns {Promise<DeviceList>}
 */


exports.default = DeviceList;

const getDeviceList = async () => {
  const list = new DeviceList();
  await list.init();
  return list;
}; // Helper class for creating new device


exports.getDeviceList = getDeviceList;

class CreateDeviceHandler {
  constructor(descriptor, list) {
    this.descriptor = descriptor;
    this.list = list;
    this.path = descriptor.path.toString();
  } // main logic


  async handle() {
    // creatingDevicesDescriptors is needed, so that if *during* creating of Device,
    // other application acquires the device and changes the descriptor,
    // the new unacquired device has correct descriptor
    this.list.creatingDevicesDescriptors[this.path] = this.descriptor;

    try {
      // "regular" device creation
      await this._takeAndCreateDevice();
    } catch (error) {
      _log.debug('Cannot create device', error);

      if (error.message.toLowerCase() === ERROR.DEVICE_NOT_FOUND.message.toLowerCase()) {// do nothing
        // it's a race condition between "device_changed" and "device_disconnected"
      } else if (error.message === ERROR.WRONG_PREVIOUS_SESSION_ERROR_MESSAGE || error.toString() === ERROR.WEBUSB_ERROR_MESSAGE) {
        this.list.enumerate();
        await this._handleUsedElsewhere();
      } else if (error.code === ERROR.INITIALIZATION_FAILED.code) {
        // firmware bug - device is in "show address" state which cannot be cancelled
        await this._handleUsedElsewhere();
      } else if (error.message === ERROR.DEVICE_USED_ELSEWHERE.message) {
        // most common error - someone else took the device at the same time
        await this._handleUsedElsewhere();
      } else {
        await (0, _promiseUtils.resolveAfter)(501, null);
        await this.handle();
      }
    }

    delete this.list.creatingDevicesDescriptors[this.path];
  }

  async _takeAndCreateDevice() {
    const device = await _Device.default.fromDescriptor(this.list.transport, this.descriptor);
    this.list.devices[this.path] = device;
    await device.run();
    this.list.emit(DEVICE.CONNECT, device.toMessageObject());
  }

  async _handleUsedElsewhere() {
    const device = await this.list._createUnacquiredDevice(this.list.creatingDevicesDescriptors[this.path]);
    this.list.devices[this.path] = device;
    this.list.emit(DEVICE.CONNECT_UNACQUIRED, device.toMessageObject());
  }

} // Helper class for actual logic of handling differences


class DiffHandler {
  constructor(list, diff) {
    this.list = list;
    this.diff = diff;
  }

  handle() {
    _log.debug('Update DescriptorStream', this.diff); // note - this intentionally does not wait for connected devices
    // createDevice inside waits for the updateDescriptor event


    this._createConnectedDevices();

    this._createReleasedDevices();

    this._signalAcquiredDevices();

    this._updateDescriptors();

    this._emitEvents();

    this._disconnectDevices();
  }

  _updateDescriptors() {
    this.diff.descriptors.forEach(descriptor => {
      const path = descriptor.path.toString();
      const device = this.list.devices[path];

      if (device) {
        device.updateDescriptor(descriptor);
      }
    });
  }

  _emitEvents() {
    const events = [{
      d: this.diff.changedSessions,
      e: DEVICE.CHANGED
    }, {
      d: this.diff.acquired,
      e: DEVICE.ACQUIRED
    }, {
      d: this.diff.released,
      e: DEVICE.RELEASED
    }];
    events.forEach(({
      d,
      e
    }) => {
      d.forEach(descriptor => {
        const path = descriptor.path.toString();
        const device = this.list.devices[path];

        _log.debug('Event', e, device);

        if (device) {
          this.list.emit(e, device.toMessageObject());
        }
      });
    });
  } // tries to read info about connected devices


  async _createConnectedDevices() {
    for (const descriptor of this.diff.connected) {
      const path = descriptor.path.toString();

      const priority = _DataManager.default.getSettings('priority');

      _log.debug('Connected', priority, descriptor.session, this.list.devices);

      if (priority) {
        await (0, _promiseUtils.resolveAfter)(501 + 100 * priority, null);
      }

      if (descriptor.session == null) {
        await this.list._createAndSaveDevice(descriptor);
      } else {
        const device = await this.list._createUnacquiredDevice(descriptor);
        this.list.devices[path] = device;
        this.list.emit(DEVICE.CONNECT_UNACQUIRED, device.toMessageObject());
      }
    }
  }

  _signalAcquiredDevices() {
    for (const descriptor of this.diff.acquired) {
      const path = descriptor.path.toString();

      if (this.list.creatingDevicesDescriptors[path]) {
        this.list.creatingDevicesDescriptors[path] = descriptor;
      }
    }
  } // tries acquire and read info about recently released devices


  async _createReleasedDevices() {
    for (const descriptor of this.diff.released) {
      const path = descriptor.path.toString();
      const device = this.list.devices[path];

      if (device) {
        if (device.isUnacquired() && !device.isInconsistent()) {
          // wait for publish changes
          await (0, _promiseUtils.resolveAfter)(501, null);

          _log.debug('Create device from unacquired', device);

          await this.list._createAndSaveDevice(descriptor);
        }
      }
    }
  }

  _disconnectDevices() {
    for (const descriptor of this.diff.disconnected) {
      const path = descriptor.path.toString();
      const device = this.list.devices[path];

      if (device != null) {
        device.disconnect();
        delete this.list.devices[path];
        this.list.emit(DEVICE.DISCONNECT, device.toMessageObject());
      }
    }
  }

}