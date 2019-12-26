"use strict";

exports.__esModule = true;
exports.passphraseOnDeviceView = void 0;

var _common = require("./common");

const passphraseOnDeviceView = payload => {
  (0, _common.showView)('passphrase-on-device');

  const deviceName = _common.container.getElementsByClassName('device-name')[0];

  deviceName.innerText = payload.device.label;
};

exports.passphraseOnDeviceView = passphraseOnDeviceView;