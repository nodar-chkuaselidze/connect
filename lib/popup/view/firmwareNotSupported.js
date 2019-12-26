"use strict";

exports.__esModule = true;
exports.firmwareNotSupported = void 0;

var _common = require("./common");

const firmwareNotSupported = device => {
  const view = (0, _common.showView)('firmware-not-supported');
  if (!device.features) return;
  const {
    features
  } = device;
  const h3 = view.getElementsByTagName('h3')[0];
  h3.innerHTML = `${features.major_version === 1 ? 'Trezor One' : 'Trezor T'} is not supported`;
};

exports.firmwareNotSupported = firmwareNotSupported;