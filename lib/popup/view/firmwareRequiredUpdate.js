"use strict";

exports.__esModule = true;
exports.firmwareRequiredUpdate = void 0;

var _common = require("./common");

const firmwareRequiredUpdate = device => {
  const view = (0, _common.showView)('firmware-update');
  if (!device.features) return;
  const release = device.firmwareRelease;
  if (!release) return;
  const button = view.getElementsByClassName('confirm')[0];
  const url = release.channel === 'beta' ? 'https://beta-wallet.trezor.io/' : 'https://wallet.trezor.io/';
  const version = release.version.join('.');
  button.setAttribute('href', `${url}?fw=${version}`);
};

exports.firmwareRequiredUpdate = firmwareRequiredUpdate;