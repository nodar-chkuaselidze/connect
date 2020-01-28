"use strict";

var _interopRequireWildcard = require("@babel/runtime/helpers/interopRequireWildcard");

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

exports.__esModule = true;
exports.uploadFirmware = void 0;

var _builder = require("../../../message/builder");

var _Device = _interopRequireDefault(require("../../../device/Device"));

var UI = _interopRequireWildcard(require("../../../constants/ui"));

var DEVICE = _interopRequireWildcard(require("../../../constants/device"));

// firmware does not send button message but user still must press button to continue
// with fw update.
const postConfirmationMessage = device => {
  // only if firmware is already installed. fresh device does not require button confirmation
  if (device.features.firmware_present) {
    device.emit(DEVICE.BUTTON, device, 'ButtonRequest_FirmwareUpdate');
  }
};

const postProgressMessage = (device, progress, postMessage) => {
  postMessage((0, _builder.UiMessage)(UI.FIRMWARE_PROGRESS, {
    device: device.toMessageObject(),
    progress
  }));
};

const uploadFirmware = async (typedCall, postMessage, device, params) => {
  const {
    payload,
    length
  } = params;
  let response = {};

  if (device.features.major_version === 1) {
    postConfirmationMessage(device);
    await typedCall('FirmwareErase', 'Success', {});
    postProgressMessage(device, 0, postMessage);
    response = await typedCall('FirmwareUpload', 'Success', {
      payload: payload
    });
    postProgressMessage(device, 100, postMessage);
    return response.message;
  }

  if (device.features.major_version === 2) {
    postConfirmationMessage(device);
    response = await typedCall('FirmwareErase', 'FirmwareRequest', {
      length
    });

    while (response.type !== 'Success') {
      const start = response.message.offset;
      const end = response.message.offset + response.message.length;
      const chunk = payload.slice(start, end); // in this moment, device is still displaying 'update firmware dialog', no firmware process is in progress yet

      if (start > 0) {
        postProgressMessage(device, Math.round(start / length * 100), postMessage);
      }

      response = await typedCall('FirmwareUpload', 'FirmwareRequest|Success', {
        payload: chunk
      });
    }

    postProgressMessage(device, 100, postMessage);
    return response.message;
  }
};

exports.uploadFirmware = uploadFirmware;