"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

exports.__esModule = true;
exports.default = void 0;

var _defineProperty2 = _interopRequireDefault(require("@babel/runtime/helpers/defineProperty"));

var _networkUtils = require("../env/node/networkUtils");

var _ConnectSettings = require("../data/ConnectSettings");

var _CoinInfo = require("./CoinInfo");

var _FirmwareInfo = require("./FirmwareInfo");

var _TransportInfo = require("./TransportInfo");

var _parseUri = _interopRequireDefault(require("parse-uri"));

var _semverCompare = _interopRequireDefault(require("semver-compare"));

// TODO: transform json to flow typed object
const parseConfig = json => {
  const config = json;
  return config;
};

class DataManager {
  static async load(settings, withAssets = true) {
    const ts = settings.env === 'web' ? `?r=${settings.timestamp}` : '';
    this.settings = settings;
    const config = await (0, _networkUtils.httpRequest)(`${settings.configSrc}${ts}`, 'json');
    this.config = parseConfig(config); // check if origin is localhost or trusted

    const isLocalhost = typeof window !== 'undefined' && window.location ? window.location.hostname === 'localhost' : true;
    const whitelist = DataManager.isWhitelisted(this.settings.origin || '');
    this.settings.trustedHost = (isLocalhost || !!whitelist) && !this.settings.popup; // ensure that popup will be used

    if (!this.settings.trustedHost) {
      this.settings.popup = true;
    } // ensure that debug is disabled


    if (!this.settings.trustedHost && !whitelist) {
      this.settings.debug = false;
    }

    this.settings.priority = DataManager.getPriority(whitelist);
    const knownHost = DataManager.getHostLabel(this.settings.extension || this.settings.origin || '');

    if (knownHost) {
      this.settings.hostLabel = knownHost.label;
      this.settings.hostIcon = knownHost.icon;
    } // hotfix webusb + chrome:72, allow webextensions


    if (this.settings.popup && this.settings.webusb && this.settings.env !== 'webextension') {
      this.settings.webusb = false;
    }

    if (!withAssets) return;

    for (const asset of this.config.assets) {
      const json = await (0, _networkUtils.httpRequest)(`${asset.url}${ts}`, asset.type || 'json');
      this.assets[asset.name] = json;
    }

    for (const protobuf of this.config.messages) {
      const json = await (0, _networkUtils.httpRequest)(`${protobuf.json}${ts}`, 'json');
      this.messages[protobuf.name] = json;
    } // parse bridge JSON


    (0, _TransportInfo.parseBridgeJSON)(this.assets['bridge']); // parse coins definitions

    (0, _CoinInfo.parseCoinsJson)(this.assets['coins']); // parse firmware definitions

    (0, _FirmwareInfo.parseFirmware)(this.assets['firmware-t1']);
    (0, _FirmwareInfo.parseFirmware)(this.assets['firmware-t2']);
  }

  static findMessages(model, fw) {
    const messages = this.config.messages.find(m => {
      const min = m.range.min[model];
      const max = m.range.max ? m.range.max[model] : fw;
      return (0, _semverCompare.default)(fw, min) >= 0 && (0, _semverCompare.default)(fw, max) <= 0;
    });
    return this.messages[messages ? messages.name : 'default'];
  }

  static getMessages(name) {
    return this.messages[name || 'default'];
  }

  static isWhitelisted(origin) {
    if (!this.config) return null;
    const uri = (0, _parseUri.default)(origin);

    if (uri && typeof uri.host === 'string') {
      const parts = uri.host.split('.');

      if (parts.length > 2) {
        // subdomain
        uri.host = parts.slice(parts.length - 2, parts.length).join('.');
      }

      return this.config.whitelist.find(item => item.origin === origin || item.origin === uri.host);
    }
  }

  static isManagementAllowed() {
    if (!this.config) return;
    const uri = (0, _parseUri.default)(this.settings.origin);

    if (uri && typeof uri.host === 'string') {
      const parts = uri.host.split('.');

      if (parts.length > 2) {
        // subdomain
        uri.host = parts.slice(parts.length - 2, parts.length).join('.');
      }

      return this.config.management.find(item => item.origin === this.settings.origin || item.origin === uri.host);
    }
  }

  static getPriority(whitelist) {
    if (whitelist) {
      return whitelist.priority;
    }

    return _ConnectSettings.DEFAULT_PRIORITY;
  }

  static getHostLabel(origin) {
    return this.config.knownHosts.find(host => host.origin === origin);
  }

  static getSettings(key) {
    if (!this.settings) return null;

    if (typeof key === 'string') {
      return this.settings[key];
    }

    return this.settings;
  }

  static getDebugSettings(type) {
    return false;
  }

  static getConfig() {
    return this.config;
  }

}

exports.default = DataManager;
(0, _defineProperty2.default)(DataManager, "assets", {});
(0, _defineProperty2.default)(DataManager, "messages", {});