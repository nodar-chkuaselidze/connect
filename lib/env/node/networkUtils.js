"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

exports.__esModule = true;
exports.getOrigin = exports.httpRequest = void 0;

var _fs = _interopRequireDefault(require("fs"));

var _path = _interopRequireDefault(require("path"));

var _nodeFetch = _interopRequireDefault(require("node-fetch"));

if (global && typeof global.fetch !== 'function') {
  global.fetch = _nodeFetch.default;
}

const httpRequest = async (url, type) => {
  let fileUrl = url.split('?')[0];
  fileUrl = _path.default.resolve(__dirname, '../../../', fileUrl);
  const content = type !== 'binary' ? _fs.default.readFileSync(fileUrl, {
    encoding: 'utf8'
  }) : _fs.default.readFileSync(fileUrl);
  if (!content) return null;

  if (type === 'binary') {
    return Array.from(content);
  } else if (type === 'json' && typeof content === 'string') {
    return JSON.parse(content);
  }

  return content;
};

exports.httpRequest = httpRequest;

const getOrigin = url => {
  if (url.indexOf('file://') === 0) return 'file://'; // eslint-disable-next-line no-irregular-whitespace, no-useless-escape

  const parts = url.match(/^.+\:\/\/[^\/]+/);
  return Array.isArray(parts) && parts.length > 0 ? parts[0] : 'unknown';
};

exports.getOrigin = getOrigin;