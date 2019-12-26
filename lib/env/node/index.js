"use strict";

var _interopRequireWildcard = require("@babel/runtime/helpers/interopRequireWildcard");

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

exports.__esModule = true;
exports.stop = exports.disableWebUSB = exports.cancel = exports.requestLogin = exports.customMessage = exports.getSettings = exports.renderWebUSBButton = exports.uiResponse = exports.call = exports.init = exports.dispose = exports.manifest = exports.messagePromises = exports.eventEmitter = void 0;

var _defineProperty2 = _interopRequireDefault(require("@babel/runtime/helpers/defineProperty"));

var _events = _interopRequireDefault(require("events"));

var _ConnectSettings = require("../../data/ConnectSettings");

var _debug = _interopRequireWildcard(require("../../utils/debug"));

var _Core = require("../../core/Core");

var _deferred = require("../../utils/deferred");

var _constants = require("../../constants");

var POPUP = _interopRequireWildcard(require("../../constants/popup"));

var IFRAME = _interopRequireWildcard(require("../../constants/iframe"));

var UI = _interopRequireWildcard(require("../../constants/ui"));

var ERROR = _interopRequireWildcard(require("../../constants/errors"));

var $T = _interopRequireWildcard(require("../../types"));

function ownKeys(object, enumerableOnly) { var keys = Object.keys(object); if (Object.getOwnPropertySymbols) { var symbols = Object.getOwnPropertySymbols(object); if (enumerableOnly) symbols = symbols.filter(function (sym) { return Object.getOwnPropertyDescriptor(object, sym).enumerable; }); keys.push.apply(keys, symbols); } return keys; }

function _objectSpread(target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i] != null ? arguments[i] : {}; if (i % 2) { ownKeys(Object(source), true).forEach(function (key) { (0, _defineProperty2.default)(target, key, source[key]); }); } else if (Object.getOwnPropertyDescriptors) { Object.defineProperties(target, Object.getOwnPropertyDescriptors(source)); } else { ownKeys(Object(source)).forEach(function (key) { Object.defineProperty(target, key, Object.getOwnPropertyDescriptor(source, key)); }); } } return target; }

const eventEmitter = new _events.default();
exports.eventEmitter = eventEmitter;

const _log = (0, _debug.init)('[trezor-connect.js]');

let _settings;

let _core;

let _messageID = 0;
const messagePromises = {};
exports.messagePromises = messagePromises;

const manifest = data => {
  _settings = (0, _ConnectSettings.parse)({
    manifest: data
  });
};

exports.manifest = manifest;

const dispose = () => {// iframe.dispose();
  // if (_popupManager) {
  //     _popupManager.close();
  // }
}; // handle message received from iframe


exports.dispose = dispose;

const handleMessage = message => {
  const {
    event,
    type,
    payload
  } = message;
  const id = message.id || 0;

  if (type === UI.REQUEST_UI_WINDOW) {
    _core.handleMessage({
      event: _constants.UI_EVENT,
      type: POPUP.HANDSHAKE
    }, true);

    return;
  }

  _log.log('handleMessage', message);

  switch (event) {
    case _constants.RESPONSE_EVENT:
      if (messagePromises[id]) {
        // resolve message promise (send result of call method)
        messagePromises[id].resolve({
          id,
          success: message.success,
          payload
        });
        delete messagePromises[id];
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
      // pass UI event up
      eventEmitter.emit(event, message);
      eventEmitter.emit(type, payload);
      break;

    default:
      _log.log('Undefined message', event, message);

  }
};

const postMessage = (message, usePromise = true) => {
  if (!_core) {
    throw new Error('postMessage: _core not found');
  }

  if (usePromise) {
    _messageID++;
    message.id = _messageID;
    messagePromises[_messageID] = (0, _deferred.create)();
    const {
      promise
    } = messagePromises[_messageID];

    _core.handleMessage(message, true);

    return promise;
  }

  _core.handleMessage(message, true);

  return null;
};

const init = async (settings = {}) => {
  if (!_settings) {
    _settings = (0, _ConnectSettings.parse)(settings);
  } // set defaults for node


  _settings.origin = 'http://node.trezor.io/';
  _settings.popup = false;
  _settings.env = 'node';

  if (!_settings.manifest) {
    throw ERROR.MANIFEST_NOT_SET;
  }

  if (_settings.lazyLoad) {
    // reset "lazyLoad" after first use
    _settings.lazyLoad = false;
    return;
  }

  _log.enabled = _settings.debug;
  _core = await (0, _Core.init)(_settings);

  _core.on(_constants.CORE_EVENT, handleMessage);

  await (0, _Core.initTransport)(_settings);
};

exports.init = init;

const call = async params => {
  if (!_core) {
    _settings = (0, _ConnectSettings.parse)({
      debug: false,
      popup: false
    }); // auto init with default settings

    try {
      await init(_settings);
    } catch (error) {
      return {
        success: false,
        payload: {
          error
        }
      };
    }
  }

  try {
    const response = await postMessage({
      type: IFRAME.CALL,
      payload: params
    });

    if (response) {
      return response;
    } else {
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
  _core.handleMessage({
    event: _constants.UI_EVENT,
    type: UI.CUSTOM_MESSAGE_RESPONSE,
    payload
  }, true);
};

const uiResponse = response => {
  _core.handleMessage(_objectSpread({
    event: _constants.UI_EVENT
  }, response), true);
};

exports.uiResponse = uiResponse;

const renderWebUSBButton = className => {// webUSBButton(className, _settings.webusbSrc, iframe.origin);
};

exports.renderWebUSBButton = renderWebUSBButton;

const getSettings = async () => {
  if (!_core) {
    return {
      success: false,
      payload: {
        error: 'Core not initialized yet, you need to call TrezorConnect.init or any other method first.'
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

  _core.on(_constants.CORE_EVENT, customMessageListener);

  const response = await call(_objectSpread({
    method: 'customMessage'
  }, params, {
    callback: null
  }));

  _core.removeListener(_constants.CORE_EVENT, customMessageListener);

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

          _core.handleMessage({
            event: _constants.UI_EVENT,
            type: UI.LOGIN_CHALLENGE_RESPONSE,
            payload
          }, true);
        } catch (error) {
          _core.handleMessage({
            event: _constants.UI_EVENT,
            type: UI.LOGIN_CHALLENGE_RESPONSE,
            payload: error.message
          }, true);
        }
      }
    };

    _core.on(_constants.CORE_EVENT, loginChallengeListener);

    const response = await call(_objectSpread({
      method: 'requestLogin'
    }, params, {
      asyncChallenge: true,
      callback: null
    }));

    _core.removeListener(_constants.CORE_EVENT, loginChallengeListener);

    return response;
  } else {
    return await call(_objectSpread({
      method: 'requestLogin'
    }, params));
  }
};

exports.requestLogin = requestLogin;

const cancel = error => {
  postMessage({
    type: POPUP.CLOSED,
    payload: error ? {
      error
    } : null
  }, false);
};

exports.cancel = cancel;

const disableWebUSB = () => {
  throw new Error('This version of trezor-connect is not suitable to work without browser');
};

exports.disableWebUSB = disableWebUSB;

const stop = () => {
  (0, _Core.stop)();
};

exports.stop = stop;