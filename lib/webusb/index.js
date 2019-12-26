"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

var _networkUtils = require("../env/browser/networkUtils");

var _webusb = _interopRequireDefault(require("../../styles/webusb.less"));

// eslint-disable-next-line no-unused-vars
// handle message received from connect.js
const handleMessage = async event => {
  if (!event.data) return;
  const data = event.data;
  const exists = document.getElementsByTagName('button');

  if (exists && exists.length > 0) {
    return;
  }

  const config = await (0, _networkUtils.httpRequest)('./data/config.json', 'json');
  const filters = config.webusb.map(desc => {
    return {
      vendorId: parseInt(desc.vendorId),
      productId: parseInt(desc.productId)
    };
  });
  const button = document.createElement('button');

  if (data.style) {
    const css = JSON.parse(data.style);

    for (const key of Object.keys(css)) {
      if (Object.prototype.hasOwnProperty.call(button.style, key)) {
        button.style.setProperty(key, css[key]);
      }
    }
  } else {
    button.className = 'default';
  }

  button.onclick = async () => {
    const usb = navigator.usb;

    if (usb) {
      try {
        await usb.requestDevice({
          filters
        });
      } catch (error) {// empty
      }
    }
  };

  if (document.body) {
    document.body.append(button);
  }
};

window.addEventListener('message', handleMessage);