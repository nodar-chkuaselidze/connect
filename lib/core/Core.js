"use strict";

var _interopRequireWildcard = require("@babel/runtime/helpers/interopRequireWildcard");

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

exports.__esModule = true;
exports.stop = exports.initTransport = exports.init = exports.initData = exports.initCore = exports.Core = exports.onCall = exports.handleMessage = void 0;

var _events = _interopRequireDefault(require("events"));

var _DataManager = _interopRequireDefault(require("../data/DataManager"));

var _DeviceList = _interopRequireDefault(require("../device/DeviceList"));

var _Device = _interopRequireDefault(require("../device/Device"));

var _constants = require("../constants");

var TRANSPORT = _interopRequireWildcard(require("../constants/transport"));

var DEVICE = _interopRequireWildcard(require("../constants/device"));

var POPUP = _interopRequireWildcard(require("../constants/popup"));

var UI = _interopRequireWildcard(require("../constants/ui"));

var IFRAME = _interopRequireWildcard(require("../constants/iframe"));

var ERROR = _interopRequireWildcard(require("../constants/errors"));

var _builder = require("../message/builder");

var _AbstractMethod = _interopRequireDefault(require("./methods/AbstractMethod"));

var _methods = require("./methods");

var _deferred = require("../utils/deferred");

var _promiseUtils = require("../utils/promiseUtils");

var _debug = _interopRequireWildcard(require("../utils/debug"));

// Public variables
// eslint-disable-next-line no-use-before-define
let _core; // Class with event emitter


let _deviceList; // Instance of DeviceList


let _popupPromise; // Waiting for popup handshake


let _uiPromises = []; // Waiting for ui response

const _callMethods = [];

let _preferredDevice; // TODO: type
// custom log


const _log = (0, _debug.init)('Core');
/**
 * Emit message to listener (parent).
 * Clear method reference from _callMethods
 * @param {CoreMessage} message
 * @returns {void}
 * @memberof Core
 */


const postMessage = message => {
  if (message.event === _constants.RESPONSE_EVENT) {
    const index = _callMethods.findIndex(call => call && call.responseID === message.id);

    if (index >= 0) {
      _callMethods.splice(index, 1);
    }
  }

  _core.emit(_constants.CORE_EVENT, message);
};
/**
 * Creates an instance of _popupPromise.
 * If Core is used without popup this promise should be always resolved automatically
 * @param {boolean} requestWindow
 * @returns {Promise<void>}
 * @memberof Core
 */


const getPopupPromise = (requestWindow = true) => {
  // request ui window (used with modal)
  if (requestWindow) {
    postMessage((0, _builder.UiMessage)(UI.REQUEST_UI_WINDOW));
  }

  if (!_popupPromise) {
    _popupPromise = (0, _deferred.create)();
  }

  return _popupPromise;
};
/**
 * Creates an instance of uiPromise.
 * @param {string} promiseEvent
 * @param {Device} device
 * @returns {Promise<UiPromiseResponse>}
 * @memberof Core
 */


const createUiPromise = (promiseEvent, device) => {
  const uiPromise = (0, _deferred.create)(promiseEvent, device);

  _uiPromises.push(uiPromise);

  return uiPromise;
};
/**
 * Finds an instance of uiPromise.
 * @param {number} callId
 * @param {string} promiseEvent
 * @returns {Promise<UiPromiseResponse>}
 * @memberof Core
 */


const findUiPromise = (callId, promiseEvent) => {
  return _uiPromises.find(p => p.id === promiseEvent);
};

const removeUiPromise = promise => {
  _uiPromises = _uiPromises.filter(p => p !== promise);
};
/**
 * Handle incoming message.
 * @param {CoreMessage} message
 * @param {boolean} isTrustedOrigin
 * @returns {void}
 * @memberof Core
 */


const handleMessage = (message, isTrustedOrigin = false) => {
  _log.log('handle message in core', isTrustedOrigin, message);

  const safeMessages = [IFRAME.CALL, POPUP.CLOSED, // UI.CHANGE_SETTINGS,
  UI.CUSTOM_MESSAGE_RESPONSE, UI.LOGIN_CHALLENGE_RESPONSE, TRANSPORT.DISABLE_WEBUSB];

  if (!isTrustedOrigin && safeMessages.indexOf(message.type) === -1) {
    return;
  }

  switch (message.type) {
    case POPUP.HANDSHAKE:
      getPopupPromise(false).resolve();
      break;

    case POPUP.CLOSED:
      // eslint-disable-next-line no-use-before-define
      onPopupClosed(message.payload ? message.payload.error : null);
      break;
    // case UI.CHANGE_SETTINGS :
    //     enableLog(parseSettings(message.payload).debug);
    //     break;

    case TRANSPORT.DISABLE_WEBUSB:
      // eslint-disable-next-line no-use-before-define
      disableWebUSBTransport();
      break;
    // messages from UI (popup/modal...)

    case UI.RECEIVE_DEVICE:
    case UI.RECEIVE_CONFIRMATION:
    case UI.RECEIVE_PERMISSION:
    case UI.RECEIVE_PIN:
    case UI.RECEIVE_PASSPHRASE:
    case UI.INVALID_PASSPHRASE_ACTION:
    case UI.RECEIVE_ACCOUNT:
    case UI.CHANGE_ACCOUNT:
    case UI.RECEIVE_FEE:
    case UI.CUSTOM_MESSAGE_RESPONSE:
    case UI.RECEIVE_WORD:
    case UI.LOGIN_CHALLENGE_RESPONSE:
      {
        const uiPromise = findUiPromise(0, message.type);

        if (uiPromise) {
          uiPromise.resolve({
            event: message.type,
            payload: message.payload
          });
          removeUiPromise(uiPromise);
        }

        break;
      }
    // message from index

    case IFRAME.CALL:
      // eslint-disable-next-line no-use-before-define
      onCall(message).catch(error => {
        _log.debug('onCall error', error);
      });
      break;
  }
};
/**
 * Find device by device path. Returned device may be unacquired.
 * @param {AbstractMethod} method
 * @returns {Promise<Device>}
 * @memberof Core
 */


exports.handleMessage = handleMessage;

const initDevice = async method => {
  if (!_deviceList) {
    throw ERROR.NO_TRANSPORT;
  }

  const isWebUsb = _deviceList.transportType() === 'WebUsbPlugin';
  let device;

  if (method.devicePath) {
    device = _deviceList.getDevice(method.devicePath);
  } else {
    let devicesCount = _deviceList.length();

    let selectedDevicePath;

    if (devicesCount === 1 && !isWebUsb) {
      // there is only one device available. use it
      selectedDevicePath = _deviceList.getFirstDevicePath();
      device = _deviceList.getDevice(selectedDevicePath);
    } else {
      // no devices available
      // initialize uiPromise instance which will catch changes in _deviceList (see: handleDeviceSelectionChanges function)
      // but do not wait for resolve yet
      createUiPromise(UI.RECEIVE_DEVICE); // wait for popup handshake

      await getPopupPromise().promise; // check again for available devices
      // there is a possible race condition before popup open

      devicesCount = _deviceList.length();

      if (devicesCount === 1 && !isWebUsb) {
        // there is one device available. use it
        selectedDevicePath = _deviceList.getFirstDevicePath();
        device = _deviceList.getDevice(selectedDevicePath);
      } else {
        // request select device view
        postMessage((0, _builder.UiMessage)(UI.SELECT_DEVICE, {
          webusb: isWebUsb,
          devices: _deviceList.asArray()
        })); // wait for device selection

        const uiPromise = findUiPromise(method.responseID, UI.RECEIVE_DEVICE);

        if (uiPromise) {
          const uiResp = await uiPromise.promise;

          if (uiResp.payload.remember) {
            if (!uiResp.payload.device.state) {
              delete uiResp.payload.device.state;
            }

            _preferredDevice = uiResp.payload.device;
          }

          selectedDevicePath = uiResp.payload.device.path;
          device = _deviceList.getDevice(selectedDevicePath);
        }
      }
    }
  }

  if (!device) {
    throw ERROR.DEVICE_NOT_FOUND;
  }

  return device;
};
/**
 * Processing incoming message.
 * This method is async that's why it returns Promise but the real response is passed by postMessage(ResponseMessage)
 * @param {CoreMessage} message
 * @returns {Promise<void>}
 * @memberof Core
 */


const onCall = async message => {
  if (!message.id || !message.payload) {
    throw ERROR.INVALID_PARAMETERS;
  }

  const responseID = message.id;

  const trustedHost = _DataManager.default.getSettings('trustedHost');

  const isUsingPopup = _DataManager.default.getSettings('popup');

  if (_preferredDevice && !message.payload.device) {
    message.payload.device = _preferredDevice;
  } // find method and parse incoming params


  let method;
  let messageResponse;

  try {
    method = (0, _methods.find)(message); // bind callbacks

    method.postMessage = postMessage;
    method.getPopupPromise = getPopupPromise;
    method.createUiPromise = createUiPromise;
    method.findUiPromise = findUiPromise;
    method.removeUiPromise = removeUiPromise;
  } catch (error) {
    postMessage((0, _builder.UiMessage)(POPUP.CANCEL_POPUP_REQUEST));
    postMessage((0, _builder.ResponseMessage)(responseID, false, {
      error: ERROR.INVALID_PARAMETERS.message + ': ' + error.message
    }));
    return Promise.resolve();
  }

  _callMethods.push(method); // this method is not using the device, there is no need to acquire


  if (!method.useDevice) {
    try {
      if (method.useUi) {
        // wait for popup handshake
        await getPopupPromise().promise;
      } else {
        // cancel popup request
        postMessage((0, _builder.UiMessage)(POPUP.CANCEL_POPUP_REQUEST));
      }

      const response = await method.run();
      messageResponse = (0, _builder.ResponseMessage)(method.responseID, true, response);
    } catch (error) {
      messageResponse = (0, _builder.ResponseMessage)(method.responseID, false, {
        error: error.message
      });
    }

    postMessage(messageResponse);
    return Promise.resolve();
  }

  if (!_deviceList && !_DataManager.default.getSettings('transportReconnect')) {
    // transport is missing try to initialize it once again
    // eslint-disable-next-line no-use-before-define
    await initTransport(_DataManager.default.getSettings());
  }

  if (isUsingPopup && method.requiredPermissions.includes('management') && !_DataManager.default.isManagementAllowed()) {
    postMessage((0, _builder.UiMessage)(POPUP.CANCEL_POPUP_REQUEST));
    postMessage((0, _builder.ResponseMessage)(responseID, false, {
      error: ERROR.MANAGEMENT_NOT_ALLOWED.message
    }));
    return Promise.resolve();
  } // find device


  let device;

  try {
    device = await initDevice(method);
  } catch (error) {
    if (error === ERROR.NO_TRANSPORT) {
      // wait for popup handshake
      await getPopupPromise().promise; // show message about transport

      postMessage((0, _builder.UiMessage)(UI.TRANSPORT));
    } else {
      // cancel popup request
      postMessage((0, _builder.UiMessage)(POPUP.CANCEL_POPUP_REQUEST));
    } // TODO: this should not be returned here before user agrees on "read" perms...


    postMessage((0, _builder.ResponseMessage)(responseID, false, {
      error: error.message
    }));
    throw error;
  }

  method.setDevice(device); // method is a debug link message

  if (method.debugLink) {
    try {
      const response = await method.run();
      messageResponse = (0, _builder.ResponseMessage)(method.responseID, true, response);
      postMessage(messageResponse);
      return Promise.resolve();
    } catch (error) {
      postMessage((0, _builder.ResponseMessage)(method.responseID, false, {
        error: error.message
      }));
      throw error;
    }
  } // find pending calls to this device


  const previousCall = _callMethods.filter(call => call && call !== method && call.devicePath === method.devicePath);

  if (previousCall.length > 0 && method.overridePreviousCall) {
    // set flag for each pending method
    previousCall.forEach(call => {
      call.overridden = true;
    }); // interrupt potential communication with device. this should throw error in try/catch block below
    // this error will apply to the last item of pending methods

    await device.override(ERROR.CALL_OVERRIDE); // if current method was overridden while waiting for device.override result
    // return response with status false

    if (method.overridden) {
      postMessage((0, _builder.ResponseMessage)(method.responseID, false, {
        error: ERROR.CALL_OVERRIDE.message,
        code: ERROR.CALL_OVERRIDE.code
      }));
      throw ERROR.CALL_OVERRIDE;
    }
  } else if (device.isRunning()) {
    if (!device.isLoaded()) {
      // corner case
      // device didn't finish loading for the first time. @see DeviceList._createAndSaveDevice
      // wait for self-release and then carry on
      await device.waitForFirstRun();
    } else {
      // cancel popup request
      // postMessage(UiMessage(POPUP.CANCEL_POPUP_REQUEST));
      postMessage((0, _builder.ResponseMessage)(responseID, false, {
        error: ERROR.DEVICE_CALL_IN_PROGRESS.message
      }));
      throw ERROR.DEVICE_CALL_IN_PROGRESS;
    }
  } // set device instance. default is 0


  device.setInstance(method.deviceInstance);

  if (method.hasExpectedDeviceState) {
    device.setExpectedState(method.deviceState);
  } // device is available
  // set public variables, listeners and run method

  /* eslint-disable no-use-before-define */


  device.on(DEVICE.BUTTON, (device, code) => {
    onDeviceButtonHandler(device, code, method);
  });
  device.on(DEVICE.PIN, onDevicePinHandler);
  device.on(DEVICE.WORD, onDeviceWordHandler);
  device.on(DEVICE.PASSPHRASE, method.useEmptyPassphrase ? onEmptyPassphraseHandler : onDevicePassphraseHandler);
  device.on(DEVICE.PASSPHRASE_ON_DEVICE, () => {
    postMessage((0, _builder.UiMessage)(UI.REQUEST_PASSPHRASE_ON_DEVICE, {
      device: device.toMessageObject()
    }));
  });
  /* eslint-enable no-use-before-define */

  try {
    let PIN_TRIES = 1;
    const MAX_PIN_TRIES = 3; // This function will run inside Device.run() after device will be acquired and initialized

    const inner = async () => {
      const firmwareException = await method.checkFirmwareRange(isUsingPopup);

      if (firmwareException) {
        if (isUsingPopup) {
          await getPopupPromise().promise; // show unexpected state information

          postMessage((0, _builder.UiMessage)(firmwareException, device.toMessageObject())); // wait for device disconnect

          await createUiPromise(DEVICE.DISCONNECT, device).promise; // interrupt process and go to "final" block

          return Promise.reject('Cancelled');
        } else {
          // return error if not using popup
          return Promise.reject(firmwareException);
        }
      } // check if device is in unexpected mode [bootloader, not-initialized, required firmware]


      const unexpectedMode = device.hasUnexpectedMode(method.allowDeviceMode, method.requireDeviceMode);

      if (unexpectedMode) {
        device.keepSession = false;

        if (isUsingPopup) {
          // wait for popup handshake
          await getPopupPromise().promise; // show unexpected state information

          postMessage((0, _builder.UiMessage)(unexpectedMode, device.toMessageObject())); // wait for device disconnect

          await createUiPromise(DEVICE.DISCONNECT, device).promise; // interrupt process and go to "final" block

          return Promise.reject(unexpectedMode);
        } else {
          // throw error if not using popup
          return Promise.reject(unexpectedMode);
        }
      } // check and request permissions [read, write...]


      method.checkPermissions();

      if (!trustedHost && method.requiredPermissions.length > 0) {
        // show permissions in UI
        const permitted = await method.requestPermissions();

        if (!permitted) {
          // interrupt process and go to "final" block
          return Promise.reject(ERROR.PERMISSIONS_NOT_GRANTED.message);
        }
      }

      const deviceNeedsBackup = device.features.needs_backup;

      if (deviceNeedsBackup && typeof method.noBackupConfirmation === 'function') {
        const permitted = await method.noBackupConfirmation();

        if (!permitted) {
          // interrupt process and go to "final" block
          return Promise.reject({
            message: ERROR.PERMISSIONS_NOT_GRANTED.message,
            code: ERROR.PERMISSIONS_NOT_GRANTED.code
          });
        }
      }

      if (deviceNeedsBackup) {
        // wait for popup handshake
        await getPopupPromise().promise; // show notification

        postMessage((0, _builder.UiMessage)(UI.DEVICE_NEEDS_BACKUP, device.toMessageObject()));
      } // notify if firmware is outdated but not required


      if (device.firmwareStatus === 'outdated') {
        // wait for popup handshake
        await getPopupPromise().promise; // show notification

        postMessage((0, _builder.UiMessage)(UI.FIRMWARE_OUTDATED, device.toMessageObject()));
      } // ask for confirmation [export xpub, export info, sign message]


      if (!trustedHost && typeof method.confirmation === 'function') {
        // show confirmation in UI
        const confirmed = await method.confirmation();

        if (!confirmed) {
          // interrupt process and go to "final" block
          return Promise.reject('Cancelled');
        }
      }

      if (_deviceList) {
        // restore default messages
        const messages = _DataManager.default.findMessages(device.isT1() ? 0 : 1, device.getVersion());

        await _deviceList.reconfigure(messages);
      } // Make sure that device will display pin/passphrase


      try {
        const deviceState = method.useDeviceState ? await device.getCommands().getDeviceState() : 'null';
        const validState = !method.useDeviceState || method.useEmptyPassphrase || device.validateExpectedState(deviceState);

        if (!validState) {
          if (isUsingPopup) {
            // initialize user response promise
            const uiPromise = createUiPromise(UI.INVALID_PASSPHRASE_ACTION, device); // request action view

            postMessage((0, _builder.UiMessage)(UI.INVALID_PASSPHRASE, {
              device: device.toMessageObject()
            })); // wait for user response

            const uiResp = await uiPromise.promise;
            const resp = uiResp.payload;

            if (resp) {
              // initialize to reset device state
              await device.getCommands().initialize(method.useEmptyPassphrase);
              return inner();
            } else {
              // set new state as requested
              device.setState(deviceState);
            }
          } else {
            throw ERROR.INVALID_STATE;
          }
        }
      } catch (error) {
        // catch wrong pin error
        if (error.message === ERROR.INVALID_PIN_ERROR_MESSAGE && PIN_TRIES < MAX_PIN_TRIES) {
          PIN_TRIES++;
          postMessage((0, _builder.UiMessage)(UI.INVALID_PIN, {
            device: device.toMessageObject()
          }));
          return inner();
        } else {
          // other error
          // postMessage(ResponseMessage(method.responseID, false, { error: error.message }));
          // eslint-disable-next-line no-use-before-define
          // closePopup();
          // clear cached passphrase. it's not valid
          device.clearPassphrase();
          device.setState(null); // interrupt process and go to "final" block

          return Promise.reject(error.message);
        }
      }

      if (method.useUi) {
        // make sure that popup is opened
        await getPopupPromise().promise;
      } else {
        // popup is not required
        postMessage((0, _builder.UiMessage)(POPUP.CANCEL_POPUP_REQUEST));
      } // run method


      try {
        // for CustomMessage method reconfigure transport with custom messages definitions
        const customMessages = method.getCustomMessages();

        if (_deviceList && customMessages) {
          await _deviceList.reconfigure(customMessages, true);
        }

        const response = await method.run();
        messageResponse = (0, _builder.ResponseMessage)(method.responseID, true, response);
      } catch (error) {
        return Promise.reject({
          message: error.message,
          code: error.code
        });
      }
    }; // run inner function


    await device.run(inner, {
      keepSession: method.keepSession,
      useEmptyPassphrase: method.useEmptyPassphrase,
      skipFinalReload: method.skipFinalReload
    });
  } catch (error) {
    if (method) {
      // corner case:
      // thrown while acquiring device
      // it's a race condition between two tabs
      // workaround is to enumerate transport again and report changes to get a valid session number
      if (_deviceList && error.message === ERROR.WRONG_PREVIOUS_SESSION_ERROR_MESSAGE) {
        _deviceList.enumerate();
      }

      messageResponse = (0, _builder.ResponseMessage)(method.responseID, false, {
        error: error.message || error,
        code: error.code
      });
    }
  } finally {
    // Work done
    _log.log('onCall::finally', messageResponse);

    const response = messageResponse;

    if (response) {
      await device.cleanup(); // eslint-disable-next-line no-use-before-define

      closePopup(); // eslint-disable-next-line no-use-before-define

      cleanup();

      if (method) {
        method.dispose();
      } // restore default messages


      if (_deviceList) {
        await _deviceList.restoreMessages();
      }

      postMessage(response);
    }
  }
};
/**
 * Clean up all variables and references.
 * @returns {void}
 * @memberof Core
 */


exports.onCall = onCall;

const cleanup = () => {
  // closePopup(); // this causes problem when action is interrupted (example: bootloader mode)
  _popupPromise = null;
  _uiPromises = []; // TODO: remove only promises with params callId

  _log.log('Cleanup...');
};
/**
 * Force close popup.
 * @returns {void}
 * @memberof Core
 */


const closePopup = () => {
  if (_popupPromise) {
    postMessage((0, _builder.UiMessage)(POPUP.CANCEL_POPUP_REQUEST));
  }

  postMessage((0, _builder.UiMessage)(UI.CLOSE_UI_WINDOW));
};
/**
 * Handle button request from Device.
 * @param {Device} device
 * @param {string} code
 * @returns {Promise<void>}
 * @memberof Core
 */


const onDeviceButtonHandler = async (device, code, method) => {
  // wait for popup handshake
  const addressRequest = code === 'ButtonRequest_Address';

  if (!addressRequest || addressRequest && method.useUi) {
    await getPopupPromise().promise;
  }

  const data = typeof method.getButtonRequestData === 'function' ? method.getButtonRequestData(code) : null; // request view

  postMessage((0, _builder.DeviceMessage)(DEVICE.BUTTON, {
    device: device.toMessageObject(),
    code: code
  }));
  postMessage((0, _builder.UiMessage)(UI.REQUEST_BUTTON, {
    device: device.toMessageObject(),
    code: code,
    data
  }));

  if (addressRequest && !method.useUi) {
    postMessage((0, _builder.UiMessage)(UI.ADDRESS_VALIDATION, data));
  }
};
/**
 * Handle pin request from Device.
 * @param {Device} device
 * @param {string} type
 * @param {Function} callback
 * @returns {Promise<void>}
 * @memberof Core
 */


const onDevicePinHandler = async (device, type, callback) => {
  // wait for popup handshake
  await getPopupPromise().promise; // request pin view

  postMessage((0, _builder.UiMessage)(UI.REQUEST_PIN, {
    device: device.toMessageObject()
  })); // wait for pin

  const uiResp = await createUiPromise(UI.RECEIVE_PIN, device).promise;
  const pin = uiResp.payload; // callback.apply(null, [null, pin]);

  callback(null, pin);
};

const onDeviceWordHandler = async (device, type, callback) => {
  // wait for popup handshake
  await getPopupPromise().promise;
  postMessage((0, _builder.UiMessage)(UI.REQUEST_WORD, {
    device: device.toMessageObject(),
    type
  })); // wait for word

  const uiResp = await createUiPromise(UI.RECEIVE_WORD, device).promise;
  const word = uiResp.payload;
  callback(null, word);
};
/**
 * Handle passphrase request from Device.
 * @param {Device} device
 * @param {Function} callback
 * @returns {Promise<void>}
 * @memberof Core
 */


const onDevicePassphraseHandler = async (device, callback) => {
  const cachedPassphrase = device.getPassphrase();

  if (typeof cachedPassphrase === 'string') {
    callback(null, cachedPassphrase);
    return;
  } // wait for popup handshake


  await getPopupPromise().promise; // request passphrase view

  postMessage((0, _builder.UiMessage)(UI.REQUEST_PASSPHRASE, {
    device: device.toMessageObject()
  })); // wait for passphrase

  const uiResp = await createUiPromise(UI.RECEIVE_PASSPHRASE, device).promise;
  const value = uiResp.payload.value;
  const cache = uiResp.payload.save;
  device.setPassphrase(cache ? value : null);
  callback(null, value);
};
/**
 * Handle passphrase request from Device and use empty
 * @param {Device} device
 * @param {Function} callback
 * @returns {Promise<void>}
 * @memberof Core
 */


const onEmptyPassphraseHandler = async (device, callback) => {
  callback(null, '');
};
/**
 * Handle popup closed by user.
 * @returns {void}
 * @memberof Core
 */


const onPopupClosed = customErrorMessage => {
  const error = customErrorMessage ? new Error(customErrorMessage) : ERROR.POPUP_CLOSED; // Device was already acquired. Try to interrupt running action which will throw error from onCall try/catch block

  if (_deviceList && _deviceList.asArray().length > 0) {
    _deviceList.allDevices().forEach(d => {
      d.keepSession = false; // clear session on release

      if (d.isUsedHere()) {
        d.interruptionFromUser(error);
      } else {
        const uiPromise = findUiPromise(0, DEVICE.DISCONNECT);

        if (uiPromise) {
          uiPromise.resolve({
            event: error.message,
            payload: null
          });
        } else {
          _callMethods.forEach(m => {
            postMessage((0, _builder.ResponseMessage)(m.responseID, false, {
              error: error.message
            }));
          });

          _callMethods.splice(0, _callMethods.length);
        }
      }
    });

    cleanup(); // Waiting for device. Throw error before onCall try/catch block
  } else {
    if (_uiPromises.length > 0) {
      _uiPromises.forEach(p => {
        p.reject(error);
      });

      _uiPromises = [];
    }

    if (_popupPromise) {
      _popupPromise.reject(error);

      _popupPromise = null;
    }

    cleanup();
  }
};
/**
 * Handle DeviceList changes.
 * If there is uiPromise waiting for device selection update view.
 * Used in initDevice function
 * @param {DeviceTyped} interruptDevice
 * @returns {void}
 * @memberof Core
 */


const handleDeviceSelectionChanges = (interruptDevice = null) => {
  // update list of devices in popup
  const uiPromise = findUiPromise(0, UI.RECEIVE_DEVICE);

  if (uiPromise && _deviceList) {
    const list = _deviceList.asArray();

    const isWebUsb = _deviceList.transportType().indexOf('webusb') >= 0;

    if (list.length === 1 && !isWebUsb) {
      // there is only one device. use it
      // resolve uiPromise to looks like it's a user choice (see: handleMessage function)
      uiPromise.resolve({
        event: UI.RECEIVE_DEVICE,
        payload: {
          device: list[0]
        }
      });
      removeUiPromise(uiPromise);
    } else {
      // update device selection list view
      postMessage((0, _builder.UiMessage)(UI.SELECT_DEVICE, {
        webusb: isWebUsb,
        devices: list
      }));
    }
  } // device was disconnected, interrupt pending uiPromises for this device


  if (interruptDevice) {
    const path = interruptDevice.path;
    let shouldClosePopup = false;

    _uiPromises.forEach(p => {
      if (p.device && p.device.getDevicePath() === path) {
        if (p.id === DEVICE.DISCONNECT) {
          p.resolve({
            event: DEVICE.DISCONNECT,
            payload: null
          });
        }

        shouldClosePopup = true;
      }
    });

    if (_preferredDevice && _preferredDevice.path === path) {
      _preferredDevice = null;
    }

    if (shouldClosePopup) {
      closePopup();
      cleanup();
    }
  }
};
/**
 * Start DeviceList with listeners.
 * @param {ConnectSettings} settings
 * @returns {Promise<void>}
 * @memberof Core
 */


const initDeviceList = async settings => {
  try {
    _deviceList = new _DeviceList.default();

    _deviceList.on(DEVICE.CONNECT, device => {
      handleDeviceSelectionChanges();
      postMessage((0, _builder.DeviceMessage)(DEVICE.CONNECT, device));
    });

    _deviceList.on(DEVICE.CONNECT_UNACQUIRED, device => {
      handleDeviceSelectionChanges();
      postMessage((0, _builder.DeviceMessage)(DEVICE.CONNECT_UNACQUIRED, device));
    });

    _deviceList.on(DEVICE.DISCONNECT, device => {
      handleDeviceSelectionChanges(device);
      postMessage((0, _builder.DeviceMessage)(DEVICE.DISCONNECT, device));
    });

    _deviceList.on(DEVICE.CHANGED, device => {
      postMessage((0, _builder.DeviceMessage)(DEVICE.CHANGED, device));
    });

    _deviceList.on(TRANSPORT.ERROR, async error => {
      _log.error('TRANSPORT ERROR', error);

      if (_deviceList) {
        _deviceList.disconnectDevices();

        _deviceList.removeAllListeners();
      }

      _deviceList = null;
      postMessage((0, _builder.TransportMessage)(TRANSPORT.ERROR, {
        error: error.message || error
      })); // if transport fails during app lifetime, try to reconnect

      if (settings.transportReconnect) {
        await (0, _promiseUtils.resolveAfter)(1000, null);
        await initDeviceList(settings);
      }
    });

    _deviceList.on(TRANSPORT.START, transportType => postMessage((0, _builder.TransportMessage)(TRANSPORT.START, transportType)));

    await _deviceList.init();

    if (_deviceList) {
      await _deviceList.waitForTransportFirstEvent();
    }
  } catch (error) {
    // eslint-disable-next-line require-atomic-updates
    _deviceList = null;
    postMessage((0, _builder.TransportMessage)(TRANSPORT.ERROR, {
      error: error.message || error
    }));

    if (!settings.transportReconnect) {
      throw error;
    } else {
      await (0, _promiseUtils.resolveAfter)(3000, null); // try to reconnect

      await initDeviceList(settings);
    }
  }
};
/**
 * An event emitter for communication with parent
 * @extends EventEmitter
 * @memberof Core
 */


class Core extends _events.default {
  constructor() {
    super();
  }

  handleMessage(message, isTrustedOrigin) {
    handleMessage(message, isTrustedOrigin);
  }

  onBeforeUnload() {
    if (_deviceList) {
      _deviceList.onBeforeUnload();
    }

    this.removeAllListeners();
  }

  getCurrentMethod() {
    return _callMethods;
  }

  getTransportInfo() {
    if (_deviceList) {
      return _deviceList.getTransportInfo();
    }
  }

}
/**
 * Init instance of Core event emitter.
 * @returns {Core}
 * @memberof Core
 */


exports.Core = Core;

const initCore = () => {
  _core = new Core();
  return _core;
};
/**
 * Module initialization.
 * This will download the config.json, start DeviceList, init Core emitter instance.
 * Returns Core, an event emitter instance.
 * @param {Object} settings - optional // TODO
 * @returns {Promise<Core>}
 * @memberof Core
 */


exports.initCore = initCore;

const initData = async settings => {
  try {
    await _DataManager.default.load(settings);
  } catch (error) {
    _log.log('init error', error);

    throw error;
  }
};

exports.initData = initData;

const init = async settings => {
  try {
    _log.enabled = settings.debug;
    await _DataManager.default.load(settings);
    await initCore();
    return _core;
  } catch (error) {
    // TODO: kill app
    _log.log('init error', error);

    throw error;
  }
};

exports.init = init;

const initTransport = async settings => {
  try {
    if (!settings.transportReconnect) {
      // try only once, if it fails kill and throw initialization error
      await initDeviceList(settings);
    } else {
      // don't wait for DeviceList result, further communication will be thru TRANSPORT events
      initDeviceList(settings);
    }
  } catch (error) {
    _log.log('initTransport', error);

    throw error;
  }
};

exports.initTransport = initTransport;

const stop = async () => {
  if (_deviceList) {
    _deviceList.stop();
  } // _core = null; // Class with event emitter
  // _deviceList = null; // Instance of DeviceList
  // _popupPromise = null; // Waiting for popup handshake
  // _uiPromises = []; // Waiting for ui response
  // _preferredDevice = null; // TODO: type

};

exports.stop = stop;

const disableWebUSBTransport = async () => {
  if (!_deviceList) return;
  if (_deviceList.transportType() !== 'webusb') return; // override settings

  const settings = _DataManager.default.getSettings();

  settings.webusb = false;

  try {
    // disconnect previous device list
    _deviceList.onBeforeUnload(); // and init with new settings, without webusb


    await initDeviceList(settings);
  } catch (error) {// do nothing
  }
};