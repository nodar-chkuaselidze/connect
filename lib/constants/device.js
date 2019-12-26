"use strict";

exports.__esModule = true;
exports.UNREADABLE = exports.WAIT_FOR_SELECTION = exports.WORD = exports.PASSPHRASE_ON_DEVICE = exports.PASSPHRASE = exports.PIN = exports.BUTTON = exports.LOADING = exports.USED_ELSEWHERE = exports.RELEASED = exports.ACQUIRED = exports.RELEASE = exports.ACQUIRE = exports.CHANGED = exports.DISCONNECT = exports.CONNECT_UNACQUIRED = exports.CONNECT = void 0;
// device list events
const CONNECT = 'device-connect';
exports.CONNECT = CONNECT;
const CONNECT_UNACQUIRED = 'device-connect_unacquired';
exports.CONNECT_UNACQUIRED = CONNECT_UNACQUIRED;
const DISCONNECT = 'device-disconnect';
exports.DISCONNECT = DISCONNECT;
const CHANGED = 'device-changed';
exports.CHANGED = CHANGED;
const ACQUIRE = 'device-acquire';
exports.ACQUIRE = ACQUIRE;
const RELEASE = 'device-release';
exports.RELEASE = RELEASE;
const ACQUIRED = 'device-acquired';
exports.ACQUIRED = ACQUIRED;
const RELEASED = 'device-released';
exports.RELEASED = RELEASED;
const USED_ELSEWHERE = 'device-used_elsewhere';
exports.USED_ELSEWHERE = USED_ELSEWHERE;
const LOADING = 'device-loading'; // trezor-link events in protobuf format

exports.LOADING = LOADING;
const BUTTON = 'button';
exports.BUTTON = BUTTON;
const PIN = 'pin';
exports.PIN = PIN;
const PASSPHRASE = 'passphrase';
exports.PASSPHRASE = PASSPHRASE;
const PASSPHRASE_ON_DEVICE = 'passphrase_on_device';
exports.PASSPHRASE_ON_DEVICE = PASSPHRASE_ON_DEVICE;
const WORD = 'word'; // custom

exports.WORD = WORD;
const WAIT_FOR_SELECTION = 'device-wait_for_selection'; // this string has different prefix than other constants and it's used as device path

exports.WAIT_FOR_SELECTION = WAIT_FOR_SELECTION;
const UNREADABLE = 'unreadable-device';
exports.UNREADABLE = UNREADABLE;