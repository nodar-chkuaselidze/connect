"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

var _interopRequireWildcard = require("@babel/runtime/helpers/interopRequireWildcard");

exports.__esModule = true;
exports.clearTimeout = exports.dispose = exports.postMessage = exports.init = exports.messagePromises = exports.error = exports.timeout = exports.initPromise = exports.origin = exports.instance = void 0;

var _deferred = require("../utils/deferred");

var IFRAME = _interopRequireWildcard(require("../constants/iframe"));

var _errors = require("../constants/errors");

var _networkUtils = require("../env/browser/networkUtils");

var _inlineStyles = _interopRequireDefault(require("./inline-styles"));

let instance;
exports.instance = instance;
let origin;
exports.origin = origin;
let initPromise = (0, _deferred.create)();
exports.initPromise = initPromise;
let timeout = 0;
exports.timeout = timeout;
let error;
exports.error = error;
let _messageID = 0; // every postMessage to iframe has its own promise to resolve

const messagePromises = {};
exports.messagePromises = messagePromises;

const init = async settings => {
  exports.initPromise = initPromise = (0, _deferred.create)();
  const existedFrame = document.getElementById('trezorconnect');

  if (existedFrame) {
    exports.instance = instance = existedFrame;
  } else {
    exports.instance = instance = document.createElement('iframe');
    instance.frameBorder = '0';
    instance.width = '0px';
    instance.height = '0px';
    instance.style.position = 'absolute';
    instance.style.display = 'none';
    instance.style.border = '0px';
    instance.style.width = '0px';
    instance.style.height = '0px';
    instance.id = 'trezorconnect';
  }

  let src;

  if (settings.env === 'web') {
    const manifestString = settings.manifest ? JSON.stringify(settings.manifest) : 'undefined'; // note: btoa(undefined) === btoa('undefined') === "dW5kZWZpbmVk"

    const manifest = `&version=${settings.version}&manifest=${encodeURIComponent(btoa(JSON.stringify(manifestString)))}`;
    src = `${settings.iframeSrc}?${Date.now()}${manifest}`;
  } else {
    src = settings.iframeSrc;
  }

  instance.setAttribute('src', src);

  if (settings.webusb) {
    instance.setAttribute('allow', 'usb');
  }

  exports.origin = origin = (0, _networkUtils.getOrigin)(instance.src);
  exports.timeout = timeout = window.setTimeout(() => {
    initPromise.reject(_errors.IFRAME_TIMEOUT);
  }, 10000);

  const onLoad = () => {
    if (!instance) {
      initPromise.reject(_errors.IFRAME_BLOCKED);
      return;
    }

    try {
      // if hosting page is able to access cross-origin location it means that the iframe is not loaded
      const iframeOrigin = instance.contentWindow.location.origin;

      if (!iframeOrigin || iframeOrigin === 'null') {
        // eslint-disable-next-line no-use-before-define
        handleIframeBlocked();
        return;
      }
    } catch (e) {// empty
    }

    let extension; // $FlowIssue chrome is not declared outside

    if (typeof chrome !== 'undefined' && chrome.runtime && typeof chrome.runtime.onConnect !== 'undefined') {
      chrome.runtime.onConnect.addListener(() => {});
      extension = chrome.runtime.id;
    }

    instance.contentWindow.postMessage({
      type: IFRAME.INIT,
      payload: {
        settings,
        extension
      }
    }, origin);
    instance.onload = undefined;
  }; // IE hack


  if (instance.attachEvent) {
    instance.attachEvent('onload', onLoad);
  } else {
    instance.onload = onLoad;
  } // inject iframe into host document body


  if (document.body) {
    document.body.appendChild(instance); // eslint-disable-next-line no-use-before-define

    injectStyleSheet();
  }

  try {
    await initPromise.promise;
  } catch (error) {
    // reset state to allow initialization again
    if (instance) {
      if (instance.parentNode) {
        instance.parentNode.removeChild(instance);
      } // eslint-disable-next-line require-atomic-updates


      exports.instance = instance = null;
    }

    throw error.message || error;
  } finally {
    window.clearTimeout(timeout);
    exports.timeout = timeout = 0;
  }
};

exports.init = init;

const injectStyleSheet = () => {
  if (!instance) {
    throw _errors.IFRAME_BLOCKED;
  }

  const doc = instance.ownerDocument;
  const head = doc.head || doc.getElementsByTagName('head')[0];
  const style = document.createElement('style');
  style.setAttribute('type', 'text/css');
  style.setAttribute('id', 'TrezorConnectStylesheet'); // $FlowIssue

  if (style.styleSheet) {
    // IE
    // $FlowIssue
    style.styleSheet.cssText = _inlineStyles.default;
    head.appendChild(style);
  } else {
    style.appendChild(document.createTextNode(_inlineStyles.default));
    head.append(style);
  }
};

const handleIframeBlocked = () => {
  window.clearTimeout(timeout);
  exports.error = error = _errors.IFRAME_BLOCKED.message; // eslint-disable-next-line no-use-before-define

  dispose();
  initPromise.reject(_errors.IFRAME_BLOCKED);
}; // post messages to iframe


const postMessage = (message, usePromise = true) => {
  if (!instance) {
    throw _errors.IFRAME_BLOCKED;
  }

  if (usePromise) {
    _messageID++;
    message.id = _messageID;
    messagePromises[_messageID] = (0, _deferred.create)();
    instance.contentWindow.postMessage(message, origin);
    return messagePromises[_messageID].promise;
  }

  instance.contentWindow.postMessage(message, origin);
  return null;
};

exports.postMessage = postMessage;

const dispose = () => {
  if (instance && instance.parentNode) {
    try {
      instance.parentNode.removeChild(instance);
    } catch (error) {// do nothing
    }
  }

  exports.instance = instance = null;
  exports.timeout = timeout = 0;
};

exports.dispose = dispose;

const clearTimeout = () => {
  window.clearTimeout(timeout);
};

exports.clearTimeout = clearTimeout;