"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

var _networkUtils = require("../env/browser/networkUtils");

var _windowsUtils = require("../utils/windowsUtils");

var _popup = _interopRequireDefault(require("../../styles/popup.less"));

// eslint-disable-next-line no-unused-vars
let config;

const onLoad = async () => {
  config = await (0, _networkUtils.httpRequest)('./data/config.json', 'json');
  (0, _windowsUtils.sendMessage)('usb-permissions-init', '*');
};

const init = label => {
  const extensionName = document.getElementsByClassName('extension-name')[0];
  extensionName.innerText = label;
  const usbButton = document.getElementsByClassName('confirm')[0];
  const cancelButton = document.getElementsByClassName('cancel')[0];

  usbButton.onclick = async () => {
    const filters = config.webusb.map(desc => {
      return {
        vendorId: parseInt(desc.vendorId),
        productId: parseInt(desc.productId)
      };
    });
    const usb = navigator.usb;

    if (usb) {
      try {
        await usb.requestDevice({
          filters
        });
        (0, _windowsUtils.sendMessage)('usb-permissions-close', '*');
      } catch (error) {// empty
      }
    }
  };

  cancelButton.onclick = () => {
    (0, _windowsUtils.sendMessage)('usb-permissions-close', '*');
  };
};

const handleMessage = message => {
  const data = message.data;

  if (data && data.type === 'usb-permissions-init') {
    window.removeEventListener('message', handleMessage, false);
    const knownHost = config.knownHosts.find(host => host.origin === data.extension);
    const label = knownHost && knownHost.label ? knownHost.label : message.origin;
    init(label);
  }
};

window.addEventListener('load', onLoad, false);
window.addEventListener('message', handleMessage, false);