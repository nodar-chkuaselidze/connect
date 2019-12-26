"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

exports.__esModule = true;
exports.default = void 0;

var _AbstractMethod = _interopRequireDefault(require("./AbstractMethod"));

var _DataManager = _interopRequireDefault(require("../../data/DataManager"));

class GetSettings extends _AbstractMethod.default {
  constructor(message) {
    super(message);
    this.requiredPermissions = [];
    this.useDevice = false;
    this.useUi = false;
  }

  async run() {
    return _DataManager.default.getSettings();
  }

}

exports.default = GetSettings;