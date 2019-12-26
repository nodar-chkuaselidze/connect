"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

exports.__esModule = true;
exports.default = void 0;

var _defineProperty2 = _interopRequireDefault(require("@babel/runtime/helpers/defineProperty"));

var _AbstractMethod = _interopRequireDefault(require("./AbstractMethod"));

var _paramsValidator = require("./helpers/paramsValidator");

var _pathUtils = require("../../utils/pathUtils");

var _CoinInfo = require("../../data/CoinInfo");

function ownKeys(object, enumerableOnly) { var keys = Object.keys(object); if (Object.getOwnPropertySymbols) { var symbols = Object.getOwnPropertySymbols(object); if (enumerableOnly) symbols = symbols.filter(function (sym) { return Object.getOwnPropertyDescriptor(object, sym).enumerable; }); keys.push.apply(keys, symbols); } return keys; }

function _objectSpread(target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i] != null ? arguments[i] : {}; if (i % 2) { ownKeys(Object(source), true).forEach(function (key) { (0, _defineProperty2.default)(target, key, source[key]); }); } else if (Object.getOwnPropertyDescriptors) { Object.defineProperties(target, Object.getOwnPropertyDescriptors(source)); } else { ownKeys(Object(source)).forEach(function (key) { Object.defineProperty(target, key, Object.getOwnPropertyDescriptor(source, key)); }); } } return target; }

class SignMessage extends _AbstractMethod.default {
  constructor(message) {
    super(message);
    this.requiredPermissions = ['read', 'write'];
    const payload = message.payload; // validate incoming parameters

    (0, _paramsValidator.validateParams)(payload, [{
      name: 'path',
      obligatory: true
    }, {
      name: 'coin',
      type: 'string'
    }, {
      name: 'message',
      type: 'string',
      obligatory: true
    }]);
    const path = (0, _pathUtils.validatePath)(payload.path);
    let coinInfo;

    if (payload.coin) {
      coinInfo = (0, _CoinInfo.getBitcoinNetwork)(payload.coin);
      (0, _paramsValidator.validateCoinPath)(coinInfo, path);
    } else {
      coinInfo = (0, _CoinInfo.getBitcoinNetwork)(path);
    }

    this.info = (0, _pathUtils.getLabel)('Sign #NETWORK message', coinInfo);

    if (coinInfo) {
      // check required firmware with coinInfo support
      this.firmwareRange = (0, _paramsValidator.getFirmwareRange)(this.name, coinInfo, this.firmwareRange);
    }

    const messageHex = Buffer.from(payload.message, 'utf8').toString('hex');
    this.params = {
      path,
      message: messageHex,
      coinInfo
    };
  }

  async run() {
    const response = await this.device.getCommands().signMessage(this.params.path, this.params.message, this.params.coinInfo ? this.params.coinInfo.name : null); // convert signature to base64

    const signatureBuffer = Buffer.from(response.signature, 'hex');
    return _objectSpread({}, response, {
      signature: signatureBuffer.toString('base64')
    });
  }

}

exports.default = SignMessage;