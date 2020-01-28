"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

exports.__esModule = true;
exports.default = void 0;

var _AbstractMethod = _interopRequireDefault(require("./AbstractMethod"));

var _paramsValidator = require("./helpers/paramsValidator");

var _pathUtils = require("../../utils/pathUtils");

var _CoinInfo = require("../../data/CoinInfo");

var _ethereumUtils = require("../../utils/ethereumUtils");

var _formatUtils = require("../../utils/formatUtils");

class EthereumSignMessage extends _AbstractMethod.default {
  constructor(message) {
    super(message);
    this.requiredPermissions = ['read', 'write'];
    const payload = message.payload; // validate incoming parameters

    (0, _paramsValidator.validateParams)(payload, [{
      name: 'path',
      obligatory: true
    }, {
      name: 'message',
      type: 'string',
      obligatory: true
    }, {
      name: 'hex',
      type: 'boolean'
    }]);
    const path = (0, _pathUtils.validatePath)(payload.path, 3);
    const network = (0, _CoinInfo.getEthereumNetwork)(path);
    this.firmwareRange = (0, _paramsValidator.getFirmwareRange)(this.name, network, this.firmwareRange);
    this.info = (0, _ethereumUtils.getNetworkLabel)('Sign #NETWORK message', network);
    const messageHex = payload.hex ? (0, _formatUtils.messageToHex)(payload.message) : Buffer.from(payload.message, 'utf8').toString('hex');
    this.params = {
      path,
      network,
      message: messageHex
    };
  }

  async run() {
    const response = await this.device.getCommands().ethereumSignMessage(this.params.path, this.params.message);
    response.address = (0, _ethereumUtils.toChecksumAddress)(response.address, this.params.network);
    return response;
  }

}

exports.default = EthereumSignMessage;