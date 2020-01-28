"use strict";

var _interopRequireWildcard = require("@babel/runtime/helpers/interopRequireWildcard");

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

exports.__esModule = true;
exports.default = void 0;

var _defineProperty2 = _interopRequireDefault(require("@babel/runtime/helpers/defineProperty"));

var UI = _interopRequireWildcard(require("../../constants/ui"));

var _builder = require("../../message/builder");

var _AbstractMethod = _interopRequireDefault(require("./AbstractMethod"));

var _paramsValidator = require("./helpers/paramsValidator");

var _pathUtils = require("../../utils/pathUtils");

function ownKeys(object, enumerableOnly) { var keys = Object.keys(object); if (Object.getOwnPropertySymbols) { var symbols = Object.getOwnPropertySymbols(object); if (enumerableOnly) symbols = symbols.filter(function (sym) { return Object.getOwnPropertyDescriptor(object, sym).enumerable; }); keys.push.apply(keys, symbols); } return keys; }

function _objectSpread(target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i] != null ? arguments[i] : {}; if (i % 2) { ownKeys(Object(source), true).forEach(function (key) { (0, _defineProperty2.default)(target, key, source[key]); }); } else if (Object.getOwnPropertyDescriptors) { Object.defineProperties(target, Object.getOwnPropertyDescriptors(source)); } else { ownKeys(Object(source)).forEach(function (key) { Object.defineProperty(target, key, Object.getOwnPropertyDescriptor(source, key)); }); } } return target; }

class CipherKeyValue extends _AbstractMethod.default {
  constructor(message) {
    super(message);
    (0, _defineProperty2.default)(this, "confirmed", false);
    this.requiredPermissions = ['read', 'write'];
    this.firmwareRange = (0, _paramsValidator.getFirmwareRange)(this.name, null, this.firmwareRange);
    this.info = 'Cypher key value';
    this.useEmptyPassphrase = true; // create a bundle with only one batch if bundle doesn't exists

    this.hasBundle = Object.prototype.hasOwnProperty.call(message.payload, 'bundle');
    const payload = !this.hasBundle ? _objectSpread({}, message.payload, {
      bundle: [message.payload]
    }) : message.payload; // validate bundle type

    (0, _paramsValidator.validateParams)(payload, [{
      name: 'bundle',
      type: 'array'
    }]);
    const bundle = [];
    payload.bundle.forEach(batch => {
      // validate incoming parameters for each batch
      (0, _paramsValidator.validateParams)(batch, [{
        name: 'path',
        obligatory: true
      }, {
        name: 'key',
        type: 'string'
      }, {
        name: 'value',
        type: 'string'
      }, {
        name: 'encrypt',
        type: 'boolean'
      }, {
        name: 'askOnEncrypt',
        type: 'boolean'
      }, {
        name: 'askOnDecrypt',
        type: 'boolean'
      }, {
        name: 'iv',
        type: 'string'
      }]);
      const path = (0, _pathUtils.validatePath)(batch.path);
      bundle.push({
        path,
        key: batch.key,
        value: batch.value,
        encrypt: batch.encrypt,
        askOnEncrypt: batch.askOnEncrypt,
        askOnDecrypt: batch.askOnDecrypt,
        iv: batch.iv
      });
    });
    this.params = bundle;
  }

  async run() {
    const responses = [];

    for (let i = 0; i < this.params.length; i++) {
      const batch = this.params[i];
      const response = await this.device.getCommands().cipherKeyValue(batch.path, batch.key, batch.value, batch.encrypt, batch.askOnEncrypt, batch.askOnDecrypt, batch.iv);
      responses.push(response);

      if (this.hasBundle) {
        // send progress
        this.postMessage((0, _builder.UiMessage)(UI.BUNDLE_PROGRESS, {
          progress: i,
          response
        }));
      }
    }

    return this.hasBundle ? responses : responses[0];
  }

}

exports.default = CipherKeyValue;