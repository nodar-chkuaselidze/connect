"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

var _interopRequireWildcard = require("@babel/runtime/helpers/interopRequireWildcard");

exports.__esModule = true;
exports.selectDevice = void 0;

var _builder = require("../../message/builder");

var UI = _interopRequireWildcard(require("../../constants/ui"));

var POPUP = _interopRequireWildcard(require("../../constants/popup"));

var _common = require("./common");

var _DataManager = _interopRequireDefault(require("../../data/DataManager"));

const initWebUsbButton = (webusb, showLoader) => {
  if (!webusb) return;

  const webusbContainer = _common.container.getElementsByClassName('webusb')[0];

  webusbContainer.style.display = 'flex';
  const button = webusbContainer.getElementsByTagName('button')[0];

  if (!_common.iframe) {
    button.innerHTML = '<span class="plus"></span><span class="text">Pair devices</span>';
  }

  const usb = _common.iframe ? _common.iframe.clientInformation.usb : null;

  const onClick = async () => {
    if (!usb) {
      window.postMessage({
        type: POPUP.EXTENSION_USB_PERMISSIONS
      }, window.location.origin);
      return;
    }

    try {
      await usb.requestDevice({
        filters: _DataManager.default.getConfig().webusb
      });

      if (showLoader) {
        (0, _common.showView)('loader');
      }
    } catch (error) {// empty, do nothing
    }
  };

  button.onclick = onClick;
};

const selectDevice = payload => {
  if (!payload) return;

  if (!payload.devices || !Array.isArray(payload.devices) || payload.devices.length === 0) {
    // No device connected
    (0, _common.showView)('connect');
    initWebUsbButton(payload.webusb, true);
    return;
  }

  (0, _common.showView)('select-device');
  initWebUsbButton(payload.webusb, false); // If only 'remember device for now' toggle and no webusb button is available
  // show it right under the table

  if (!payload.webusb) {
    const wrapper = _common.container.getElementsByClassName('wrapper')[0];

    wrapper.style.justifyContent = 'normal';
  } // Populate device list


  const deviceList = _common.container.getElementsByClassName('select-device-list')[0]; // deviceList.innerHTML = '';


  const rememberCheckbox = _common.container.getElementsByClassName('remember-device')[0]; // Show readable devices first


  payload.devices.sort((d1, d2) => {
    if (d1.type === 'unreadable' && d2.type !== 'unreadable') {
      return 1;
    } else if (d1.type !== 'unreadable' && d2.type === 'unreadable') {
      return -1;
    }

    return 0;
  });
  payload.devices.forEach(device => {
    const deviceButton = document.createElement('button');
    deviceButton.className = 'list';

    if (device.type !== 'unreadable') {
      deviceButton.addEventListener('click', () => {
        (0, _common.postMessage)(new _builder.UiMessage(UI.RECEIVE_DEVICE, {
          remember: rememberCheckbox && rememberCheckbox.checked,
          device
        }));
        (0, _common.showView)('loader');
      });
    }

    const deviceIcon = document.createElement('span');
    deviceIcon.className = 'icon';

    if (device.features) {
      if (device.features.major_version === 2) {
        deviceIcon.classList.add('model-t');
      }
    }

    const deviceName = document.createElement('span');
    deviceName.className = 'device-name';
    deviceName.textContent = device.label;
    const wrapper = document.createElement('div');
    wrapper.className = 'wrapper';
    wrapper.appendChild(deviceIcon);
    wrapper.appendChild(deviceName);
    deviceButton.appendChild(wrapper); // device {
    //     status: 'available' | 'occupied' | 'used';
    //     type: 'acquired' | 'unacquired' | 'unreadable';
    // }
    // if (device.status !== 'available') {

    if (device.type !== 'acquired' || device.status === 'occupied') {
      deviceButton.classList.add('device-explain');
      const explanation = document.createElement('div');
      explanation.className = 'explain';
      const htmlUnreadable = 'Please install <a href="https://wallet.trezor.io" target="_blank" rel="noreferrer noopener" onclick="window.closeWindow();">Bridge</a> to use Trezor device.';
      const htmlUnacquired = 'Click to activate. This device is used by another application.';

      if (device.type === 'unreadable') {
        deviceButton.disabled = true;
        deviceIcon.classList.add('unknown');
        deviceName.textContent = 'Unrecognized device';
        explanation.innerHTML = htmlUnreadable;
      }

      if (device.type === 'unacquired' || device.status === 'occupied') {
        deviceName.textContent = 'Inactive device';
        deviceButton.classList.add('unacquired');
        explanation.classList.add('unacquired');
        explanation.innerHTML = htmlUnacquired;

        if (device.type === 'acquired') {
          deviceName.textContent = device.label;
        }
      }

      deviceButton.appendChild(explanation);
    }

    deviceList.appendChild(deviceButton);
  });
};

exports.selectDevice = selectDevice;