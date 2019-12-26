"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

exports.__esModule = true;
exports.suggestBridgeInstaller = exports.getBrowserState = exports.state = void 0;

var _defineProperty2 = _interopRequireDefault(require("@babel/runtime/helpers/defineProperty"));

var _bowser = _interopRequireDefault(require("bowser"));

var _TransportInfo = require("../../data/TransportInfo");

function ownKeys(object, enumerableOnly) { var keys = Object.keys(object); if (Object.getOwnPropertySymbols) { var symbols = Object.getOwnPropertySymbols(object); if (enumerableOnly) symbols = symbols.filter(function (sym) { return Object.getOwnPropertyDescriptor(object, sym).enumerable; }); keys.push.apply(keys, symbols); } return keys; }

function _objectSpread(target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i] != null ? arguments[i] : {}; if (i % 2) { ownKeys(Object(source), true).forEach(function (key) { (0, _defineProperty2.default)(target, key, source[key]); }); } else if (Object.getOwnPropertyDescriptors) { Object.defineProperties(target, Object.getOwnPropertyDescriptors(source)); } else { ownKeys(Object(source)).forEach(function (key) { Object.defineProperty(target, key, Object.getOwnPropertyDescriptor(source, key)); }); } } return target; }

const state = {
  name: 'unknown',
  osname: 'unknown',
  supported: false,
  outdated: false,
  mobile: false
};
exports.state = state;

const getBrowserState = supportedBrowsers => {
  if (typeof window === 'undefined') return state;

  const {
    browser,
    os,
    platform
  } = _bowser.default.parse(window.navigator.userAgent);

  const mobile = platform.type !== 'desktop';
  let supported = !!supportedBrowsers[browser.name.toLowerCase()];
  let outdated = false;

  if (mobile && typeof navigator.usb === 'undefined') {
    supported = false;
  }

  if (supported) {
    const {
      version
    } = supportedBrowsers[browser.name.toLowerCase()];
    outdated = version > parseInt(browser.version, 10);
    supported = !outdated;
  }

  return {
    name: `${browser.name}: ${browser.version}; ${os.name}: ${os.version};`,
    osname: os.name,
    mobile,
    supported,
    outdated
  };
};

exports.getBrowserState = getBrowserState;

const getSuggestedBridgeInstaller = () => {
  if (!navigator || !navigator.userAgent) return; // Find preferred platform using bowser and userAgent

  const agent = navigator.userAgent;

  const browser = _bowser.default.getParser(agent);

  const name = browser.getOS().name.toLowerCase();

  switch (name) {
    case 'linux':
      {
        const isRpm = agent.match(/CentOS|Fedora|Mandriva|Mageia|Red Hat|Scientific|SUSE/) ? 'rpm' : 'deb';
        const is64x = agent.match(/Linux i[3456]86/) ? '32' : '64';
        return `${isRpm}${is64x}`;
      }

    case 'macos':
      return 'mac';

    case 'windows':
      return 'win';

    default:
      break;
  }
};

const suggestBridgeInstaller = () => {
  const info = (0, _TransportInfo.getBridgeInfo)(); // check if preferred field was already added

  if (!info.packages.find(p => p.preferred)) {
    const preferred = getSuggestedBridgeInstaller();

    if (preferred) {
      // override BridgeInfo packages, add preferred field
      info.packages = info.packages.map(p => _objectSpread({}, p, {
        preferred: p.platform.indexOf(preferred) >= 0
      }));
    }
  }

  return info;
};

exports.suggestBridgeInstaller = suggestBridgeInstaller;