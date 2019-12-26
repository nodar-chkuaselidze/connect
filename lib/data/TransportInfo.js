"use strict";

exports.__esModule = true;
exports.getBridgeInfo = exports.parseBridgeJSON = void 0;
const info = {
  version: [],
  directory: '',
  packages: []
}; // Parse JSON loaded from config.assets.bridge

const parseBridgeJSON = json => {
  // $FlowIssue indexer property is missing in `JSON`
  const latest = json[0];
  const version = latest.version.join('.');
  const data = JSON.parse(JSON.stringify(latest).replace(/{version}/g, version));
  const directory = data.directory;
  const packages = data.packages.map(p => ({
    name: p.name,
    platform: p.platform,
    url: `${directory}${p.url}`,
    signature: p.signature ? `${directory}${p.signature}` : undefined
  }));
  info.version = data.version;
  info.directory = directory;
  info.packages = packages;
  return info;
};

exports.parseBridgeJSON = parseBridgeJSON;

const getBridgeInfo = () => {
  return info;
};

exports.getBridgeInfo = getBridgeInfo;