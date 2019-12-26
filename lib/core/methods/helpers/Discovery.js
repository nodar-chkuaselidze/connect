"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

exports.__esModule = true;
exports.default = void 0;

var _defineProperty2 = _interopRequireDefault(require("@babel/runtime/helpers/defineProperty"));

var _events = _interopRequireDefault(require("events"));

var _BlockchainLink = _interopRequireDefault(require("../../../backend/BlockchainLink"));

var _DeviceCommands = _interopRequireDefault(require("../../../device/DeviceCommands"));

var _accountUtils = require("../../../utils/accountUtils");

var _formatUtils = require("../../../utils/formatUtils");

function ownKeys(object, enumerableOnly) { var keys = Object.keys(object); if (Object.getOwnPropertySymbols) { var symbols = Object.getOwnPropertySymbols(object); if (enumerableOnly) symbols = symbols.filter(function (sym) { return Object.getOwnPropertyDescriptor(object, sym).enumerable; }); keys.push.apply(keys, symbols); } return keys; }

function _objectSpread(target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i] != null ? arguments[i] : {}; if (i % 2) { ownKeys(Object(source), true).forEach(function (key) { (0, _defineProperty2.default)(target, key, source[key]); }); } else if (Object.getOwnPropertyDescriptors) { Object.defineProperties(target, Object.getOwnPropertyDescriptors(source)); } else { ownKeys(Object(source)).forEach(function (key) { Object.defineProperty(target, key, Object.getOwnPropertyDescriptor(source, key)); }); } } return target; }

class Discovery extends _events.default {
  constructor(options) {
    super();
    (0, _defineProperty2.default)(this, "types", []);
    this.accounts = [];
    this.index = 0;
    this.typeIndex = 0;
    this.interrupted = false;
    this.completed = false;
    this.blockchain = options.blockchain;
    this.commands = options.commands;
    this.coinInfo = options.blockchain.coinInfo;
    const {
      coinInfo
    } = this; // set discovery types

    if (coinInfo.type === 'bitcoin') {
      // Bitcoin-like coins could have multiple discovery types (bech32, segwit, legacy)
      // path utility wrapper. bip44 purpose can be set as well
      const getDescriptor = (purpose, index) => {
        return (0, _accountUtils.getAccountAddressN)(coinInfo, index, {
          purpose
        });
      }; // add bech32 discovery type


      if (coinInfo.xPubMagicSegwitNative) {
        this.types.push({
          type: 'normal',
          getPath: getDescriptor.bind(this, 84)
        });
      } // add segwit discovery type (normal if bech32 is not supported)


      if (coinInfo.xPubMagicSegwit) {
        this.types.push({
          type: this.types.length > 0 ? 'segwit' : 'normal',
          getPath: getDescriptor.bind(this, 49)
        });
      } // add legacy discovery type (normal if bech32 and segwit are not supported)


      this.types.push({
        type: this.types.length > 0 ? 'legacy' : 'normal',
        getPath: getDescriptor.bind(this, 44)
      });
    } else {
      // other coins has only normal discovery type
      this.types.push({
        type: 'normal',
        getPath: _accountUtils.getAccountAddressN.bind(this, coinInfo)
      });
    }
  }

  async start(details) {
    const limit = 10; // TODO: move to options

    this.interrupted = false;

    while (!this.completed && !this.interrupted) {
      const accountType = this.types[this.typeIndex];
      const label = `Account #${this.index + 1}`;
      const overTheLimit = this.index >= limit; // get descriptor from device

      const path = accountType.getPath(this.index);
      const descriptor = await this.commands.getAccountDescriptor(this.coinInfo, path);

      if (!descriptor) {
        throw new Error('Discovery descriptor not found');
      }

      if (this.interrupted) return;

      const account = _objectSpread({}, descriptor, {
        type: accountType.type,
        label
      }); // remove duplicates (restore uncompleted discovery)


      this.accounts = this.accounts.filter(a => a.descriptor !== account.descriptor); // if index is below visible limit
      // add incomplete account info (without balance) and emit "progress"
      // this should render "Loading..." status

      if (!overTheLimit) {
        this.accounts.push(account);
        this.emit('progress', this.accounts);
      } // get account info from backend


      const info = await this.blockchain.getAccountInfo({
        descriptor: account.descriptor,
        details
      });
      if (this.interrupted) return; // remove previously added incomplete account info

      this.accounts = this.accounts.filter(a => a.descriptor !== account.descriptor); // check if account should be displayed
      // eg: empty account with index 11 should not be rendered

      if (!overTheLimit || overTheLimit && !info.empty) {
        const balance = (0, _formatUtils.formatAmount)(info.availableBalance, this.coinInfo);
        this.accounts.push(_objectSpread({}, account, {
          empty: info.empty,
          balance,
          addresses: info.addresses
        }));
        this.emit('progress', this.accounts);
      } // last account was empty. switch to next discovery type or complete the discovery process


      if (info.empty) {
        if (this.typeIndex + 1 < this.types.length) {
          this.typeIndex++;
          this.index = 0;
        } else {
          this.emit('complete');
          this.completed = true;
        }
      } else {
        this.index++;
      }
    }
  }

  stop() {
    this.interrupted = !this.completed;
  }

  dispose() {
    this.accounts = [];
  }

}

exports.default = Discovery;