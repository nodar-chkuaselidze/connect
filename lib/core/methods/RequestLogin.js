"use strict";

var _interopRequireWildcard = require("@babel/runtime/helpers/interopRequireWildcard");

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

exports.__esModule = true;
exports.default = void 0;

var _AbstractMethod = _interopRequireDefault(require("./AbstractMethod"));

var _paramsValidator = require("./helpers/paramsValidator");

var UI = _interopRequireWildcard(require("../../constants/ui"));

var _builder = require("../../message/builder");

var _DataManager = _interopRequireDefault(require("../../data/DataManager"));

class RequestLogin extends _AbstractMethod.default {
  constructor(message) {
    super(message);
    this.requiredPermissions = ['read', 'write'];
    this.firmwareRange = (0, _paramsValidator.getFirmwareRange)(this.name, null, this.firmwareRange);
    this.info = 'Login';
    this.useEmptyPassphrase = true;
    const payload = message.payload;
    const identity = {};

    const settings = _DataManager.default.getSettings();

    if (settings.origin) {
      const uri = settings.origin.split(':');
      identity.proto = uri[0];
      identity.host = uri[1].substring(2);

      if (uri[2]) {
        identity.port = uri[2];
      }

      identity.index = 0;
    } // validate incoming parameters


    (0, _paramsValidator.validateParams)(payload, [{
      name: 'challengeHidden',
      type: 'string'
    }, {
      name: 'challengeVisual',
      type: 'string'
    }, {
      name: 'asyncChallenge',
      type: 'boolean'
    }]);
    this.params = {
      asyncChallenge: payload.asyncChallenge,
      identity,
      challengeHidden: payload.challengeHidden || '',
      challengeVisual: payload.challengeVisual || ''
    };
  }

  async run() {
    if (this.params.asyncChallenge) {
      // send request to developer
      this.postMessage((0, _builder.UiMessage)(UI.LOGIN_CHALLENGE_REQUEST)); // wait for response from developer

      const uiResp = await this.createUiPromise(UI.LOGIN_CHALLENGE_RESPONSE, this.device).promise;
      const payload = uiResp.payload; // error handler

      if (typeof payload === 'string') {
        throw new Error(`TrezorConnect.requestLogin callback error: ${payload}`);
      } // validate incoming parameters


      (0, _paramsValidator.validateParams)(payload, [{
        name: 'challengeHidden',
        type: 'string',
        obligatory: true
      }, {
        name: 'challengeVisual',
        type: 'string',
        obligatory: true
      }]);
      this.params.challengeHidden = payload.challengeHidden;
      this.params.challengeVisual = payload.challengeVisual;
    }

    const response = await this.device.getCommands().signIdentity(this.params.identity, this.params.challengeHidden, this.params.challengeVisual);
    return {
      address: response.address,
      publicKey: response.public_key,
      signature: response.signature
    };
  }

}

exports.default = RequestLogin;