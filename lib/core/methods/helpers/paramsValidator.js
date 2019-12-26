"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

exports.__esModule = true;
exports.getFirmwareRange = exports.validateCoinPath = exports.validateParams = void 0;

var _bignumber = _interopRequireDefault(require("bignumber.js"));

var _semverCompare = _interopRequireDefault(require("semver-compare"));

var _errors = require("../../../constants/errors");

var _pathUtils = require("../../../utils/pathUtils");

var _DataManager = _interopRequireDefault(require("../../../data/DataManager"));

const validateParams = (values, fields) => {
  fields.forEach(field => {
    if (Object.prototype.hasOwnProperty.call(values, field.name)) {
      const value = values[field.name];

      if (field.type) {
        if (field.type === 'array') {
          if (!Array.isArray(value)) {
            // invalid type
            throw (0, _errors.invalidParameter)(`Parameter "${field.name}" has invalid type. "${field.type}" expected.`);
          } else if (!field.allowEmpty && value.length < 1) {
            throw (0, _errors.invalidParameter)(`Parameter "${field.name}" is empty.`);
          }
        } else if (field.type === 'amount') {
          if (typeof value !== 'string') {
            throw (0, _errors.invalidParameter)(`Parameter "${field.name}" has invalid type. "string" expected.`);
          }

          try {
            const bn = new _bignumber.default(value);

            if (bn.toFixed(0) !== value) {
              throw new Error('');
            }
          } catch (error) {
            throw (0, _errors.invalidParameter)(`Parameter "${field.name}" has invalid value "${value}". Integer representation expected.`);
          }
        } else if (field.type === 'buffer') {
          if (typeof value === 'undefined' || typeof value.constructor.isBuffer === 'function' && value.constructor.isBuffer(value)) {
            throw (0, _errors.invalidParameter)(`Parameter "${field.name}" has invalid type. "buffer" expected.`);
          }
        } else if (typeof value !== field.type) {
          // invalid type
          throw (0, _errors.invalidParameter)(`Parameter "${field.name}" has invalid type. "${field.type}" expected.`);
        }
      }
    } else if (field.obligatory) {
      // not found
      throw (0, _errors.invalidParameter)(`Parameter "${field.name}" is missing.`);
    }
  });
};

exports.validateParams = validateParams;

const validateCoinPath = (coinInfo, path) => {
  if (coinInfo && coinInfo.slip44 !== (0, _pathUtils.fromHardened)(path[1])) {
    throw (0, _errors.invalidParameter)('Parameters "path" and "coin" do not match.');
  }
};

exports.validateCoinPath = validateCoinPath;

const getFirmwareRange = (method, coinInfo, currentRange) => {
  const current = JSON.parse(JSON.stringify(currentRange)); // set minimum required firmware from coins.json (coinInfo)

  if (coinInfo) {
    if (!coinInfo.support || typeof coinInfo.support.trezor1 !== 'string') {
      current['1'].min = '0';
    } else if ((0, _semverCompare.default)(coinInfo.support.trezor1, current['1'].min) > 0) {
      current['1'].min = coinInfo.support.trezor1;
    }

    if (!coinInfo.support || typeof coinInfo.support.trezor2 !== 'string') {
      current['2'].min = '0';
    } else if ((0, _semverCompare.default)(coinInfo.support.trezor2, current['2'].min) > 0) {
      current['2'].min = coinInfo.support.trezor2;
    }
  }

  const coinType = coinInfo ? coinInfo.type : null;
  const shortcut = coinInfo ? coinInfo.shortcut.toLowerCase() : null; // find firmware range in config.json

  const {
    supportedFirmware
  } = _DataManager.default.getConfig();

  const range = supportedFirmware.find(c => c.coinType === coinType || Array.isArray(c.coin) && c.coin.includes(shortcut) || typeof c.coin === 'string' && c.coin === shortcut) || supportedFirmware.find(c => !c.coinType && !c.coin && c.excludedMethods && c.excludedMethods.includes(method));

  if (range) {
    if (range.excludedMethods && !range.excludedMethods.includes(method)) {
      // not in range. do not change default range
      return current;
    }

    const {
      min,
      max
    } = range; // override defaults

    if (min) {
      if (current['1'].min === '0' || (0, _semverCompare.default)(current['1'].min, min[0]) < 0) {
        current['1'].min = min[0];
      }

      if (current['2'].min === '0' || (0, _semverCompare.default)(current['2'].min, min[1]) < 0) {
        current['2'].min = min[1];
      }
    }

    if (max) {
      if (current['1'].max === '0' || (0, _semverCompare.default)(current['1'].max, max[0]) < 0) {
        current['1'].max = max[0];
      }

      if (current['2'].max === '0' || (0, _semverCompare.default)(current['2'].max, max[1]) < 0) {
        current['2'].max = max[1];
      }
    }
  }

  return current;
};

exports.getFirmwareRange = getFirmwareRange;