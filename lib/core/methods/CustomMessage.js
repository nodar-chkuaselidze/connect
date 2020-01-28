"use strict";

var _interopRequireWildcard = require("@babel/runtime/helpers/interopRequireWildcard");

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

exports.__esModule = true;
exports.default = void 0;

var _AbstractMethod = _interopRequireDefault(require("./AbstractMethod"));

var _paramsValidator = require("./helpers/paramsValidator");

var UI = _interopRequireWildcard(require("../../constants/ui"));

var _builder = require("../../message/builder");

class CustomMessage extends _AbstractMethod.default {
  constructor(message) {
    super(message);
    this.requiredPermissions = ['custom-message', 'read', 'write'];
    this.info = 'Custom message';
    const payload = message.payload; // validate incoming parameters

    (0, _paramsValidator.validateParams)(message.payload, [{
      name: 'message',
      type: 'string',
      obligatory: true
    }, {
      name: 'params',
      type: 'object',
      obligatory: true
    }]);

    if (Object.prototype.hasOwnProperty.call(payload, 'messages')) {
      try {
        JSON.parse(JSON.stringify(payload.messages));
      } catch (error) {
        throw new Error('Parameter "messages" has invalid type. JSON expected.');
      }
    }

    this.params = {
      customMessages: payload.messages,
      message: payload.message,
      params: payload.params
    };
  }

  getCustomMessages() {
    return this.params.customMessages;
  }

  async run() {
    if (this.device.features.vendor === 'trezor.io' || this.device.features.vendor === 'bitcointrezor.com') {
      throw new Error('Cannot use custom message on device with official firmware. Change device "vendor" field.');
    } // call message


    const response = await this.device.getCommands()._commonCall(this.params.message, this.params.params); // send result to developer

    this.postMessage((0, _builder.UiMessage)(UI.CUSTOM_MESSAGE_REQUEST, response)); // wait for response from developer

    const uiResp = await this.createUiPromise(UI.CUSTOM_MESSAGE_RESPONSE, this.device).promise;
    const payload = uiResp.payload; // validate incoming response

    (0, _paramsValidator.validateParams)(payload, [{
      name: 'message',
      type: 'string',
      obligatory: true
    }]);

    if (payload.message.toLowerCase() === 'release') {
      // release device
      return response;
    } else {
      // validate incoming parameters
      (0, _paramsValidator.validateParams)(payload, [{
        name: 'params',
        type: 'object',
        obligatory: true
      }]); // change local params and make another call to device

      this.params.message = payload.message;
      this.params.params = payload.params;
      return await this.run();
    }
  }

}

exports.default = CustomMessage;