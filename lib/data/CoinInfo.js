"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

exports.__esModule = true;
exports.cloneCoinInfo = cloneCoinInfo;
exports.getUniqueNetworks = exports.parseCoinsJson = exports.getCoinName = exports.getCoinInfo = exports.getCoinInfoByHash = exports.fixCoinInfoNetwork = exports.getBech32Network = exports.getSegwitNetwork = exports.getMiscNetwork = exports.getEthereumNetwork = exports.getBitcoinNetwork = void 0;

var _defineProperty2 = _interopRequireDefault(require("@babel/runtime/helpers/defineProperty"));

var _pathUtils = require("../utils/pathUtils");

function ownKeys(object, enumerableOnly) { var keys = Object.keys(object); if (Object.getOwnPropertySymbols) { var symbols = Object.getOwnPropertySymbols(object); if (enumerableOnly) symbols = symbols.filter(function (sym) { return Object.getOwnPropertyDescriptor(object, sym).enumerable; }); keys.push.apply(keys, symbols); } return keys; }

function _objectSpread(target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i] != null ? arguments[i] : {}; if (i % 2) { ownKeys(Object(source), true).forEach(function (key) { (0, _defineProperty2.default)(target, key, source[key]); }); } else if (Object.getOwnPropertyDescriptors) { Object.defineProperties(target, Object.getOwnPropertyDescriptors(source)); } else { ownKeys(Object(source)).forEach(function (key) { Object.defineProperty(target, key, Object.getOwnPropertyDescriptor(source, key)); }); } } return target; }

const bitcoinNetworks = [];
const ethereumNetworks = [];
const miscNetworks = [];

function cloneCoinInfo(info) {
  const jsonString = JSON.stringify(info);

  if (jsonString === undefined) {
    // jsonString === undefined IF and only IF obj === undefined
    // therefore no need to clone
    return info;
  }

  return JSON.parse(jsonString);
}

const getBitcoinNetwork = pathOrName => {
  const networks = cloneCoinInfo(bitcoinNetworks);

  if (typeof pathOrName === 'string') {
    const name = pathOrName.toLowerCase();
    return networks.find(n => n.name.toLowerCase() === name || n.shortcut.toLowerCase() === name || n.label.toLowerCase() === name);
  } else {
    const slip44 = (0, _pathUtils.fromHardened)(pathOrName[1]);
    return networks.find(n => n.slip44 === slip44);
  }
};

exports.getBitcoinNetwork = getBitcoinNetwork;

const getEthereumNetwork = pathOrName => {
  const networks = cloneCoinInfo(ethereumNetworks);

  if (typeof pathOrName === 'string') {
    const name = pathOrName.toLowerCase();
    return networks.find(n => n.name.toLowerCase() === name || n.shortcut.toLowerCase() === name);
  } else {
    const slip44 = (0, _pathUtils.fromHardened)(pathOrName[1]);
    return networks.find(n => n.slip44 === slip44);
  }
};

exports.getEthereumNetwork = getEthereumNetwork;

const getMiscNetwork = pathOrName => {
  const networks = cloneCoinInfo(miscNetworks);

  if (typeof pathOrName === 'string') {
    const name = pathOrName.toLowerCase();
    return networks.find(n => n.name.toLowerCase() === name || n.shortcut.toLowerCase() === name);
  } else {
    const slip44 = (0, _pathUtils.fromHardened)(pathOrName[1]);
    return networks.find(n => n.slip44 === slip44);
  }
};
/*
* Bitcoin networks
*/


exports.getMiscNetwork = getMiscNetwork;

const getSegwitNetwork = coin => {
  if (coin.segwit && typeof coin.xPubMagicSegwit === 'number') {
    return _objectSpread({}, coin.network, {
      bip32: _objectSpread({}, coin.network.bip32, {
        public: coin.xPubMagicSegwit
      })
    });
  }

  return null;
};

exports.getSegwitNetwork = getSegwitNetwork;

const getBech32Network = coin => {
  if (coin.segwit && typeof coin.xPubMagicSegwitNative === 'number') {
    return _objectSpread({}, coin.network, {
      bip32: _objectSpread({}, coin.network.bip32, {
        public: coin.xPubMagicSegwitNative
      })
    });
  }

  return null;
}; // fix coinInfo network values from path (segwit/legacy)


exports.getBech32Network = getBech32Network;

const fixCoinInfoNetwork = (ci, path) => {
  const coinInfo = cloneCoinInfo(ci);

  if (path[0] === (0, _pathUtils.toHardened)(84)) {
    const bech32Network = getBech32Network(coinInfo);

    if (bech32Network) {
      coinInfo.network = bech32Network;
    }
  } else if (path[0] === (0, _pathUtils.toHardened)(49)) {
    const segwitNetwork = getSegwitNetwork(coinInfo);

    if (segwitNetwork) {
      coinInfo.network = segwitNetwork;
    }
  } else {
    coinInfo.segwit = false;
  }

  return coinInfo;
};

exports.fixCoinInfoNetwork = fixCoinInfoNetwork;

const detectBtcVersion = data => {
  if (data.subversion == null) {
    return 'btc';
  }

  if (data.subversion.startsWith('/Bitcoin ABC')) {
    return 'bch';
  }

  if (data.subversion.startsWith('/Bitcoin Gold')) {
    return 'btg';
  }

  return 'btc';
};

const getCoinInfoByHash = (hash, networkInfo) => {
  const networks = cloneCoinInfo(bitcoinNetworks);
  const result = networks.find(info => hash.toLowerCase() === info.hashGenesisBlock.toLowerCase());

  if (!result) {
    throw new Error('Coin info not found for hash: ' + hash + ' ' + networkInfo.hashGenesisBlock);
  }

  if (result.isBitcoin) {
    const btcVersion = detectBtcVersion(networkInfo);
    let fork;

    if (btcVersion === 'bch') {
      fork = networks.find(info => info.name === 'Bcash');
    } else if (btcVersion === 'btg') {
      fork = networks.find(info => info.name === 'Bgold');
    }

    if (fork) {
      return fork;
    } else {
      throw new Error('Coin info not found for hash: ' + hash + ' ' + networkInfo.hashGenesisBlock + ' BTC version:' + btcVersion);
    }
  }

  return result;
};

exports.getCoinInfoByHash = getCoinInfoByHash;

const getCoinInfo = currency => {
  let coinInfo = getBitcoinNetwork(currency);

  if (!coinInfo) {
    coinInfo = getEthereumNetwork(currency);
  }

  if (!coinInfo) {
    coinInfo = getMiscNetwork(currency);
  }

  return coinInfo;
};

exports.getCoinInfo = getCoinInfo;

const getCoinName = path => {
  const slip44 = (0, _pathUtils.fromHardened)(path[1]);

  for (const network of ethereumNetworks) {
    if (network.slip44 === slip44) {
      return network.name;
    }
  }

  return 'Unknown coin';
};

exports.getCoinName = getCoinName;

const parseBitcoinNetworksJson = json => {
  const coinsObject = json;
  Object.keys(coinsObject).forEach(key => {
    const coin = coinsObject[key];
    const shortcut = coin.coin_shortcut;
    const isBitcoin = shortcut === 'BTC' || shortcut === 'TEST';
    const hasTimestamp = shortcut === 'CPC' || shortcut === 'PPC' || shortcut === 'tPPC';
    const network = {
      messagePrefix: coin.signed_message_header,
      bech32: coin.bech32_prefix,
      bip32: {
        public: coin.xpub_magic,
        private: coin.xprv_magic
      },
      pubKeyHash: coin.address_type,
      scriptHash: coin.address_type_p2sh,
      wif: 0x80,
      // doesn't matter, for type correctness
      dustThreshold: 0,
      // doesn't matter, for type correctness,
      coin: shortcut.toLowerCase(),
      consensusBranchId: coin.consensus_branch_id // zcash, komodo

    };
    const blockchainLink = Array.isArray(coin.blockbook) && coin.blockbook.length > 0 ? {
      type: 'blockbook',
      url: coin.blockbook
    } : undefined;
    bitcoinNetworks.push({
      type: 'bitcoin',
      // address_type in Network
      // address_type_p2sh in Network
      // bech32_prefix in Network
      // consensus_branch_id in Network
      // bip115: not used
      // bitcore: not used,
      // blockbook: not used,
      blockchainLink,
      blocktime: Math.round(coin.blocktime_seconds / 60),
      cashAddrPrefix: coin.cashaddr_prefix,
      label: coin.coin_label,
      name: coin.coin_name,
      shortcut,
      // cooldown not used
      curveName: coin.curve_name,
      // decred not used
      defaultFees: coin.default_fee_b,
      dustLimit: coin.dust_limit,
      forceBip143: coin.force_bip143,
      forkid: coin.fork_id,
      // github not used
      hashGenesisBlock: coin.hash_genesis_block,
      // key not used
      // maintainer not used
      maxAddressLength: coin.max_address_length,
      maxFeeSatoshiKb: coin.maxfee_kb,
      minAddressLength: coin.min_address_length,
      minFeeSatoshiKb: coin.minfee_kb,
      // name: same as coin_label
      segwit: coin.segwit,
      // signed_message_header in Network
      slip44: coin.slip44,
      support: coin.support,
      // uri_prefix not used
      // version_group_id not used
      // website not used
      // xprv_magic in Network
      xPubMagic: coin.xpub_magic,
      xPubMagicSegwitNative: coin.xpub_magic_segwit_native,
      xPubMagicSegwit: coin.xpub_magic_segwit_p2sh,
      // custom
      network,
      // bitcoinjs network
      isBitcoin,
      hasTimestamp,
      maxFee: Math.round(coin.maxfee_kb / 1000),
      minFee: Math.round(coin.minfee_kb / 1000),
      // used in backend ?
      blocks: Math.round(coin.blocktime_seconds / 60),
      decimals: coin.decimals
    });
  });
};

const parseEthereumNetworksJson = json => {
  const networksObject = json;
  Object.keys(networksObject).forEach(key => {
    const network = networksObject[key];
    const blockchainLink = Array.isArray(network.blockbook) && network.blockbook.length > 0 ? {
      type: 'blockbook',
      url: network.blockbook
    } : undefined;
    ethereumNetworks.push({
      type: 'ethereum',
      blockchainLink,
      blocktime: Math.round(network.blocktime_seconds / 60),
      chain: network.chain,
      chainId: network.chain_id,
      // key not used
      defaultFees: [{
        label: 'normal',
        feePerUnit: '5000000000',
        feeLimit: '21000'
      }],
      minFee: 1,
      maxFee: 10000,
      label: network.name,
      name: network.name,
      shortcut: network.shortcut,
      rskip60: network.rskip60,
      slip44: network.slip44,
      support: network.support,
      // url not used
      network: undefined,
      decimals: 16
    });
  });
};

const parseMiscNetworksJSON = json => {
  const networksObject = json;
  Object.keys(networksObject).forEach(key => {
    const network = networksObject[key];
    let minFee = 1;
    let maxFee = 1;
    const shortcut = network.shortcut.toLowerCase();

    if (shortcut === 'xrp' || shortcut === 'txrp') {
      minFee = 10;
      maxFee = 10000;
    }

    miscNetworks.push({
      type: 'misc',
      blockchainLink: network.blockchain_link,
      blocktime: 0,
      curve: network.curve,
      defaultFees: {
        'Normal': 1
      },
      minFee,
      maxFee,
      label: network.name,
      name: network.name,
      shortcut: network.shortcut,
      slip44: network.slip44,
      support: network.support,
      network: undefined,
      decimals: network.decimals
    });
  });
};

const parseCoinsJson = json => {
  const coinsObject = json;
  Object.keys(coinsObject).forEach(key => {
    switch (key) {
      case 'bitcoin':
        return parseBitcoinNetworksJson(coinsObject[key]);

      case 'eth':
        return parseEthereumNetworksJson(coinsObject[key]);

      case 'misc':
      case 'nem':
        return parseMiscNetworksJSON(coinsObject[key]);
    }
  });
};

exports.parseCoinsJson = parseCoinsJson;

const getUniqueNetworks = networks => {
  return networks.reduce((result, info) => {
    if (!info || result.find(i => i.shortcut === info.shortcut)) return result;
    return result.concat(info);
  }, []);
};

exports.getUniqueNetworks = getUniqueNetworks;