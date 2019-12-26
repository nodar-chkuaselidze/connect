"use strict";

exports.__esModule = true;
exports.load = exports.save = exports.CONFIRMATION_KEY = exports.PERMISSIONS_KEY = exports.BROWSER_KEY = void 0;
const BROWSER_KEY = 'trezorconnect_browser';
exports.BROWSER_KEY = BROWSER_KEY;
const PERMISSIONS_KEY = 'trezorconnect_permissions';
exports.PERMISSIONS_KEY = PERMISSIONS_KEY;
const CONFIRMATION_KEY = 'trezorconnect_confirmations';
exports.CONFIRMATION_KEY = CONFIRMATION_KEY;
const _storage = {};

const save = (storageKey, value, temporary = false) => {
  if (temporary) {
    _storage[storageKey] = JSON.stringify(value);
    return;
  }

  try {
    window.localStorage[storageKey] = JSON.stringify(value);
    return;
  } catch (ignore) {} // empty
  // Fallback cookie


  try {
    window.document.cookie = encodeURIComponent(storageKey) + '=' + JSON.stringify(value) + ';';
  } catch (ignore) {// empty
  }
};

exports.save = save;

const load = (storageKey, temporary = false) => {
  let value;

  if (temporary) {
    value = _storage[storageKey];
    return value ? JSON.parse(value) : null;
  }

  try {
    value = window.localStorage[storageKey];
  } catch (ignore) {} // empty
  // Fallback cookie if local storage gives us nothing


  if (typeof value === 'undefined') {
    try {
      const cookie = window.document.cookie;
      const location = cookie.indexOf(encodeURIComponent(storageKey) + '=');

      if (location !== -1) {
        const matches = /^([^;]+)/.exec(cookie.slice(location));

        if (matches) {
          value = matches[1];
        }
      }
    } catch (ignore) {// empty
    }
  }

  return value ? JSON.parse(value) : null;
};

exports.load = load;