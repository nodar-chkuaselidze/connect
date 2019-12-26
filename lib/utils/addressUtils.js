"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

exports.__esModule = true;
exports.getAddressHash = exports.getAddressScriptType = exports.isScriptHash = exports.isValidAddress = void 0;

var _utxoLib = require("@trezor/utxo-lib");

var _bchaddrjs = _interopRequireDefault(require("bchaddrjs"));

// Base58
const isValidBase58Address = (address, network) => {
  try {
    const decoded = _utxoLib.address.fromBase58Check(address);

    if (decoded.version !== network.pubKeyHash && decoded.version !== network.scriptHash) {
      return false;
    }
  } catch (e) {
    return false;
  }

  return true;
}; // segwit native


const isValidBech32Address = (address, network) => {
  try {
    const decoded = _utxoLib.address.fromBech32(address);

    if (decoded.version !== 0 || decoded.prefix !== network.bech32) {
      return false;
    }
  } catch (e) {
    return false;
  }

  return true;
}; // BCH cashaddress


const isValidCashAddress = address => {
  try {
    return _bchaddrjs.default.isCashAddress(address);
  } catch (err) {
    return false;
  }
};

const isValidAddress = (address, coinInfo) => {
  if (coinInfo.cashAddrPrefix) {
    return isValidCashAddress(address);
  } else {
    return isValidBase58Address(address, coinInfo.network) || isValidBech32Address(address, coinInfo.network);
  }
};

exports.isValidAddress = isValidAddress;

const isBech32 = address => {
  try {
    _utxoLib.address.fromBech32(address);

    return true;
  } catch (e) {
    return false;
  }
};

const isScriptHash = (address, coinInfo) => {
  if (!isBech32(address)) {
    // Cashaddr format (with prefix) is neither base58 nor bech32, so it would fail
    // in @trezor/utxo-lib. For this reason, we use legacy format here
    if (coinInfo.cashAddrPrefix) {
      address = _bchaddrjs.default.toLegacyAddress(address);
    }

    const decoded = _utxoLib.address.fromBase58Check(address);

    if (decoded.version === coinInfo.network.pubKeyHash) {
      return false;
    }

    if (decoded.version === coinInfo.network.scriptHash) {
      return true;
    }
  } else {
    const decoded = _utxoLib.address.fromBech32(address);

    if (decoded.data.length === 20) {
      return false;
    }

    if (decoded.data.length === 32) {
      return true;
    }
  }

  throw new Error('Unknown address type.');
};

exports.isScriptHash = isScriptHash;

const getAddressScriptType = (address, coinInfo) => {
  if (isBech32(address)) return 'PAYTOWITNESS';
  return isScriptHash(address, coinInfo) ? 'PAYTOSCRIPTHASH' : 'PAYTOADDRESS';
};

exports.getAddressScriptType = getAddressScriptType;

const getAddressHash = address => {
  if (isBech32(address)) return _utxoLib.address.fromBech32(address).data;
  if (isValidCashAddress(address)) return _utxoLib.address.fromBase58Check(_bchaddrjs.default.toLegacyAddress(address)).hash;
  return _utxoLib.address.fromBase58Check(address).hash;
};

exports.getAddressHash = getAddressHash;