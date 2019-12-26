"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

var _interopRequireWildcard = require("@babel/runtime/helpers/interopRequireWildcard");

exports.__esModule = true;
exports.initPermissionsView = void 0;

var _builder = require("../../message/builder");

var UI = _interopRequireWildcard(require("../../constants/ui"));

var _DataManager = _interopRequireDefault(require("../../data/DataManager"));

var _common = require("./common");

const getPermissionText = (permissionType, deviceName) => {
  let text = '';

  switch (permissionType) {
    case 'read':
      text = 'Read public keys from Trezor device';
      break;

    case 'read-meta':
      text = 'Read metadata from Trezor device';
      break;

    case 'write':
      text = 'Prepare Trezor device for transaction and data signing';
      break;

    case 'write-meta':
      text = 'Write metadata to Trezor device';
      break;

    case 'management':
      text = 'Modify device settings';
      break;

    case 'custom-message':
      text = 'Run custom operations';
      break;
  }

  return text;
};

const getPermissionTooltipText = permissionType => {
  let text = '';

  switch (permissionType) {
    case 'read':
      text = 'Permission needed to load public information from your device.';
      break;

    case 'write':
      text = 'Permission needed to execute operations, such as composing a transaction, after your confirmation.';
      break;

    case 'management':
      text = 'Permission needed to change device settings, such as PIN, passphrase, label or seed.';
      break;

    case 'custom-message':
      text = 'Development tool. Use at your own risk. Allows service to send arbitrary data to your Trezor device.';
      break;
  }

  return text;
};

const createPermissionItem = (permissionText, tooltipText) => {
  const permissionItem = document.createElement('div');
  permissionItem.className = 'permission-item'; // Tooltip

  if (tooltipText !== '') {
    const tooltip = (0, _common.createTooltip)(tooltipText);
    permissionItem.appendChild(tooltip);
  } //
  // Permission content (icon & text)


  const contentDiv = document.createElement('div');
  contentDiv.className = 'content';
  const infoIcon = document.createElement('span');
  infoIcon.className = 'info-icon';
  const permissionTextSpan = document.createElement('span');
  permissionTextSpan.innerText = permissionText;
  contentDiv.appendChild(infoIcon);
  contentDiv.appendChild(permissionTextSpan);
  permissionItem.appendChild(contentDiv); //

  return permissionItem;
};

const initPermissionsView = payload => {
  (0, _common.showView)('permissions');

  const h3 = _common.container.getElementsByTagName('h3')[0];

  const hostName = h3.getElementsByClassName('host-name')[0];

  const permissionsList = _common.container.getElementsByClassName('permissions-list')[0];

  const confirmButton = _common.container.getElementsByClassName('confirm')[0];

  const cancelButton = _common.container.getElementsByClassName('cancel')[0];

  const rememberCheckbox = _common.container.getElementsByClassName('remember-permissions')[0];

  hostName.innerText = _DataManager.default.getSettings('hostLabel') || _DataManager.default.getSettings('origin');

  if (payload && Array.isArray(payload.permissions)) {
    payload.permissions.forEach(p => {
      const permissionText = getPermissionText(p, payload.device.label);
      const tooltipText = getPermissionTooltipText(p);
      const permissionItem = createPermissionItem(permissionText, tooltipText);
      permissionsList.appendChild(permissionItem);
    });
  }

  confirmButton.onclick = () => {
    (0, _common.postMessage)(new _builder.UiMessage(UI.RECEIVE_PERMISSION, {
      remember: rememberCheckbox && rememberCheckbox.checked,
      granted: true
    }));
    (0, _common.showView)('loader');
  };

  cancelButton.onclick = () => {
    (0, _common.postMessage)(new _builder.UiMessage(UI.RECEIVE_PERMISSION, {
      remember: rememberCheckbox && rememberCheckbox.checked,
      granted: false
    }));
    (0, _common.showView)('loader');
  };

  rememberCheckbox.onchange = e => {
    confirmButton.innerText = e.target.checked ? 'Always allow for this service' : 'Allow once for this session';
  };
};

exports.initPermissionsView = initPermissionsView;