"use strict";

exports.__esModule = true;
exports.getLabel = exports.getPublicKeyLabel = exports.getAccountLabel = exports.getIndexFromPath = exports.getPathFromIndex = exports.getSerializedPath = exports.validatePath = exports.getOutputScriptType = exports.getScriptType = exports.isBech32Path = exports.isSegwitPath = exports.isMultisigPath = exports.getHDPath = exports.fromHardened = exports.toHardened = exports.HD_HARDENED = void 0;

var _CoinInfo = require("../data/CoinInfo");

var _errors = require("../constants/errors");

const HD_HARDENED = 0x80000000;
exports.HD_HARDENED = HD_HARDENED;

const toHardened = n => (n | HD_HARDENED) >>> 0;

exports.toHardened = toHardened;

const fromHardened = n => (n & ~HD_HARDENED) >>> 0;

exports.fromHardened = fromHardened;
const PATH_NOT_VALID = (0, _errors.invalidParameter)('Not a valid path.');
const PATH_NEGATIVE_VALUES = (0, _errors.invalidParameter)('Path cannot contain negative values.');

const getHDPath = path => {
  const parts = path.toLowerCase().split('/');
  if (parts[0] !== 'm') throw PATH_NOT_VALID;
  return parts.filter(p => p !== 'm' && p !== '').map(p => {
    let hardened = false;

    if (p.substr(p.length - 1) === "'") {
      hardened = true;
      p = p.substr(0, p.length - 1);
    }

    let n = parseInt(p);

    if (isNaN(n)) {
      throw PATH_NOT_VALID;
    } else if (n < 0) {
      throw PATH_NEGATIVE_VALUES;
    }

    if (hardened) {
      // hardened index
      n = toHardened(n);
    }

    return n;
  });
};

exports.getHDPath = getHDPath;

const isMultisigPath = path => {
  return Array.isArray(path) && path[0] === toHardened(48);
};

exports.isMultisigPath = isMultisigPath;

const isSegwitPath = path => {
  return Array.isArray(path) && path[0] === toHardened(49);
};

exports.isSegwitPath = isSegwitPath;

const isBech32Path = path => {
  return Array.isArray(path) && path[0] === toHardened(84);
};

exports.isBech32Path = isBech32Path;

const getScriptType = path => {
  if (!Array.isArray(path) || path.length < 1) return 'SPENDADDRESS';
  const p1 = fromHardened(path[0]);

  switch (p1) {
    case 48:
      return 'SPENDMULTISIG';

    case 49:
      return 'SPENDP2SHWITNESS';

    case 84:
      return 'SPENDWITNESS';

    default:
      return 'SPENDADDRESS';
  }
};

exports.getScriptType = getScriptType;

const getOutputScriptType = path => {
  if (!Array.isArray(path) || path.length < 1) return 'PAYTOADDRESS';
  const p = fromHardened(path[0]);

  switch (p) {
    case 48:
      return 'PAYTOMULTISIG';

    case 49:
      return 'PAYTOP2SHWITNESS';

    case 84:
      return 'PAYTOWITNESS';

    default:
      return 'PAYTOADDRESS';
  }
};

exports.getOutputScriptType = getOutputScriptType;

const validatePath = (path, length = 0, base = false) => {
  let valid;

  if (typeof path === 'string') {
    valid = getHDPath(path);
  } else if (Array.isArray(path)) {
    valid = path.map(p => {
      const n = parseInt(p);

      if (isNaN(n)) {
        throw PATH_NOT_VALID;
      } else if (n < 0) {
        throw PATH_NEGATIVE_VALUES;
      }

      return n;
    });
  }

  if (!valid) throw PATH_NOT_VALID;
  if (length > 0 && valid.length < length) throw PATH_NOT_VALID;
  return base ? valid.splice(0, 3) : valid;
};

exports.validatePath = validatePath;

const getSerializedPath = path => {
  return 'm/' + path.map(i => {
    const s = (i & ~HD_HARDENED).toString();

    if (i & HD_HARDENED) {
      return s + "'";
    } else {
      return s;
    }
  }).join('/');
};

exports.getSerializedPath = getSerializedPath;

const getPathFromIndex = (bip44purpose, bip44cointype, index) => {
  return [toHardened(bip44purpose), toHardened(bip44cointype), toHardened(index)];
};

exports.getPathFromIndex = getPathFromIndex;

const getIndexFromPath = path => {
  if (path.length < 3) {
    throw (0, _errors.invalidParameter)(`getIndexFromPath: invalid path length ${path.toString()}`);
  }

  return fromHardened(path[2]);
};

exports.getIndexFromPath = getIndexFromPath;

const getAccountLabel = (path, coinInfo) => {
  const coinLabel = coinInfo.label;
  const p1 = fromHardened(path[0]);
  const account = fromHardened(path[2]);
  const realAccountId = account + 1;
  const prefix = 'Export info of';
  let accountType = '';

  if (p1 === 48) {
    accountType = `${coinLabel} multisig`;
  } else if (p1 === 44 && coinInfo.segwit) {
    accountType = `${coinLabel} legacy`;
  } else {
    accountType = coinLabel;
  }

  return `${prefix} ${accountType} <span>account #${realAccountId}</span>`;
};

exports.getAccountLabel = getAccountLabel;

const getPublicKeyLabel = (path, coinInfo) => {
  let hasSegwit = false;
  let coinLabel = 'Unknown coin';

  if (coinInfo) {
    coinLabel = coinInfo.label;
    hasSegwit = coinInfo.segwit;
  } else {
    coinLabel = (0, _CoinInfo.getCoinName)(path);
  }

  const p1 = fromHardened(path[0]);
  let account = path.length >= 3 ? fromHardened(path[2]) : -1;
  let realAccountId = account + 1;
  let prefix = 'Export public key';
  let accountType = ''; // Copay id

  if (p1 === 45342) {
    const p2 = fromHardened(path[1]);
    account = fromHardened(path[3]);
    realAccountId = account + 1;
    prefix = 'Export Copay ID of';

    if (p2 === 48) {
      accountType = 'multisig';
    } else if (p2 === 44) {
      accountType = 'legacy';
    }
  } else if (p1 === 48) {
    accountType = `${coinLabel} multisig`;
  } else if (p1 === 44 && hasSegwit) {
    accountType = `${coinLabel} legacy`;
  } else if (p1 === 84 && hasSegwit) {
    accountType = `${coinLabel} native segwit`;
  } else {
    accountType = coinLabel;
  }

  if (realAccountId > 0) {
    return `${prefix} of ${accountType} <span>account #${realAccountId}</span>`;
  } else {
    return prefix;
  }
};

exports.getPublicKeyLabel = getPublicKeyLabel;

const getLabel = (label, coinInfo) => {
  if (coinInfo) {
    return label.replace('#NETWORK', coinInfo.label);
  }

  return label.replace('#NETWORK', '');
};

exports.getLabel = getLabel;