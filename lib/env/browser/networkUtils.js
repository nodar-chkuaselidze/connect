"use strict";

exports.__esModule = true;
exports.getOrigin = exports.httpRequest = void 0;

require("whatwg-fetch");

const httpRequest = async (url, type = 'text') => {
  const response = await fetch(url, {
    credentials: 'same-origin'
  });

  if (response.ok) {
    if (type === 'json') {
      const txt = await response.text();
      return JSON.parse(txt);
    } else if (type === 'binary') {
      return await response.arrayBuffer();
    } else {
      return await response.text();
    }
  } else {
    throw new Error(`httpRequest error: ${url} ${response.statusText}`);
  }
};

exports.httpRequest = httpRequest;

const getOrigin = url => {
  if (url.indexOf('file://') === 0) return 'file://'; // eslint-disable-next-line no-irregular-whitespace, no-useless-escape

  const parts = url.match(/^.+\:\/\/[^\/]+/);
  return Array.isArray(parts) && parts.length > 0 ? parts[0] : 'unknown';
};

exports.getOrigin = getOrigin;