"use strict";

var _interopRequireWildcard = require("@babel/runtime/helpers/interopRequireWildcard");

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

var _defineProperty2 = _interopRequireDefault(require("@babel/runtime/helpers/defineProperty"));

var _constants = require("../constants");

var POPUP = _interopRequireWildcard(require("../constants/popup"));

var IFRAME = _interopRequireWildcard(require("../constants/iframe"));

var UI = _interopRequireWildcard(require("../constants/ui"));

var _ConnectSettings = require("../data/ConnectSettings");

var _DataManager = _interopRequireDefault(require("../data/DataManager"));

var _Core = require("../core/Core");

var _message = require("../message");

var _builder = require("../message/builder");

var _debug = _interopRequireWildcard(require("../utils/debug"));

var _windowsUtils = require("../utils/windowsUtils");

var _networkUtils = require("../env/browser/networkUtils");

var _browserUtils = require("../env/browser/browserUtils");

var _storage = require("../storage");

function ownKeys(object, enumerableOnly) { var keys = Object.keys(object); if (Object.getOwnPropertySymbols) { var symbols = Object.getOwnPropertySymbols(object); if (enumerableOnly) symbols = symbols.filter(function (sym) { return Object.getOwnPropertyDescriptor(object, sym).enumerable; }); keys.push.apply(keys, symbols); } return keys; }

function _objectSpread(target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i] != null ? arguments[i] : {}; if (i % 2) { ownKeys(Object(source), true).forEach(function (key) { (0, _defineProperty2.default)(target, key, source[key]); }); } else if (Object.getOwnPropertyDescriptors) { Object.defineProperties(target, Object.getOwnPropertyDescriptors(source)); } else { ownKeys(Object(source)).forEach(function (key) { Object.defineProperty(target, key, Object.getOwnPropertyDescriptor(source, key)); }); } } return target; }

let _core; // custom log


const _log = (0, _debug.init)('IFrame');

let _popupMessagePort; // Wrapper which listen events from Core
// since iframe.html needs to send message via window.postMessage
// we need to listen events from Core and convert it to simple objects possible to send over window.postMessage


const handleMessage = event => {
  // ignore messages from myself (chrome bug?)
  if (event.source === window || !event.data) return;
  const data = event.data;
  const id = typeof data.id === 'number' ? data.id : 0;

  const fail = error => {
    // eslint-disable-next-line no-use-before-define
    postMessage(new _builder.ResponseMessage(id, false, {
      error
    })); // eslint-disable-next-line no-use-before-define

    postMessage(new _builder.UiMessage(POPUP.CANCEL_POPUP_REQUEST));
  }; // respond to call
  // TODO: instead of error _core should be initialized automatically


  if (!_core && data.type === IFRAME.CALL) {
    fail('Core not initialized yet!');
    return;
  } // catch first message from window.opener


  if (data.type === IFRAME.INIT) {
    // eslint-disable-next-line no-use-before-define
    init(data.payload, event.origin);
    return;
  } // popup handshake initialization process, get reference to message channel


  if (data.type === POPUP.HANDSHAKE && event.origin === window.location.origin) {
    if (!_popupMessagePort || _popupMessagePort instanceof MessagePort) {
      if (!event.ports || event.ports.length < 1) {
        fail('POPUP.HANDSHAKE: popupMessagePort not found');
        return;
      }

      _popupMessagePort = event.ports[0];
    }

    if (!_core) {
      fail('POPUP.HANDSHAKE: Core not initialized');
      return;
    }

    const method = _core.getCurrentMethod()[0]; // eslint-disable-next-line no-use-before-define


    postMessage(new _builder.UiMessage(POPUP.HANDSHAKE, {
      settings: _DataManager.default.getSettings(),
      transport: _core.getTransportInfo(),
      method: method ? method.info : null
    }));
  } // clear reference to popup MessagePort


  if (data.type === POPUP.CLOSED) {
    if (_popupMessagePort instanceof MessagePort) {
      _popupMessagePort = null;
    }
  } // is message from popup or extension


  const whitelist = _DataManager.default.isWhitelisted(event.origin);

  const isTrustedDomain = event.origin === window.location.origin || !!whitelist; // ignore messages from domain other then parent.window or popup.window or chrome extension

  const eventOrigin = (0, _networkUtils.getOrigin)(event.origin);
  if (!isTrustedDomain && eventOrigin !== _DataManager.default.getSettings('origin') && eventOrigin !== (0, _networkUtils.getOrigin)(document.referrer)) return;
  const message = (0, _message.parseMessage)(data); // prevent from passing event up

  event.preventDefault();
  event.stopImmediatePropagation(); // pass data to Core

  _core.handleMessage(message, isTrustedDomain);
}; // communication with parent window


const postMessage = message => {
  _log.debug('postMessage', message);

  const usingPopup = _DataManager.default.getSettings('popup');

  const trustedHost = _DataManager.default.getSettings('trustedHost');

  const handshake = message.type === IFRAME.LOADED; // popup handshake is resolved automatically

  if (!usingPopup) {
    if (message.type === UI.REQUEST_UI_WINDOW) {
      _core.handleMessage({
        event: _constants.UI_EVENT,
        type: POPUP.HANDSHAKE
      }, true);

      return;
    } else if (message.type === POPUP.CANCEL_POPUP_REQUEST) {
      return;
    }
  }

  if (!trustedHost && !handshake && message.event === _constants.TRANSPORT_EVENT) {
    return;
  } // check if permissions to read from device is granted
  // eslint-disable-next-line no-use-before-define


  if (!trustedHost && message.event === _constants.DEVICE_EVENT && !filterDeviceEvent(message)) {
    return;
  }

  if (message.event === _constants.TRANSPORT_EVENT) {
    // add preferred bridge installer
    message.payload.bridge = (0, _browserUtils.suggestBridgeInstaller)();
  } // eslint-disable-next-line no-use-before-define


  if (usingPopup && targetUiEvent(message)) {
    if (_popupMessagePort) {
      _popupMessagePort.postMessage(message);
    }
  } else {
    let origin = _DataManager.default.getSettings('origin');

    if (!origin || origin.indexOf('file://') >= 0) origin = '*';
    (0, _windowsUtils.sendMessage)(message, origin);
  }
};

const targetUiEvent = message => {
  const whitelistedMessages = [IFRAME.LOADED, IFRAME.ERROR, POPUP.CANCEL_POPUP_REQUEST, UI.CLOSE_UI_WINDOW, UI.CUSTOM_MESSAGE_REQUEST, UI.LOGIN_CHALLENGE_REQUEST, UI.BUNDLE_PROGRESS, UI.ADDRESS_VALIDATION];
  return message.event === _constants.UI_EVENT && whitelistedMessages.indexOf(message.type) < 0;
};

const filterDeviceEvent = message => {
  if (!message.payload) return false; // const features: any = message.payload.device ? message.payload.device.features : message.payload.features;
  // exclude button/pin/passphrase events

  const features = message.payload.features;

  if (features) {
    const savedPermissions = (0, _storage.load)(_storage.PERMISSIONS_KEY) || (0, _storage.load)(_storage.PERMISSIONS_KEY, true);

    if (savedPermissions && Array.isArray(savedPermissions)) {
      const devicePermissions = savedPermissions.filter(p => {
        return p.origin === _DataManager.default.getSettings('origin') && p.type === 'read' && p.device === features.device_id;
      });
      return devicePermissions.length > 0;
    }
  }

  return false;
};

const init = async (payload, origin) => {
  if (_DataManager.default.getSettings('origin')) return; // already initialized

  const parsedSettings = (0, _ConnectSettings.parse)(_objectSpread({}, payload.settings, {
    extension: payload.extension
  })); // set origin manually

  parsedSettings.origin = !origin || origin === 'null' ? payload.settings.origin : origin;

  if (parsedSettings.popup && typeof BroadcastChannel !== 'undefined') {
    // && parsedSettings.env !== 'web'
    const broadcastID = `${parsedSettings.env}-${parsedSettings.timestamp}`;
    _popupMessagePort = new BroadcastChannel(broadcastID);

    _popupMessagePort.onmessage = message => handleMessage(message);
  }

  _log.enabled = parsedSettings.debug;

  try {
    // initialize core
    _core = await (0, _Core.init)(parsedSettings);

    _core.on(_constants.CORE_EVENT, postMessage); // initialize transport and wait for the first transport event (start or error)


    await (0, _Core.initTransport)(parsedSettings);
    postMessage(new _builder.UiMessage(IFRAME.LOADED));
  } catch (error) {
    postMessage(new _builder.UiMessage(IFRAME.ERROR, {
      error: error.message
    }));
  }
};

window.addEventListener('message', handleMessage, false);
window.addEventListener('beforeunload', () => {
  if (_core) {
    _core.onBeforeUnload();
  }
});