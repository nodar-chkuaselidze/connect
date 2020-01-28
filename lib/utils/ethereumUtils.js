"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

exports.__esModule = true;
exports.getNetworkLabel = exports.toChecksumAddress = void 0;

var _keccak = _interopRequireDefault(require("keccak"));

var _formatUtils = require("./formatUtils");

const toChecksumAddress = (address, network) => {
  if ((0, _formatUtils.hasHexPrefix)(address)) return address;
  let clean = (0, _formatUtils.stripHexPrefix)(address); // different checksum for RSK

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
};

exports.getNetworkLabel = getNetworkLabel;