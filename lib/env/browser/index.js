"use strict";

var _interopRequireWildcard = require("@babel/runtime/helpers/interopRequireWildcard");

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

exports.__esModule = true;
exports.disableWebUSB = exports.requestLogin = exports.customMessage = exports.getSettings = exports.renderWebUSBButton = exports.uiResponse = exports.call = exports.init = exports.cancel = exports.dispose = exports.manifest = exports.eventEmitter = void 0;

var _defineProperty2 = _interopRequireDefault(require("@babel/runtime/helpers/defineProperty"));

var _events = _interopRequireDefault(require("events"));

var _PopupManager = _interopRequireDefault(require("../../popup/PopupManager"));

var iframe = _interopRequireWildcard(require("../../iframe/builder"));

var _button = _interopRequireDefault(require("../../webusb/button"));

var _message = require("../../message");

var _ConnectSettings = require("../../data/ConnectSettings");

var _debug = _interopRequireWildcard(require("../../utils/debug"));

var _constants = require("../../constants");

var POPUP = _interopRequireWildcard(require("../../constants/popup"));

var IFRAME = _interopRequireWildcard(require("../../constants/iframe"));

var UI = _interopRequireWildcard(require("../../constants/ui"));

var ERROR = _interopRequireWildcard(require("../../constants/errors"));

var TRANSPORT = _interopRequireWildcard(require("../../constants/transport"));

var $T = _interopRequireWildcard(require("../../types"));

function ownKeys(object, enumerableOnly) { var keys = Object.keys(object); if (Object.getOwnPropertySymbols) { var symbols = Object.getOwnPropertySymbols(object); if (enumerableOnly) symbols = symbols.filter(function (sym) { return Object.getOwnPropertyDescriptor(object, sym).enumerable; }); keys.push.apply(keys, symbols); } return keys; }

function _objectSpread(target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i] != null ? arguments[i] : {}; if (i % 2) { ownKeys(Object(source), true).forEach(function (key) { (0, _defineProperty2.default)(target, key, source[key]); }); } else if (Object.getOwnPropertyDescriptors) { Object.defineProperties(target, Object.getOwnPropertyDescriptors(source)); } else { ownKeys(Object(source)).forEach(function (key) { Object.defineProperty(target, key, Object.getOwnPropertyDescriptor(source, key)); }); } } return target; }

const eventEmitter = new _events.default();
exports.eventEmitter = eventEmitter;

const _log = (0, _debug.init)('[trezor-connect.js]');

let _settings;

let _popupManager;

const initPopupManager = () => {
  const pm = new _PopupManager.default(_settings);
  pm.on(POPUP.CLOSED, error => {
    iframe.postMessage({
      type: POPUP.CLOSED,
      payload: error ? {
        error
      } : null
    }, false);
  });
  return pm;
};

const manifest = data => {
  _settings = (0, _ConnectSettings.parse)({
    manifest: data
  });
};

exports.manifest = manifest;

const dispose = () => {
  iframe.dispose();

  if (_popupManager) {
    _popupManager.close();
  }
};

exports.dispose = dispose;

const cancel = error => {
  if (_popupManager) {
    _popupManager.emit(POPUP.CLOSED, error);
  }
}; // handle message received from iframe


exports.cancel = cancel;

const handleMessage = messageEvent => {
  // ignore messages from domain other then iframe origin
  if (messageEvent.origin !== iframe.origin) return;
  const message = (0, _message.parseMessage)(messageEvent.data);
  const {
    event,
    type,
    payload
  } = message;
  const id = message.id || 0;

  _log.log('handleMessage', message);

  switch (event) {
    case _constants.RESPONSE_EVENT:
      if (iframe.messagePromises[id]) {
        // resolve message promise (send result of call method)
        iframe.messagePromises[id].resolve({
          id,
          success: message.success,
          payload
        });
        delete iframe.messagePromises[id];
      } else {
        _log.warn(`Unknown message id ${id}`);
      }

      break;

    case _constants.DEVICE_EVENT:
      // pass DEVICE event up to html
      eventEmitter.emit(event, message);
      eventEmitter.emit(type, payload); // DEVICE_EVENT also emit single events (connect/disconnect...)

      break;

    case _constants.TRANSPORT_EVENT:
      eventEmitter.emit(event, message);
      eventEmitter.emit(type, payload);
      break;

    case _constants.BLOCKCHAIN_EVENT:
      eventEmitter.emit(event, message);
      eventEmitter.emit(type, payload);
      break;

    case _constants.UI_EVENT:
      if (type === IFRAME.BOOTSTRAP) {
        iframe.clearTimeout();
        break;
      }

      if (type === IFRAME.LOADED) {
        iframe.initPromise.resolve();
      }

      if (type === IFRAME.ERROR) {
        iframe.initPromise.reject(new Error(payload.error));
      } // pass UI event up


      eventEmitter.emit(event, message);
      eventEmitter.emit(type, payload);
      break;

    default:
      _log.log('Undefined message', event, messageEvent);

  }
};

const init = async (settings = {}) => {
  if (iframe.instance) {
    throw ERROR.IFRAME_INITIALIZED;
  }

  if (!_settings) {
    _settings = (0, _ConnectSettings.parse)(settings);
  }

  if (!_settings.manifest) {
    throw ERROR.MANIFEST_NOT_SET;
  }

  if (_settings.lazyLoad) {
    // reset "lazyLoad" after first use
    _settings.lazyLoad = false;
    return;
  }

  if (!_popupManager) {
    _popupManager = initPopupManager();
  }

  _log.enabled = _settings.debug;
  window.addEventListener('message', handleMessage);
  window.addEventListener('beforeunload', dispose);
  await iframe.init(_settings);
};

exports.init = init;

const call = async params => {
  if (!iframe.instance && !iframe.timeout) {
    // init popup with lazy loading before iframe initialization
    _settings = (0, _ConnectSettings.parse)(_settings);

    if (!_settings.manifest) {
      return {
        success: false,
        payload: {
          error: ERROR.MANIFEST_NOT_SET.message
        }
      };
    }

    if (!_popupManager) {
      _popupManager = initPopupManager();
    }

    _popupManager.request(true); // auto init with default settings


    try {
      await init(_settings);
    } catch (error) {
      if (_popupManager) {
        _popupManager.close();
      }

      return {
        success: false,
        payload: {
          error
        }
      };
    }
  }

  if (iframe.timeout) {
    // this.init was called, but iframe doesn't return handshake yet
    return {
      success: false,
      payload: {
        error: ERROR.NO_IFRAME.message
      }
    };
  } else if (iframe.error) {
    // iframe was initialized with error
    return {
      success: false,
      payload: {
        error: iframe.error
      }
    };
  } // request popup window it might be used in the future


  if (_settings.popup && _popupManager) {
    _popupManager.request();
  } // post message to iframe


  try {
    const response = await iframe.postMessage({
      type: IFRAME.CALL,
      payload: params
    });

    if (response) {
      // TODO: unlock popupManager request only if there wasn't error "in progress"
      if (response.payload.error !== ERROR.DEVICE_CALL_IN_PROGRESS.message && _popupManager) {
        _popupManager.unlock();
      }

      return response;
    } else {
      if (_popupManager) {
        _popupManager.unlock();
      }

      return {
        success: false,
        payload: {
          error: 'No response from iframe'
        }
      };
    }
  } catch (error) {
    _log.error('__call error', error);

    return error;
  }
};

exports.call = call;

const customMessageResponse = payload => {
  iframe.postMessage({
    event: _constants.UI_EVENT,
    type: UI.CUSTOM_MESSAGE_RESPONSE,
    payload
  });
};

const uiResponse = response => {
  iframe.postMessage(_objectSpread({
    event: _constants.UI_EVENT
  }, response));
};

exports.uiResponse = uiResponse;

const renderWebUSBButton = className => {
  (0, _button.default)(className, _settings.webusbSrc, iframe.origin);
};

exports.renderWebUSBButton = renderWebUSBButton;

const getSettings = async () => {
  if (!iframe.instance) {
    return {
      success: false,
      payload: {
        error: 'Iframe not initialized yet, you need to call TrezorConnect.init or any other method first.'
      }
    };
  }

  return await call({
    method: 'getSettings'
  });
};

exports.getSettings = getSettings;

const customMessage = async params => {
  if (typeof params.callback !== 'function') {
    return {
      success: false,
      payload: {
        error: 'Parameter "callback" is not a function'
      }
    };
  } // TODO: set message listener only if iframe is loaded correctly


  const callback = params.callback;

  const customMessageListener = async event => {
    const data = event.data;

    if (data && data.type === UI.CUSTOM_MESSAGE_REQUEST) {
      const payload = await callback(data.payload);

      if (payload) {
        customMessageResponse(payload);
      } else {
        customMessageResponse({
          message: 'release'
        });
      }
    }
  };

  window.addEventListener('message', customMessageListener, false);
  const response = await call(_objectSpread({
    method: 'customMessage'
  }, params, {
    callback: null
  }));
  window.removeEventListener('message', customMessageListener);
  return response;
};

exports.customMessage = customMessage;

const requestLogin = async params => {
  // $FlowIssue: property callback not found
  if (typeof params.callback === 'function') {
    const callback = params.callback; // TODO: set message listener only if iframe is loaded correctly

    const loginChallengeListener = async event => {
      const data = event.data;

      if (data && data.type === UI.LOGIN_CHALLENGE_REQUEST) {
        try {
          const payload = await callback();
          iframe.postMessage({
            event: _constants.UI_EVENT,
            type: UI.LOGIN_CHALLENGE_RESPONSE,
            payload
          });
        } catch (error) {
          iframe.postMessage({
            event: _constants.UI_EVENT,
            type: UI.LOGIN_CHALLENGE_RESPONSE,
            payload: error.message
          });
        }
      }
    };

    window.addEventListener('message', loginChallengeListener, false);
    const response = await call(_objectSpread({
      method: 'requestLogin'
    }, params, {
      asyncChallenge: true,
      callback: null
    }));
    window.removeEventListener('message', loginChallengeListener);
    return response;
  } else {
    return await call(_objectSpread({
      method: 'requestLogin'
    }, params));
  }
};

exports.requestLogin = requestLogin;

const disableWebUSB = () => {
  iframe.postMessage({
    event: _constants.UI_EVENT,
    type: TRANSPORT.DISABLE_WEBUSB
  });
};

exports.disableWebUSB = disableWebUSB;