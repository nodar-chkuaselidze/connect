"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

exports.__esModule = true;
exports.btckb2satoshib = exports.formatTime = exports.formatAmountOld = exports.formatAmount = void 0;

var _bignumber = _interopRequireDefault(require("bignumber.js"));

const currencyUnits = 'btc';

const formatAmount = (n, coinInfo) => {
  return new _bignumber.default(n).div(10 ** coinInfo.decimals).toString(10) + ' ' + coinInfo.shortcut;
};

exports.formatAmount = formatAmount;

const formatAmountOld = (n, coinInfo) => {
  const amount = n / 1e8; // if (coinInfo.isBitcoin && currencyUnits === 'mbtc' && amount <= 0.1 && n !== 0) {

  if (currencyUnits === 'mbtc' && amount <= 0.1 && n !== 0) {
    const s = (n / 1e5).toString();
    return `${s} mBTC`;
  }

  const s = amount.toString();
  return `${s} ${coinInfo.shortcut}`;
};

exports.formatAmountOld = formatAmountOld;

const formatTime = n => {
  const hours = Math.floor(n / 60);
  const minutes = n % 60;
  if (!n) return 'No time estimate';
  let res = '';

  if (hours !== 0) {
    res += hours + ' hour';

    if (hours > 1) {
      res += 's';
    }

    res += ' ';
  }

  if (minutes !== 0) {
    res += minutes + ' minutes';
  }

  return res;
};

exports.formatTime = formatTime;

const btckb2satoshib = n => {
  return new _bignumber.default(n).times(1e5).toFixed(0, _bignumber.default.ROUND_HALF_UP);
};

exports.btckb2satoshib = btckb2satoshib;