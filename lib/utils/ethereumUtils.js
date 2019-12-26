"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

exports.__esModule = true;
exports.messageToHex = exports.getNetworkLabel = exports.toChecksumAddress = exports.stripHexPrefix = void 0;

var _keccak = _interopRequireDefault(require("keccak"));

const hasHexPrefix = str => {
  return str.slice(0, 2).toLowerCase() === '0x';
};

const stripHexPrefix = str => {
  return hasHexPrefix(str) ? str.slice(2) : str;
};

exports.stripHexPrefix = stripHexPrefix;

const toChecksumAddress = (address, network) => {
  if (hasHexPrefix(address)) return address;
  let clean = stripHexPrefix(address); // different checksum for RSK

  if (network && network.rskip60) clean = network.chainId + '0x' + address;
  const hash = (0, _keccak.default)('keccak256').update(clean).digest('hex');
  let response = '0x';

  for (let i = 0; i < address.length; i++) {
    if (parseInt(hash[i], 16) >= 8) {
      response += address[i].toUpperCase();
    } else {
      response += address[i];
    }
  }

  return response;
};

exports.toChecksumAddress = toChecksumAddress;

const getNetworkLabel = (label, network) => {
  if (network) {
    const name = network.name.toLowerCase().indexOf('testnet') >= 0 ? 'Testnet' : network.name;
    return label.replace('#NETWORK', name);
  }

  return label.replace('#NETWORK', '');
}; // from (isHexString) https://github.com/ethjs/ethjs-util/blob/master/src/index.js


exports.getNetworkLabel = getNetworkLabel;

const isHexString = (value, length) => {
  if (typeof value !== 'string' || !value.match(/^(0x|0X)?[0-9A-Fa-f]*$/)) {
    return false;
  }

  if (length && value.length !== 2 + 2 * length) {
    return false;
  }

  return true;
}; // from (toBuffer) https://github.com/ethereumjs/ethereumjs-util/blob/master/index.js


const messageToHex = message => {
  let buffer;

  if (isHexString(message)) {
    let clean = stripHexPrefix(message); // pad left even

    if (clean.length % 2 !== 0) {
      clean = '0' + clean;
    }

    buffer = Buffer.from(clean, 'hex');
  } else {
    buffer = Buffer.from(message);
  }

  return buffer.toString('hex');
};

exports.messageToHex = messageToHex;