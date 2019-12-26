"use strict";

exports.__esModule = true;
exports.requestButton = void 0;

var _common = require("./common");

let toastTimeout;

const showToast = () => {
  const toast = _common.container.querySelectorAll('.toast')[0];

  if (toastTimeout) {
    clearTimeout(toastTimeout);
  }

  toastTimeout = setTimeout(() => {
    toast.classList.remove('visible');
  }, 3000);
  toast.classList.add('visible');
};

const showAddressValidation = payload => {
  (0, _common.showView)('check-address');
  const data = payload.data;

  const dataContainer = _common.container.querySelectorAll('.button-request-data')[0];

  if (!data || data.type !== 'address') {
    if (dataContainer.parentNode) {
      dataContainer.parentNode.removeChild(dataContainer);
    }

    return;
  }

  const path = _common.container.querySelectorAll('.path-value')[0];

  const address = _common.container.querySelectorAll('.address-value')[0];

  const clipboard = _common.container.querySelectorAll('.clipboard-button')[0];

  path.innerText = data.serializedPath;
  address.innerText = data.address;

  clipboard.onclick = () => {
    const el = document.createElement('textarea');
    el.value = data.address;
    el.setAttribute('readonly', '');
    el.style.position = 'absolute';
    el.style.left = '-9999px';
    dataContainer.appendChild(el);
    el.select();
    document.execCommand('copy');
    dataContainer.removeChild(el);
    showToast();
  };
};

const requestButton = payload => {
  if (payload.code === 'ButtonRequest_Address') {
    showAddressValidation(payload);
  } else if (payload.code === 'ButtonRequest_ConfirmOutput') {
    (0, _common.showView)('confirm-output');
  } else {
    (0, _common.showView)('follow-device');
  }
};

exports.requestButton = requestButton;