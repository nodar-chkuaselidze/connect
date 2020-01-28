"use strict";

var _interopRequireWildcard = require("@babel/runtime/helpers/interopRequireWildcard");

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

exports.__esModule = true;
exports.initBrowserView = void 0;

var _common = require("./common");

var _builder = require("../../message/builder");

var _DataManager = _interopRequireDefault(require("../../data/DataManager"));

var POPUP = _interopRequireWildcard(require("../../constants/popup"));

var _storage = require("../../storage");

var _browserUtils = require("../../env/browser/browserUtils");

const validateBrowser = () => {
  const state = (0, _browserUtils.getBrowserState)(_DataManager.default.getConfig().supportedBrowsers);

  if (!state.supported) {
    const permitted = (0, _storage.load)(_storage.BROWSER_KEY);
    return !permitted ? state : null;
  }

  return;
};

const initBrowserView = (validation = true) => {
  if (!validation) {
    (0, _common.showView)('browser-not-supported');

    const buttons = _common.container.getElementsByClassName('buttons')[0];

    if (buttons && buttons.parentNode) {
      buttons.parentNode.removeChild(buttons);
    }

    return;
  }

  const state = validateBrowser();

  if (!state) {
    (0, _common.postMessage)((0, _builder.UiMessage)(POPUP.HANDSHAKE));
    return;
  }

  if (state.mobile) {
    (0, _common.showView)('smartphones-not-supported');
    return;
  }

  (0, _common.showView)('browser-not-supported');

  const h3 = _common.container.getElementsByTagName('h3')[0];

  const ackButton = _common.container.getElementsByClassName('cancel')[0];

  const rememberCheckbox = _common.container.getElementsByClassName('remember-permissions')[0];

  if (state.outdated) {
    h3.innerText = 'Outdated browser';
  }

  ackButton.onclick = () => {
    if (rememberCheckbox && rememberCheckbox.checked) {
      (0, _storage.save)(_storage.BROWSER_KEY, true);
    }

    (0, _common.postMessage)((0, _builder.UiMessage)(POPUP.HANDSHAKE));
    (0, _common.showView)('loader');
  };
};

exports.initBrowserView = initBrowserView;