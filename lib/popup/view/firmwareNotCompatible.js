"use strict";

var _interopRequireWildcard = require("@babel/runtime/helpers/interopRequireWildcard");

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

exports.__esModule = true;
exports.firmwareNotCompatible = void 0;

var _builder = require("../../message/builder");

var _DataManager = _interopRequireDefault(require("../../data/DataManager"));

var UI = _interopRequireWildcard(require("../../constants/ui"));

var _common = require("./common");

const firmwareNotCompatible = device => {
  const view = (0, _common.showView)('firmware-not-compatible');
  if (!device.features) return;
  const {
    features
  } = device;
  const fwVersion = view.getElementsByClassName('fw-version')[0];
  const identity = view.getElementsByClassName('fw-identity');
  const developer = _DataManager.default.getSettings('hostLabel') || _DataManager.default.getSettings('origin') || 'this application';
  const confirmButton = view.getElementsByClassName('confirm')[0];
  const cancelButton = view.getElementsByClassName('cancel')[0]; // h3.innerHTML = `${features.major_version === 1 ? 'Trezor One' : 'Trezor TTTT'} is not supported`;

  fwVersion.innerHTML = `${features.major_version}.${features.minor_version}.${features.patch_version}`;

  for (let i = 0; i < identity.length; i++) {
    identity[i].innerText = developer;
  }

  confirmButton.onclick = () => {
    (0, _common.postMessage)((0, _builder.UiMessage)(UI.RECEIVE_CONFIRMATION, true));
    (0, _common.showView)('loader');
  };

  cancelButton.onclick = () => {
    (0, _common.postMessage)((0, _builder.UiMessage)(UI.RECEIVE_CONFIRMATION, false));
    (0, _common.showView)('loader');
  };
};

exports.firmwareNotCompatible = firmwareNotCompatible;