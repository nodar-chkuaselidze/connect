"use strict";

var _interopRequireWildcard = require("@babel/runtime/helpers/interopRequireWildcard");

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

exports.__esModule = true;
exports.default = void 0;

var _defineProperty2 = _interopRequireDefault(require("@babel/runtime/helpers/defineProperty"));

var _events = _interopRequireDefault(require("events"));

var _semverCompare = _interopRequireDefault(require("semver-compare"));

var _DeviceCommands = _interopRequireDefault(require("./DeviceCommands"));

var UI = _interopRequireWildcard(require("../constants/ui"));

var DEVICE = _interopRequireWildcard(require("../constants/device"));

var ERROR = _interopRequireWildcard(require("../constants/errors"));

var _deferred = require("../utils/deferred");

var _DataManager = _interopRequireDefault(require("../data/DataManager"));

var _FirmwareInfo = require("../data/FirmwareInfo");

var _debug = _interopRequireWildcard(require("../utils/debug"));

function ownKeys(object, enumerableOnly) { var keys = Object.keys(object); if (Object.getOwnPropertySymbols) { var symbols = Object.getOwnPropertySymbols(object); if (enumerableOnly) symbols = symbols.filter(function (sym) { return Object.getOwnPropertyDescriptor(object, sym).enumerable; }); keys.push.apply(keys, symbols); } return keys; }

function _objectSpread(target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i] != null ? arguments[i] : {}; if (i % 2) { ownKeys(Object(source), true).forEach(function (key) { (0, _defineProperty2.default)(target, key, source[key]); }); } else if (Object.getOwnPropertyDescriptors) { Object.defineProperties(target, Object.getOwnPropertyDescriptors(source)); } else { ownKeys(Object(source)).forEach(function (key) { Object.defineProperty(target, key, Object.getOwnPropertyDescriptor(source, key)); }); } } return target; }

// custom log
const _log = (0, _debug.init)('Device');

const parseRunOptions = options => {
  if (!options) options = {};
  return options;
};

const parseFeatures = features => {
  if (!features.features || features.features.length === 0) {
    features.features = ['Feature_Bitcoin', 'Feature_Bitcoin_like', 'Feature_Binance', 'Feature_Cardano', 'Feature_Crypto', 'Feature_EOS', 'Feature_Ethereum', 'Feature_Lisk', 'Feature_Monero', 'Feature_NEM', 'Feature_Ripple', 'Feature_Stellar', 'Feature_Tezos', 'Feature_U2F'];
  }

  return features;
};
/**
 *
 *
 * @export
 * @class Device
 * @extends {EventEmitter}
 */


class Device extends _events.default {
  // cachedPassphrase: ?string;
  constructor(transport, descriptor) {
    super();
    (0, _defineProperty2.default)(this, "featuresNeedsReload", false);
    (0, _defineProperty2.default)(this, "deferredActions", {});
    (0, _defineProperty2.default)(this, "loaded", false);
    (0, _defineProperty2.default)(this, "inconsistent", false);
    (0, _defineProperty2.default)(this, "featuresTimestamp", 0);
    (0, _defineProperty2.default)(this, "cachedPassphrase", []);
    (0, _defineProperty2.default)(this, "keepSession", false);
    (0, _defineProperty2.default)(this, "instance", 0);
    _log.enabled = _DataManager.default.getSettings('debug'); // === immutable properties

    this.transport = transport;
    this.originalDescriptor = descriptor;
    this.hasDebugLink = descriptor.debug; // this will be released after first run

    this.firstRunPromise = (0, _deferred.create)();
  }

  static async fromDescriptor(transport, originalDescriptor) {
    const descriptor = _objectSpread({}, originalDescriptor, {
      session: null
    });

    try {
      const device = new Device(transport, descriptor);
      return device;
    } catch (error) {
      _log.error('Device.fromDescriptor', error);

      throw error;
    }
  }

  static createUnacquired(transport, descriptor) {
    return new Device(transport, descriptor);
  }

  async acquire() {
    // will be resolved after trezor-link acquire event
    this.deferredActions[DEVICE.ACQUIRE] = (0, _deferred.create)();
    this.deferredActions[DEVICE.ACQUIRED] = (0, _deferred.create)();

    try {
      const sessionID = await this.transport.acquire({
        path: this.originalDescriptor.path,
        previous: this.originalDescriptor.session
      }, false);

      _log.warn('Expected session id:', sessionID);

      this.activitySessionID = sessionID;
      this.deferredActions[DEVICE.ACQUIRED].resolve();
      delete this.deferredActions[DEVICE.ACQUIRED];

      if (this.commands) {
        this.commands.dispose();
      }

      this.commands = new _DeviceCommands.default(this, this.transport, sessionID); // future defer for trezor-link release event

      this.deferredActions[DEVICE.RELEASE] = (0, _deferred.create)();
    } catch (error) {
      this.deferredActions[DEVICE.ACQUIRED].resolve();
      delete this.deferredActions[DEVICE.ACQUIRED];

      if (this.runPromise) {
        this.runPromise.reject(error);
      } else {
        throw error;
      }

      this.runPromise = null;
    }
  }

  async release() {
    if (this.isUsedHere() && !this.keepSession && this.activitySessionID) {
      if (this.commands) {
        this.commands.dispose();

        if (this.commands.callPromise) {
          try {
            await this.commands.callPromise;
          } catch (error) {
            this.commands.callPromise = undefined;
          }
        }
      }

      try {
        await this.transport.release(this.activitySessionID, false, false);
        if (this.deferredActions[DEVICE.RELEASE]) await this.deferredActions[DEVICE.RELEASE].promise;
      } catch (err) {// empty
      }
    }
  }

  async cleanup() {
    this.removeAllListeners(); // make sure that DEVICE_CALL_IN_PROGRESS will not be thrown

    this.runPromise = null;
    await this.release();
  }

  async run(fn, options) {
    if (this.runPromise) {
      _log.debug('Previous call is still running');

      throw ERROR.DEVICE_CALL_IN_PROGRESS;
    }

    options = parseRunOptions(options);
    this.runPromise = (0, _deferred.create)(this._runInner.bind(this, fn, options));
    return this.runPromise.promise;
  }

  async override(error) {
    if (this.deferredActions[DEVICE.ACQUIRE]) {
      await this.deferredActions[DEVICE.ACQUIRE].promise;
    }

    if (this.runPromise) {
      this.runPromise.reject(error);
      this.runPromise = null;
    }

    if (!this.keepSession && this.deferredActions[DEVICE.RELEASE]) {
      await this.deferredActions[DEVICE.RELEASE].promise;
    }
  }

  interruptionFromUser(error) {
    _log.debug('+++++interruptionFromUser');

    if (this.commands) {
      this.commands.dispose();
    }

    if (this.runPromise) {
      // reject inner defer
      this.runPromise.reject(error);
      this.runPromise = null;
    }
  }

  interruptionFromOutside() {
    _log.debug('+++++interruptionFromOutside');

    if (this.commands) {
      this.commands.dispose();
    }

    if (this.runPromise) {
      this.runPromise.reject(ERROR.DEVICE_USED_ELSEWHERE);
      this.runPromise = null;
    }
  }

  async _runInner(fn, options) {
    if (!this.isUsedHere() || this.commands.disposed) {
      // acquire session
      await this.acquire(); // update features

      try {
        await this.initialize(!!options.useEmptyPassphrase);
      } catch (error) {
        this.inconsistent = true;
        await this.deferredActions[DEVICE.ACQUIRE].promise;
        this.runPromise = null;
        ERROR.INITIALIZATION_FAILED.message = `Initialize failed: ${error.message}`;
        return Promise.reject(ERROR.INITIALIZATION_FAILED);
      }
    } // if keepSession is set do not release device
    // until method with keepSession: false will be called


    if (options.keepSession) {
      this.keepSession = true;
    } // wait for event from trezor-link


    await this.deferredActions[DEVICE.ACQUIRE].promise; // call inner function

    if (fn) {
      await fn();
    } // reload features


    if (this.features && !options.skipFinalReload) {
      await this.getFeatures();
    } // await resolveAfter(2000, null);


    if (!this.keepSession && typeof options.keepSession !== 'boolean' || options.keepSession === false) {
      this.keepSession = false;
      await this.release();
    }

    if (this.runPromise) {
      this.runPromise.resolve();
    }

    this.runPromise = null;

    if (!this.loaded) {
      this.loaded = true;
      this.firstRunPromise.resolve(true);
    }
  }

  getCommands() {
    return this.commands;
  }

  setInstance(instance) {
    if (this.instance !== instance) {
      // if requested instance is different than current
      // and device wasn't released in previous call (example: interrupted discovery which set "keepSession" to true but never released)
      // clear "keepSession" and reset "activitySessionID" to ensure that "initialize" will be called
      if (this.keepSession) {
        this.activitySessionID = null;
        this.keepSession = false;
      } // T1: forget cached passphrase


      if (this.isT1()) {
        this.clearPassphrase();
      }
    }

    this.instance = instance;
  }

  getInstance() {
    return this.instance;
  } // set expected state from method parameter


  setExpectedState(state) {
    if (!state) {
      this.setState(null); // T2 reset state

      this.setPassphrase(null); // T1 reset password
    }

    this.expectedState = state; // T2: set "temporaryState" the same as "expectedState", it may change if device will request for passphrase [after PassphraseStateRequest message]
    // this solves the issue with different instances but the same passphrases,
    // where device state passed in "initialize" is correct from device point of view
    // but "expectedState" and "temporaryState" are different strings

    if (!this.isT1()) {
      this.temporaryState = state;
    }
  }

  getExpectedState() {
    return this.expectedState;
  }

  setPassphrase(pass) {
    if (this.isT1()) {
      this.cachedPassphrase[this.instance] = pass;
    }
  }

  getPassphrase() {
    return this.cachedPassphrase[this.instance];
  }

  clearPassphrase() {
    this.cachedPassphrase[this.instance] = null;
    this.keepSession = false;
  }

  async initialize(useEmptyPassphrase) {
    const {
      message
    } = await this.commands.initialize(useEmptyPassphrase);
    this.features = parseFeatures(message);
    this.featuresNeedsReload = false;
    this.featuresTimestamp = new Date().getTime();
    const currentFW = [this.features.major_version, this.features.minor_version, this.features.patch_version];
    this.firmwareStatus = (0, _FirmwareInfo.checkFirmware)(currentFW, this.features);
    this.firmwareRelease = (0, _FirmwareInfo.getLatestRelease)(currentFW);
  }

  async getFeatures() {
    const {
      message
    } = await this.commands.typedCall('GetFeatures', 'Features', {});
    this.features = parseFeatures(message);
    this.firmwareStatus = (0, _FirmwareInfo.checkFirmware)([this.features.major_version, this.features.minor_version, this.features.patch_version], this.features);
  }

  getState() {
    return this.state ? this.state : null;
  }

  setState(state) {
    this.state = state;
  }

  setTemporaryState(state) {
    this.temporaryState = state;
  }

  getTemporaryState() {
    return this.temporaryState;
  }

  isUnacquired() {
    return this.features === undefined;
  }

  async updateDescriptor(upcomingDescriptor) {
    const originalSession = this.originalDescriptor.session;
    const upcomingSession = upcomingDescriptor.session;

    _log.debug('updateDescriptor', 'currentSession', originalSession, 'upcoming', upcomingSession, 'lastUsedID', this.activitySessionID);

    if (!originalSession && !upcomingSession && !this.activitySessionID) {
      // no change
      return;
    }

    if (this.deferredActions[DEVICE.ACQUIRED]) {
      await this.deferredActions[DEVICE.ACQUIRED].promise;
    }

    if (!upcomingSession) {
      // corner-case: if device was unacquired but some call to this device was made
      // this will automatically change unacquired device to acquired (without deviceList)
      // emit ACQUIRED event to deviceList which will propagate DEVICE.CONNECT event
      if (this.listeners(DEVICE.ACQUIRED).length > 0) {
        this.emit(DEVICE.ACQUIRED);
      }
    }

    const methodStillRunning = this.commands && !this.commands.disposed;

    if (!upcomingSession && !methodStillRunning) {
      // released
      if (originalSession === this.activitySessionID) {
        // by myself
        _log.debug('RELEASED BY MYSELF');

        if (this.deferredActions[DEVICE.RELEASE]) {
          this.deferredActions[DEVICE.RELEASE].resolve();
          delete this.deferredActions[DEVICE.RELEASE];
        }

        this.activitySessionID = null;
      } else {
        // by other application
        _log.debug('RELEASED BY OTHER APP');

        this.featuresNeedsReload = true;
      }

      this.keepSession = false;
    } else {
      // acquired
      // TODO: Case where listen event will dispatch before this.transport.acquire (this.acquire) return ID
      if (upcomingSession === this.activitySessionID) {
        // by myself
        _log.debug('ACQUIRED BY MYSELF');

        if (this.deferredActions[DEVICE.ACQUIRE]) {
          this.deferredActions[DEVICE.ACQUIRE].resolve(); // delete this.deferred[ DEVICE.ACQUIRE ];
        }
      } else {
        // by other application
        _log.debug('ACQUIRED BY OTHER');

        this.interruptionFromOutside();
      }
    }

    this.originalDescriptor = upcomingDescriptor;
  }

  disconnect() {
    // TODO: cleanup everything
    _log.debug('DISCONNECT CLEANUP!'); // don't try to release


    if (this.deferredActions[DEVICE.RELEASE]) {
      this.deferredActions[DEVICE.RELEASE].resolve();
      delete this.deferredActions[DEVICE.RELEASE];
    }

    this.interruptionFromUser(new Error('Device disconnected'));
    this.runPromise = null;
  }

  isBootloader() {
    return this.features.bootloader_mode;
  }

  isInitialized() {
    return this.features.initialized;
  }

  isSeedless() {
    return this.features.no_backup;
  }

  isInconsistent() {
    return this.inconsistent;
  }

  getVersion() {
    return [this.features.major_version, this.features.minor_version, this.features.patch_version].join('.');
  }

  atLeast(versions) {
    const modelVersion = versions[this.features.major_version - 1];
    return (0, _semverCompare.default)(this.getVersion(), modelVersion) >= 0;
  }

  isUsed() {
    return typeof this.originalDescriptor.session === 'string';
  }

  isUsedHere() {
    return this.isUsed() && this.originalDescriptor.session === this.activitySessionID;
  }

  isUsedElsewhere() {
    return this.isUsed() && !this.isUsedHere();
  }

  isRunning() {
    return !!this.runPromise;
  }

  isLoaded() {
    return this.loaded;
  }

  waitForFirstRun() {
    return this.firstRunPromise.promise;
  }

  getDevicePath() {
    return this.originalDescriptor.path;
  }

  needAuthentication() {
    if (this.isUnacquired() || this.isUsedElsewhere() || this.featuresNeedsReload) return true;
    if (this.features.bootloader_mode || !this.features.initialized) return true;
    const pin = this.features.pin_protection ? this.features.pin_cached : true;
    const pass = this.features.passphrase_protection ? this.features.passphrase_cached : true;
    return pin && pass;
  }

  isT1() {
    return this.features ? this.features.major_version === 1 : false;
  }

  hasUnexpectedMode(allow, require) {
    // both allow and require cases might generate single unexpected mode
    if (this.features) {
      // allow cases
      if (this.isBootloader() && !allow.includes(UI.BOOTLOADER)) {
        return UI.BOOTLOADER;
      }

      if (!this.isInitialized() && !allow.includes(UI.INITIALIZE)) {
        return UI.INITIALIZE;
      }

      if (this.isSeedless() && !allow.includes(UI.SEEDLESS)) {
        return UI.SEEDLESS;
      } // require cases


      if (!this.isBootloader() && require.includes(UI.BOOTLOADER)) {
        return UI.NOT_IN_BOOTLOADER;
      }
    }

    return null;
  }

  validateExpectedState(state) {
    if (!this.isT1()) {
      const currentState = this.getExpectedState() || this.getState();

      if (!currentState) {
        this.setState(state);
        return true;
      } else if (currentState !== state) {
        return false;
      }
    } else if (this.getExpectedState() && this.getExpectedState() !== state) {
      return false;
    }

    return true;
  }

  onBeforeUnload() {
    if (this.isUsedHere() && this.activitySessionID) {
      try {
        this.transport.release(this.activitySessionID, true, false);
      } catch (err) {// empty
      }
    }
  }

  getMode() {
    if (this.features.bootloader_mode) return 'bootloader';
    if (!this.features.initialized) return 'initialize';
    if (this.features.no_backup) return 'seedless';
    return 'normal';
  } // simplified object to pass via postMessage


  toMessageObject() {
    if (this.originalDescriptor.path === DEVICE.UNREADABLE) {
      return {
        type: 'unreadable',
        path: this.originalDescriptor.path,
        label: 'Unreadable device'
      };
    } else if (this.isUnacquired()) {
      return {
        type: 'unacquired',
        path: this.originalDescriptor.path,
        label: 'Unacquired device'
      };
    } else {
      const defaultLabel = 'My Trezor';
      const label = this.features.label === '' || this.features.label === null ? defaultLabel : this.features.label;
      return {
        type: 'acquired',
        path: this.originalDescriptor.path,
        label: label,
        state: this.state,
        status: this.isUsedElsewhere() ? 'occupied' : this.featuresNeedsReload ? 'used' : 'available',
        mode: this.getMode(),
        firmware: this.firmwareStatus,
        firmwareRelease: this.firmwareRelease,
        features: this.features
      };
    }
  }

}

exports.default = Device;