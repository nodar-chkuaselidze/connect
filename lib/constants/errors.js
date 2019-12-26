"use strict";

exports.__esModule = true;
exports.NO_COIN_INFO = exports.BACKEND_NO_URL = exports.backendNotSupported = exports.WEBUSB_ERROR_MESSAGE = exports.INVALID_PIN_ERROR_MESSAGE = exports.WRONG_PREVIOUS_SESSION_ERROR_MESSAGE = exports.INVALID_STATE = exports.CALL_OVERRIDE = exports.INITIALIZATION_FAILED = exports.DEVICE_USED_ELSEWHERE = exports.PERMISSIONS_NOT_GRANTED = exports.POPUP_CLOSED = exports.INVALID_PARAMETERS = exports.DEVICE_CALL_IN_PROGRESS = exports.DEVICE_NOT_FOUND = exports.WRONG_TRANSPORT_CONFIG = exports.NO_TRANSPORT = exports.MANAGEMENT_NOT_ALLOWED = exports.MANIFEST_NOT_SET = exports.BROWSER_NOT_SUPPORTED = exports.POPUP_TIMEOUT = exports.IFRAME_TIMEOUT = exports.IFRAME_INITIALIZED = exports.IFRAME_BLOCKED = exports.NO_IFRAME = exports.invalidParameter = exports.TrezorError = void 0;

class TrezorError extends Error {
  constructor(code, message) {
    super(message);
    this.code = code;
    this.message = message;
  }

}

exports.TrezorError = TrezorError;

const invalidParameter = message => {
  return new TrezorError('Connect_InvalidParameter', message);
}; // level 100 error during initialization


exports.invalidParameter = invalidParameter;
const NO_IFRAME = new TrezorError(100, 'TrezorConnect not yet initialized');
exports.NO_IFRAME = NO_IFRAME;
const IFRAME_BLOCKED = new TrezorError('iframe_blocked', 'TrezorConnect iframe was blocked');
exports.IFRAME_BLOCKED = IFRAME_BLOCKED;
const IFRAME_INITIALIZED = new TrezorError(101, 'TrezorConnect has been already initialized');
exports.IFRAME_INITIALIZED = IFRAME_INITIALIZED;
const IFRAME_TIMEOUT = new TrezorError(102, 'Iframe timeout');
exports.IFRAME_TIMEOUT = IFRAME_TIMEOUT;
const POPUP_TIMEOUT = new TrezorError(103, 'Popup timeout');
exports.POPUP_TIMEOUT = POPUP_TIMEOUT;
const BROWSER_NOT_SUPPORTED = new TrezorError(104, 'Browser not supported');
exports.BROWSER_NOT_SUPPORTED = BROWSER_NOT_SUPPORTED;
const MANIFEST_NOT_SET = new TrezorError(105, 'Manifest not set. Read more at https://github.com/trezor/connect/blob/develop/docs/index.md');
exports.MANIFEST_NOT_SET = MANIFEST_NOT_SET;
const MANAGEMENT_NOT_ALLOWED = new TrezorError(105, 'Management method not allowed for this configuration');
exports.MANAGEMENT_NOT_ALLOWED = MANAGEMENT_NOT_ALLOWED;
const NO_TRANSPORT = new TrezorError(500, 'Transport is missing');
exports.NO_TRANSPORT = NO_TRANSPORT;
const WRONG_TRANSPORT_CONFIG = new TrezorError(5002, 'Wrong config response'); // config_signed

exports.WRONG_TRANSPORT_CONFIG = WRONG_TRANSPORT_CONFIG;
const DEVICE_NOT_FOUND = new TrezorError(501, 'Device not found'); // export const DEVICE_CALL_IN_PROGRESS: TrezorError = new TrezorError(502, "Device call in progress.");

exports.DEVICE_NOT_FOUND = DEVICE_NOT_FOUND;
const DEVICE_CALL_IN_PROGRESS = new TrezorError(503, 'Device call in progress');
exports.DEVICE_CALL_IN_PROGRESS = DEVICE_CALL_IN_PROGRESS;
const INVALID_PARAMETERS = new TrezorError(504, 'Invalid parameters');
exports.INVALID_PARAMETERS = INVALID_PARAMETERS;
const POPUP_CLOSED = new Error('Popup closed');
exports.POPUP_CLOSED = POPUP_CLOSED;
const PERMISSIONS_NOT_GRANTED = new TrezorError(403, 'Permissions not granted');
exports.PERMISSIONS_NOT_GRANTED = PERMISSIONS_NOT_GRANTED;
const DEVICE_USED_ELSEWHERE = new TrezorError(700, 'Device is used in another window');
exports.DEVICE_USED_ELSEWHERE = DEVICE_USED_ELSEWHERE;
const INITIALIZATION_FAILED = new TrezorError('Failure_Initialize', 'Initialization failed');
exports.INITIALIZATION_FAILED = INITIALIZATION_FAILED;
const CALL_OVERRIDE = new TrezorError('Failure_ActionOverride', 'override');
exports.CALL_OVERRIDE = CALL_OVERRIDE;
const INVALID_STATE = new TrezorError('Failure_PassphraseState', 'Passphrase is incorrect'); // a slight hack
// this error string is hard-coded
// in both bridge and extension

exports.INVALID_STATE = INVALID_STATE;
const WRONG_PREVIOUS_SESSION_ERROR_MESSAGE = 'wrong previous session';
exports.WRONG_PREVIOUS_SESSION_ERROR_MESSAGE = WRONG_PREVIOUS_SESSION_ERROR_MESSAGE;
const INVALID_PIN_ERROR_MESSAGE = 'PIN invalid';
exports.INVALID_PIN_ERROR_MESSAGE = INVALID_PIN_ERROR_MESSAGE;
const WEBUSB_ERROR_MESSAGE = 'NetworkError: Unable to claim interface.'; // BlockBook

exports.WEBUSB_ERROR_MESSAGE = WEBUSB_ERROR_MESSAGE;

const backendNotSupported = coinName => {
  return new TrezorError('backend_error', `BlockchainLink support not found for ${coinName}`);
};

exports.backendNotSupported = backendNotSupported;
const BACKEND_NO_URL = new TrezorError('Backend_init', 'Url not found');
exports.BACKEND_NO_URL = BACKEND_NO_URL;
const NO_COIN_INFO = invalidParameter('Coin not found.');
exports.NO_COIN_INFO = NO_COIN_INFO;