"use strict";

var _interopRequireWildcard = require("@babel/runtime/helpers/interopRequireWildcard");

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

exports.__esModule = true;
exports.default = void 0;

var _defineProperty2 = _interopRequireDefault(require("@babel/runtime/helpers/defineProperty"));

var DEVICE = _interopRequireWildcard(require("../constants/device"));

var _randombytes = _interopRequireDefault(require("randombytes"));

var bitcoin = _interopRequireWildcard(require("@trezor/utxo-lib"));

var hdnodeUtils = _interopRequireWildcard(require("../utils/hdnode"));

var _pathUtils = require("../utils/pathUtils");

var _accountUtils = require("../utils/accountUtils");

var _ethereumUtils = require("../utils/ethereumUtils");

var _promiseUtils = require("../utils/promiseUtils");

var _Device = _interopRequireDefault(require("./Device"));

var _CoinInfo = require("../data/CoinInfo");

var trezor = _interopRequireWildcard(require("../types/trezor"));

function ownKeys(object, enumerableOnly) { var keys = Object.keys(object); if (Object.getOwnPropertySymbols) { var symbols = Object.getOwnPropertySymbols(object); if (enumerableOnly) symbols = symbols.filter(function (sym) { return Object.getOwnPropertyDescriptor(object, sym).enumerable; }); keys.push.apply(keys, symbols); } return keys; }

function _objectSpread(target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i] != null ? arguments[i] : {}; if (i % 2) { ownKeys(Object(source), true).forEach(function (key) { (0, _defineProperty2.default)(target, key, source[key]); }); } else if (Object.getOwnPropertyDescriptors) { Object.defineProperties(target, Object.getOwnPropertyDescriptors(source)); } else { ownKeys(Object(source)).forEach(function (key) { Object.defineProperty(target, key, Object.getOwnPropertyDescriptor(source, key)); }); } } return target; }

function assertType(res, resType) {
  const splitResTypes = resType.split('|');

  if (!splitResTypes.includes(res.type)) {
    throw new TypeError(`Response of unexpected type: ${res.type}. Should be ${resType}`);
  }
}

function generateEntropy(len) {
  if (global.crypto || global.msCrypto) {
    return (0, _randombytes.default)(len);
  } else {
    throw new Error('Browser does not support crypto random');
  }
}

function filterForLog(type, msg) {
  const blacklist = {// PassphraseAck: {
    //     passphrase: '(redacted...)',
    // },
    // CipheredKeyValue: {
    //     value: '(redacted...)',
    // },
    // GetPublicKey: {
    //     address_n: '(redacted...)',
    // },
    // PublicKey: {
    //     node: '(redacted...)',
    //     xpub: '(redacted...)',
    // },
    // DecryptedMessage: {
    //     message: '(redacted...)',
    //     address: '(redacted...)',
    // },
  };

  if (type in blacklist) {
    return _objectSpread({}, msg, {}, blacklist[type]);
  } else {
    return msg;
  }
}

class DeviceCommands {
  constructor(device, transport, sessionId) {
    (0, _defineProperty2.default)(this, "callPromise", undefined);
    this.device = device;
    this.transport = transport;
    this.sessionId = sessionId;
    this.debug = false;
    this.disposed = false;
  }

  dispose() {
    this.disposed = true;
  }

  isDisposed() {
    return this.disposed;
  }

  async getPublicKey(address_n, coin_name, script_type) {
    const response = await this.typedCall('GetPublicKey', 'PublicKey', {
      address_n,
      coin_name,
      script_type
    });
    return response.message;
  } // Validation of xpub


  async getHDNode(path, coinInfo, validation = true) {
    if (!this.device.atLeast(['1.7.2', '2.0.10'])) {
      return await this.getBitcoinHDNode(path, coinInfo, validation);
    }

    if (!coinInfo) {
      return await this.getBitcoinHDNode(path, null, validation);
    }

    let network;

    if ((0, _pathUtils.isMultisigPath)(path)) {
      network = coinInfo.network;
    } else if ((0, _pathUtils.isSegwitPath)(path)) {
      network = (0, _CoinInfo.getSegwitNetwork)(coinInfo);
    } else if ((0, _pathUtils.isBech32Path)(path)) {
      network = (0, _CoinInfo.getBech32Network)(coinInfo);
    }

    let scriptType = (0, _pathUtils.getScriptType)(path);

    if (!network) {
      network = coinInfo.network;

      if (scriptType !== 'SPENDADDRESS') {
        scriptType = undefined;
      }
    }

    let publicKey;

    if (!validation) {
      publicKey = await this.getPublicKey(path, coinInfo.name, scriptType);
    } else {
      const suffix = 0;
      const childPath = path.concat([suffix]);
      const resKey = await this.getPublicKey(path, coinInfo.name, scriptType);
      const childKey = await this.getPublicKey(childPath, coinInfo.name, scriptType);
      publicKey = hdnodeUtils.xpubDerive(resKey, childKey, suffix, network, coinInfo.network);
    }

    const response = {
      path,
      serializedPath: (0, _pathUtils.getSerializedPath)(path),
      childNum: publicKey.node.child_num,
      xpub: publicKey.xpub,
      chainCode: publicKey.node.chain_code,
      publicKey: publicKey.node.public_key,
      fingerprint: publicKey.node.fingerprint,
      depth: publicKey.node.depth
    };

    if (network !== coinInfo.network) {
      response.xpubSegwit = response.xpub;
      response.xpub = hdnodeUtils.convertXpub(publicKey.xpub, network, coinInfo.network);
    }

    return response;
  } // deprecated
  // legacy method (below FW 1.7.2 & 2.0.10), remove it after next "required" FW update.
  // keys are exported in BTC format and converted to proper format in hdnodeUtils
  // old firmware didn't return keys with proper prefix (ypub, Ltub.. and so on)


  async getBitcoinHDNode(path, coinInfo, validation = true) {
    let publicKey;

    if (!validation) {
      publicKey = await this.getPublicKey(path, 'Bitcoin');
    } else {
      const suffix = 0;
      const childPath = path.concat([suffix]);
      const resKey = await this.getPublicKey(path, 'Bitcoin');
      const childKey = await this.getPublicKey(childPath, 'Bitcoin');
      publicKey = hdnodeUtils.xpubDerive(resKey, childKey, suffix);
    }

    const response = {
      path,
      serializedPath: (0, _pathUtils.getSerializedPath)(path),
      childNum: publicKey.node.child_num,
      xpub: coinInfo ? hdnodeUtils.convertBitcoinXpub(publicKey.xpub, coinInfo.network) : publicKey.xpub,
      chainCode: publicKey.node.chain_code,
      publicKey: publicKey.node.public_key,
      fingerprint: publicKey.node.fingerprint,
      depth: publicKey.node.depth
    }; // if requested path is a segwit
    // convert xpub to new format

    if (coinInfo) {
      const segwitNetwork = (0, _CoinInfo.getSegwitNetwork)(coinInfo);

      if (segwitNetwork && (0, _pathUtils.isSegwitPath)(path)) {
        response.xpubSegwit = hdnodeUtils.convertBitcoinXpub(publicKey.xpub, segwitNetwork);
      }
    }

    return response;
  }

  async getDeviceState() {
    const response = await this.getPublicKey([(44 | 0x80000000) >>> 0, (1 | 0x80000000) >>> 0, (0 | 0x80000000) >>> 0], 'Testnet', 'SPENDADDRESS');
    const secret = `${response.xpub}#${this.device.features.device_id}#${this.device.instance}`;
    const state = this.device.getTemporaryState() || bitcoin.crypto.hash256(Buffer.from(secret, 'binary')).toString('hex');
    return state;
  }

  async getAddress(address_n, coinInfo, showOnTrezor, multisig, scriptType) {
    if (!scriptType) {
      scriptType = (0, _pathUtils.getScriptType)(address_n);

      if (scriptType === 'SPENDMULTISIG' && !multisig) {
        scriptType = 'SPENDADDRESS';
      }
    }

    if (multisig && multisig.pubkeys) {
      // convert xpub strings to HDNodeTypes
      multisig.pubkeys.forEach(pk => {
        if (typeof pk.node === 'string') {
          pk.node = hdnodeUtils.xpubToHDNodeType(pk.node, coinInfo.network);
        }
      });
    }

    const response = await this.typedCall('GetAddress', 'Address', {
      address_n,
      coin_name: coinInfo.name,
      show_display: !!showOnTrezor,
      multisig,
      script_type: scriptType || 'SPENDADDRESS'
    });
    return {
      address: response.message.address,
      path: address_n,
      serializedPath: (0, _pathUtils.getSerializedPath)(address_n)
    };
  }

  async signMessage(address_n, message, coin) {
    const scriptType = (0, _pathUtils.getScriptType)(address_n);
    const response = await this.typedCall('SignMessage', 'MessageSignature', {
      address_n,
      message,
      coin_name: coin || 'Bitcoin',
      script_type: scriptType && scriptType !== 'SPENDMULTISIG' ? scriptType : 'SPENDADDRESS' // script_type 'SPENDMULTISIG' throws Failure_FirmwareError

    });
    return response.message;
  }

  async verifyMessage(address, signature, message, coin) {
    const response = await this.typedCall('VerifyMessage', 'Success', {
      address,
      signature,
      message,
      coin_name: coin
    });
    return response.message;
  }

  async ethereumGetAddress(address_n, network, showOnTrezor = true) {
    const response = await this.typedCall('EthereumGetAddress', 'EthereumAddress', {
      address_n: address_n,
      show_display: !!showOnTrezor
    });
    response.message.address = (0, _ethereumUtils.toChecksumAddress)(response.message.address, network);
    return response.message;
  }

  async ethereumGetPublicKey(address_n, showOnTrezor) {
    if (!this.device.atLeast(['1.8.1', '2.1.0'])) {
      return await this.getHDNode(address_n);
    }

    const suffix = 0;
    const childPath = address_n.concat([suffix]);
    const resKey = await this.typedCall('EthereumGetPublicKey', 'EthereumPublicKey', {
      address_n: address_n,
      show_display: false
    });
    const childKey = await this.typedCall('EthereumGetPublicKey', 'EthereumPublicKey', {
      address_n: childPath,
      show_display: false
    });
    const publicKey = hdnodeUtils.xpubDerive(resKey.message, childKey.message, suffix);
    return {
      path: address_n,
      serializedPath: (0, _pathUtils.getSerializedPath)(address_n),
      childNum: publicKey.node.child_num,
      xpub: publicKey.xpub,
      chainCode: publicKey.node.chain_code,
      publicKey: publicKey.node.public_key,
      fingerprint: publicKey.node.fingerprint,
      depth: publicKey.node.depth
    };
  }

  async ethereumSignMessage(address_n, message) {
    const response = await this.typedCall('EthereumSignMessage', 'EthereumMessageSignature', {
      address_n,
      message
    });
    return response.message;
  }

  async ethereumVerifyMessage(address, signature, message) {
    const response = await this.typedCall('EthereumVerifyMessage', 'Success', {
      address,
      signature,
      message
    });
    return response.message;
  }

  async nemGetAddress(address_n, network, showOnTrezor) {
    const response = await this.typedCall('NEMGetAddress', 'NEMAddress', {
      address_n,
      network,
      show_display: !!showOnTrezor
    });
    return response.message;
  }

  async nemSignTx(transaction) {
    const response = await this.typedCall('NEMSignTx', 'NEMSignedTx', transaction);
    return response.message;
  } // Ripple: begin


  async rippleGetAddress(address_n, showOnTrezor) {
    const response = await this.typedCall('RippleGetAddress', 'RippleAddress', {
      address_n,
      show_display: !!showOnTrezor
    });
    return response.message;
  }

  async rippleSignTx(transaction) {
    const response = await this.typedCall('RippleSignTx', 'RippleSignedTx', transaction);
    return response.message;
  } // Ripple: end
  // Stellar: begin


  async stellarGetAddress(address_n, showOnTrezor) {
    const response = await this.typedCall('StellarGetAddress', 'StellarAddress', {
      address_n,
      show_display: !!showOnTrezor
    });
    return response.message;
  } // StellarSignTx message can be found inside ./core/methods/helpers/stellarSignTx
  // Stellar: end
  // EOS: begin


  async eosGetPublicKey(address_n, showOnTrezor) {
    const response = await this.typedCall('EosGetPublicKey', 'EosPublicKey', {
      address_n,
      show_display: !!showOnTrezor
    });
    return response.message;
  } // EosSignTx message can be found inside ./core/methods/helpers/eosSignTx
  // EOS: end
  // Cardano: begin


  async cardanoGetPublicKey(address_n, showOnTrezor) {
    const response = await this.typedCall('CardanoGetPublicKey', 'CardanoPublicKey', {
      address_n,
      show_display: !!showOnTrezor
    });
    return response.message;
  }

  async cardanoGetAddress(address_n, showOnTrezor) {
    const response = await this.typedCall('CardanoGetAddress', 'CardanoAddress', {
      address_n,
      show_display: !!showOnTrezor
    });
    return response.message;
  } // CardanoSignTx message can be found inside ./core/methods/helpers/cardanoSignTx
  // Cardano: end
  // Lisk: begin


  async liskGetAddress(address_n, showOnTrezor) {
    const response = await this.typedCall('LiskGetAddress', 'LiskAddress', {
      address_n,
      show_display: !!showOnTrezor
    });
    return response.message;
  }

  async liskGetPublicKey(address_n, showOnTrezor) {
    const response = await this.typedCall('LiskGetPublicKey', 'LiskPublicKey', {
      address_n,
      show_display: !!showOnTrezor
    });
    return response.message;
  }

  async liskSignMessage(address_n, message) {
    const response = await this.typedCall('LiskSignMessage', 'LiskMessageSignature', {
      address_n,
      message
    });
    return response.message;
  }

  async liskVerifyMessage(public_key, signature, message) {
    const response = await this.typedCall('LiskVerifyMessage', 'Success', {
      public_key,
      signature,
      message
    });
    return response.message;
  }

  async liskSignTx(address_n, transaction) {
    const response = await this.typedCall('LiskSignTx', 'LiskSignedTx', {
      address_n,
      transaction
    });
    return response.message;
  } // Lisk: end
  // Tezos: begin


  async tezosGetAddress(address_n, showOnTrezor) {
    const response = await this.typedCall('TezosGetAddress', 'TezosAddress', {
      address_n,
      show_display: !!showOnTrezor
    });
    return response.message;
  }

  async tezosGetPublicKey(address_n, showOnTrezor) {
    const response = await this.typedCall('TezosGetPublicKey', 'TezosPublicKey', {
      address_n,
      show_display: !!showOnTrezor
    });
    return response.message;
  }

  async tezosSignTransaction(message) {
    const response = await this.typedCall('TezosSignTx', 'TezosSignedTx', message);
    return response.message;
  } // Tezos: end
  // Binance: begin


  async binanceGetAddress(address_n, showOnTrezor) {
    const response = await this.typedCall('BinanceGetAddress', 'BinanceAddress', {
      address_n,
      show_display: !!showOnTrezor
    });
    return response.message;
  }

  async binanceGetPublicKey(address_n, showOnTrezor) {
    const response = await this.typedCall('BinanceGetPublicKey', 'BinancePublicKey', {
      address_n,
      show_display: !!showOnTrezor
    });
    return response.message;
  } // Binance: end


  async cipherKeyValue(address_n, key, value, encrypt, ask_on_encrypt, ask_on_decrypt, iv) {
    const valueString = value instanceof Buffer ? value.toString('hex') : value;
    const ivString = iv instanceof Buffer ? iv.toString('hex') : iv;
    const response = await this.typedCall('CipherKeyValue', 'CipheredKeyValue', {
      address_n: address_n,
      key: key,
      value: valueString,
      encrypt: encrypt,
      ask_on_encrypt: ask_on_encrypt,
      ask_on_decrypt: ask_on_decrypt,
      iv: ivString
    });
    return response.message;
  }

  async signIdentity(identity, challenge_hidden, challenge_visual) {
    const response = await this.typedCall('SignIdentity', 'SignedIdentity', {
      identity,
      challenge_hidden,
      challenge_visual
    });
    return response.message;
  } // async clearSession(): Promise<MessageResponse<trezor.Success>> {


  async clearSession(settings) {
    return await this.typedCall('ClearSession', 'Success', settings);
  }

  async initialize(useEmptyPassphrase = false) {
    if (this.disposed) {
      throw new Error('DeviceCommands already disposed');
    }

    const payload = {};

    if (!this.device.isT1()) {
      // T2 features
      payload.state = this.device.getExpectedState() || this.device.getState();

      if (useEmptyPassphrase) {
        payload.skip_passphrase = useEmptyPassphrase;
        payload.state = null;
      }
    }

    const response = await this.call('Initialize', payload);
    assertType(response, 'Features');
    return response;
  }

  async wipe() {
    const response = await this.typedCall('WipeDevice', 'Success');
    return response.message;
  }

  async reset(flags) {
    const response = await this.typedCall('ResetDevice', 'Success', flags);
    return response.message;
  }

  async load(flags) {
    const response = await this.typedCall('LoadDevice', 'Success', flags);
    return response.message;
  }

  async applyFlags(params) {
    const response = await this.typedCall('ApplyFlags', 'Success', params);
    return response.message;
  }

  async applySettings(params) {
    const response = await this.typedCall('ApplySettings', 'Success', params);
    return response.message;
  }

  async backupDevice() {
    const response = await this.typedCall('BackupDevice', 'Success');
    return response.message;
  }

  async changePin(params) {
    const response = await this.typedCall('ChangePin', 'Success', params);
    return response.message;
  }

  async firmwareErase(params) {
    const response = await this.typedCall('FirmwareErase', this.device.features.major_version === 1 ? 'Success' : 'FirmwareRequest', params);
    return response.message;
  }

  async firmwareUpload(params) {
    const response = await this.typedCall('FirmwareUpload', 'Success', params);
    return response.message;
  }

  async recoveryDevice(params) {
    const response = await this.typedCall('RecoveryDevice', 'Success', params);
    return response.message;
  } // Sends an async message to the opened device.


  async call(type, msg = {}) {
    const logMessage = filterForLog(type, msg);

    if (this.debug) {
      // eslint-disable-next-line no-console
      console.log('[DeviceCommands] [call] Sending', type, logMessage, this.transport);
    }

    try {
      this.callPromise = this.transport.call(this.sessionId, type, msg, false);
      const res = await this.callPromise;
      const logMessage = filterForLog(res.type, res.message);

      if (this.debug) {
        // eslint-disable-next-line no-console
        console.log('[DeviceCommands] [call] Received', res.type, logMessage);
      }

      return res;
    } catch (error) {
      if (this.debug) {
        // eslint-disable-next-line no-console
        console.warn('[DeviceCommands] [call] Received error', error);
      } // TODO: throw trezor error


      throw error;
    }
  }

  async typedCall(type, resType, msg = {}) {
    if (this.disposed) {
      throw new Error('DeviceCommands already disposed');
    }

    const response = await this._commonCall(type, msg);
    assertType(response, resType);
    return response;
  }

  async _commonCall(type, msg) {
    const resp = await this.call(type, msg);
    return this._filterCommonTypes(resp);
  }

  async _filterCommonTypes(res) {
    if (res.type === 'Failure') {
      const e = new Error(res.message.message); // $FlowIssue extending errors in ES6 "correctly" is a PITA

      e.code = res.message.code;
      return Promise.reject(e);
    }

    if (res.type === 'ButtonRequest') {
      this.device.emit('button', this.device, res.message.code);
      return this._commonCall('ButtonAck', {});
    }

    if (res.type === 'EntropyRequest') {
      return this._commonCall('EntropyAck', {
        entropy: generateEntropy(32).toString('hex')
      });
    }

    if (res.type === 'PinMatrixRequest') {
      return this._promptPin(res.message.type).then(pin => {
        return this._commonCall('PinMatrixAck', {
          pin: pin
        });
      }, () => {
        return this._commonCall('Cancel', {});
      });
    }

    if (res.type === 'PassphraseRequest') {
      const state = !this.device.isT1() ? this.device.getExpectedState() || this.device.getState() : null;

      if (res.message.on_device) {
        this.device.emit(DEVICE.PASSPHRASE_ON_DEVICE, this.device);
        return this._commonCall('PassphraseAck', {
          state
        });
      }

      return this._promptPassphrase().then(passphrase => {
        return this._commonCall('PassphraseAck', {
          passphrase,
          state
        });
      }, err => {
        return this._commonCall('Cancel', {}).catch(e => {
          throw err || e;
        });
      });
    }

    if (res.type === 'PassphraseStateRequest') {
      const state = res.message.state;
      this.device.setTemporaryState(state);
      return this._commonCall('PassphraseStateAck', {});
    }

    if (res.type === 'WordRequest') {
      return this._promptWord(res.message.type).then(word => {
        return this._commonCall('WordAck', {
          word: word
        });
      }, () => {
        return this._commonCall('Cancel', {});
      });
    }

    return Promise.resolve(res);
  }

  _promptPin(type) {
    return new Promise((resolve, reject) => {
      if (this.device.listenerCount(DEVICE.PIN) > 0) {
        this.device.emit(DEVICE.PIN, this.device, type, (err, pin) => {
          if (err || pin == null) {
            reject(err);
          } else {
            resolve(pin);
          }
        });
      } else {
        // eslint-disable-next-line no-console
        console.warn('[DeviceCommands] [call] PIN callback not configured, cancelling request');
        reject(new Error('PIN callback not configured'));
      }
    });
  }

  _promptPassphrase() {
    return new Promise((resolve, reject) => {
      if (this.device.listenerCount(DEVICE.PASSPHRASE) > 0) {
        this.device.emit(DEVICE.PASSPHRASE, this.device, (err, passphrase) => {
          if (err || passphrase == null) {
            reject(err);
          } else {
            resolve(passphrase.normalize('NFKD'));
          }
        });
      } else {
        // eslint-disable-next-line no-console
        console.warn('[DeviceCommands] [call] Passphrase callback not configured, cancelling request');
        reject(new Error('Passphrase callback not configured'));
      }
    });
  }

  _promptWord(type) {
    return new Promise((resolve, reject) => {
      this.device.emit(DEVICE.WORD, this.device, type, (err, word) => {
        if (err || word == null) {
          reject(err);
        } else {
          resolve(word.toLocaleLowerCase());
        }
      });
    });
  } // DebugLink messages


  async debugLinkDecision(msg) {
    const session = await this.transport.acquire({
      path: this.device.originalDescriptor.path,
      previous: this.device.originalDescriptor.debugSession
    }, true);
    await (0, _promiseUtils.resolveAfter)(501, null); // wait for propagation from bridge

    await this.transport.post(session, 'DebugLinkDecision', msg, true);
    await this.transport.release(session, true, true);
    this.device.originalDescriptor.debugSession = null; // make sure there are no leftovers

    await (0, _promiseUtils.resolveAfter)(501, null); // wait for propagation from bridge
  }

  async debugLinkGetState(msg) {
    const session = await this.transport.acquire({
      path: this.device.originalDescriptor.path,
      previous: this.device.originalDescriptor.debugSession
    }, true);
    await (0, _promiseUtils.resolveAfter)(501, null); // wait for propagation from bridge

    const response = await this.transport.call(session, 'DebugLinkGetState', {}, true);
    assertType(response, 'DebugLinkState');
    await this.transport.release(session, true, true);
    await (0, _promiseUtils.resolveAfter)(501, null); // wait for propagation from bridge

    return response.message;
  }

  async getAccountDescriptor(coinInfo, indexOrPath) {
    const address_n = Array.isArray(indexOrPath) ? indexOrPath : (0, _accountUtils.getAccountAddressN)(coinInfo, indexOrPath);

    if (coinInfo.type === 'bitcoin') {
      const resp = await this.getHDNode(address_n, coinInfo, false);
      return {
        descriptor: resp.xpubSegwit || resp.xpub,
        address_n
      };
    } else if (coinInfo.type === 'ethereum') {
      const resp = await this.ethereumGetAddress(address_n, coinInfo, false);
      return {
        descriptor: resp.address,
        address_n
      };
    } else if (coinInfo.shortcut === 'XRP' || coinInfo.shortcut === 'tXRP') {
      const resp = await this.rippleGetAddress(address_n, false);
      return {
        descriptor: resp.address,
        address_n
      };
    }

    return;
  }

}

exports.default = DeviceCommands;