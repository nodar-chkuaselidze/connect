"use strict";

var _interopRequireWildcard = require("@babel/runtime/helpers/interopRequireWildcard");

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

exports.__esModule = true;
exports.postMessageToParent = exports.postMessage = exports.initMessageChannel = exports.getIframeElement = exports.showView = exports.clearView = exports.createTooltip = exports.setOperation = exports.iframe = exports.views = exports.container = exports.header = void 0;

var _DataManager = _interopRequireDefault(require("../../data/DataManager"));

var POPUP = _interopRequireWildcard(require("../../constants/popup"));

const header = document.getElementsByTagName('header')[0];
exports.header = header;
const container = document.getElementById('container');
exports.container = container;
const views = document.getElementById('views');
exports.views = views;
let iframe; // TODO: Window type

exports.iframe = iframe;
const channel = new MessageChannel(); // used in direct element communication (iframe.postMessage)

let broadcast = null;

const setOperation = operation => {
  const infoPanel = document.getElementsByClassName('info-panel')[0];
  const operationEl = infoPanel.getElementsByClassName('operation')[0];
  const originEl = infoPanel.getElementsByClassName('origin')[0];
  operationEl.innerHTML = operation;
  originEl.innerText = _DataManager.default.getSettings('hostLabel') || _DataManager.default.getSettings('origin');

  const icon = _DataManager.default.getSettings('hostIcon');

  if (icon) {
    const iconContainers = document.getElementsByClassName('service-info');

    for (let i = 0; i < iconContainers.length; i++) {
      iconContainers[i].innerHTML = `<img src="${icon}" alt="" />`;
    }
  }
};

exports.setOperation = setOperation;

const createTooltip = text => {
  const tooltip = document.createElement('div');
  tooltip.setAttribute('tooltip', text);
  tooltip.setAttribute('tooltip-position', 'bottom');
  return tooltip;
};

exports.createTooltip = createTooltip;

const clearView = () => {
  container.innerHTML = '';
};

exports.clearView = clearView;

const showView = className => {
  clearView();
  const view = views.getElementsByClassName(className);

  if (view) {
    const viewItem = view.item(0);

    if (viewItem) {
      container.innerHTML = viewItem.outerHTML;
    }
  } else {
    const unknown = views.getElementsByClassName('unknown-view');
    const unknownItem = unknown.item(0);

    if (unknownItem) {
      container.innerHTML = unknownItem.outerHTML;
    }
  }

  return container;
};

exports.showView = showView;

const getIframeElement = () => {
  // try find iframe in opener window
  if (!window.opener) return null;
  const frames = window.opener.frames;
  if (!frames) return null; // electron will return undefined

  for (let i = 0; i < frames.length; i++) {
    try {
      // try to get iframe origin, this action will not fail ONLY if the origins of iframe and popup are the same
      if (frames[i].location.host === window.location.host) {
        exports.iframe = iframe = frames[i];
      }
    } catch (error) {// do nothing, try next entry
    }
  }

  return iframe;
}; // initialize message channel with iframe element


exports.getIframeElement = getIframeElement;

const initMessageChannel = (id, handler) => {
  const hasIframe = getIframeElement();

  if (typeof BroadcastChannel !== 'undefined') {
    broadcast = new BroadcastChannel(id);
    broadcast.onmessage = handler;
    return;
  }

  if (!hasIframe) {
    throw new Error('unable to establish connection with iframe');
  }

  channel.port1.onmessage = handler;
}; // this method can be used from anywhere


exports.initMessageChannel = initMessageChannel;

const postMessage = message => {
  if (!broadcast && !iframe) {
    throw new Error('unable to postMessage to iframe');
  }

  if (broadcast) {
    broadcast.postMessage(message);
    return;
  } // First message to iframe, MessageChannel port needs to set here


  if (message.type && message.type === POPUP.HANDSHAKE) {
    iframe.postMessage(message, window.location.origin, [channel.port2]);
    return;
  }

  iframe.postMessage(message, window.location.origin);
};

exports.postMessage = postMessage;

const postMessageToParent = message => {
  if (window.opener) {
    // post message to parent and wait for POPUP.INIT message
    window.opener.postMessage(message, '*');
  } else {
    // webextensions doesn't have "window.opener" reference and expect this message in "content-script" above popup [see: ./src/plugins/webextension/trezor-content-script.js]
    // future communication channel with webextension iframe will be "ChromePort"
    // and electron (electron which uses connect hosted outside)
    // https://github.com/electron/electron/issues/7228
    window.postMessage(message, window.location.origin);
  }
};

exports.postMessageToParent = postMessageToParent;