"use strict";

var _interopRequireWildcard = require("@babel/runtime/helpers/interopRequireWildcard");

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

exports.__esModule = true;
exports.default = void 0;

var _defineProperty2 = _interopRequireDefault(require("@babel/runtime/helpers/defineProperty"));

var _events = _interopRequireDefault(require("events"));

var TRANSPORT = _interopRequireWildcard(require("../constants/transport"));

var DEVICE = _interopRequireWildcard(require("../constants/device"));

var _debug = _interopRequireWildcard(require("../utils/debug"));

var _DataManager = _interopRequireDefault(require("../data/DataManager"));

var _promiseUtils = require("../utils/promiseUtils");

// This file reads descriptor with very little logic, and sends it to layers above
// custom log
const logger = (0, _debug.init)('DescriptorStream');

class DescriptorStream extends _events.default {
  // actual low-level transport, from trezor-link
  // if the transport works
  // if transport fetch API rejects (when computer goes to sleep)
  // null if nothing
  constructor(transport) {
    super();
    (0, _defineProperty2.default)(this, "listening", false);
    (0, _defineProperty2.default)(this, "listenTimestamp", 0);
    (0, _defineProperty2.default)(this, "current", null);
    (0, _defineProperty2.default)(this, "upcoming", []);
    this.transport = transport;
    logger.enabled = _DataManager.default.getSettings('debug');
  } // emits changes


  async listen() {
    // if we are not enumerating for the first time, we can let
    // the transport to block until something happens
    const waitForEvent = this.current !== null;
    const current = this.current || [];
    this.listening = true;
    let descriptors;

    try {
      logger.debug('Start listening', current);
      this.listenTimestamp = new Date().getTime();
      descriptors = waitForEvent ? await this.transport.listen(current) : await this.transport.enumerate();

      if (this.listening && !waitForEvent) {
        // enumerate returns some value
        // TRANSPORT.START will be emitted from DeviceList after device will be available (either acquired or unacquired)
        if (descriptors.length > 0 && _DataManager.default.getSettings('pendingTransportEvent')) {
          this.emit(TRANSPORT.START_PENDING, descriptors.length);
        } else {
          this.emit(TRANSPORT.START);
        }
      }

      if (!this.listening) return; // do not continue if stop() was called

      this.upcoming = descriptors;
      logger.debug('Listen result', descriptors);

      this._reportChanges();

      if (this.listening) this.listen(); // handlers might have called stop()
    } catch (error) {
      const time = new Date().getTime() - this.listenTimestamp;
      logger.debug('Listen error', 'timestamp', time, typeof error);

      if (time > 1100) {
        await (0, _promiseUtils.resolveAfter)(1000, null);
        if (this.listening) this.listen();
      } else {
        logger.log('Transport error');
        this.emit(TRANSPORT.ERROR, error);
      }
    }
  }

  async enumerate() {
    if (!this.listening) return;

    try {
      this.upcoming = await this.transport.enumerate();

      this._reportChanges();
    } catch (error) {// empty
    }
  }

  stop() {
    this.listening = false;
  }

  _diff(currentN, descriptors) {
    const current = currentN || [];
    const connected = descriptors.filter(d => {
      return current.find(x => {
        return x.path === d.path;
      }) === undefined;
    });
    const disconnected = current.filter(d => {
      return descriptors.find(x => {
        return x.path === d.path;
      }) === undefined;
    });
    const changedSessions = descriptors.filter(d => {
      const currentDescriptor = current.find(x => {
        return x.path === d.path;
      });

      if (currentDescriptor) {
        // return currentDescriptor.debug ? (currentDescriptor.debugSession !== d.debugSession) : (currentDescriptor.session !== d.session);
        return currentDescriptor.session !== d.session;
      } else {
        return false;
      }
    });
    const acquired = changedSessions.filter(d => {
      return typeof d.session === 'string';
    });
    const released = changedSessions.filter(d => {
      // const session = descriptor.debug ? descriptor.debugSession : descriptor.session;
      return typeof d.session !== 'string';
    });
    const changedDebugSessions = descriptors.filter(d => {
      const currentDescriptor = current.find(x => {
        return x.path === d.path;
      });

      if (currentDescriptor) {
        return currentDescriptor.debugSession !== d.debugSession;
      } else {
        return false;
      }
    });
    const debugAcquired = changedSessions.filter(d => {
      return typeof d.debugSession === 'string';
    });
    const debugReleased = changedSessions.filter(d => {
      return typeof d.debugSession !== 'string';
    });
    const didUpdate = connected.length + disconnected.length + changedSessions.length + changedDebugSessions.length > 0;
    return {
      connected,
      disconnected,
      changedSessions,
      acquired,
      released,
      changedDebugSessions,
      debugAcquired,
      debugReleased,
      didUpdate,
      descriptors
    };
  }

  _reportChanges() {
    const diff = this._diff(this.current, this.upcoming);

    this.current = this.upcoming;

    if (diff.didUpdate && this.listening) {
      diff.connected.forEach(d => {
        this.emit(DEVICE.CONNECT, d);
      });
      diff.disconnected.forEach(d => {
        this.emit(DEVICE.DISCONNECT, d);
      });
      diff.acquired.forEach(d => {
        this.emit(DEVICE.ACQUIRED, d);
      });
      diff.released.forEach(d => {
        this.emit(DEVICE.RELEASED, d);
      });
      diff.changedSessions.forEach(d => {
        this.emit(DEVICE.CHANGED, d);
      });
      this.emit(TRANSPORT.UPDATE, diff);
    }
  }

}

exports.default = DescriptorStream;