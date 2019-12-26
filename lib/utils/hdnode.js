"use strict";

var _interopRequireWildcard = require("@babel/runtime/helpers/interopRequireWildcard");

exports.__esModule = true;
exports.xpubToHDNodeType = exports.xpubDerive = exports.convertBitcoinXpub = exports.convertXpub = void 0;

var trezor = _interopRequireWildcard(require("../types/trezor"));

var bitcoin = _interopRequireWildcard(require("@trezor/utxo-lib"));

var ecurve = _interopRequireWildcard(require("ecurve"));

const curve = ecurve.getCurveByName('secp256k1');

const pubNode2bjsNode = (node, network) => {
  const chainCode = Buffer.from(node.chain_code, 'hex');
  const publicKey = Buffer.from(node.public_key, 'hex');

  if (curve == null) {
    throw new Error('secp256k1 is null');
  }

  const Q = ecurve.Point.decodeFrom(curve, publicKey);
  const res = new bitcoin.HDNode(new bitcoin.ECPair(null, Q, {
    network: network
  }), chainCode);
  res.depth = +node.depth;
  res.index = +node.child_num;
  res.parentFingerprint = node.fingerprint;
  return res;
};

const convertXpub = (xpub, originalNetwork, requestedNetwork) => {
  const node = bitcoin.HDNode.fromBase58(xpub, originalNetwork);

  if (requestedNetwork) {
    node.keyPair.network = requestedNetwork;
  }

  return node.toBase58();
}; // stupid hack, because older (1.7.1, 2.0.8) trezor FW serializes all xpubs with bitcoin magic


exports.convertXpub = convertXpub;

const convertBitcoinXpub = (xpub, network) => {
  if (network.bip32.public === 0x0488b21e) {
    // it's bitcoin-like => return xpub
    return xpub;
  } else {
    const node = bitcoin.HDNode.fromBase58(xpub); // use bitcoin magic
    // "hard-fix" the new network into the HDNode keypair

    node.keyPair.network = network;
    return node.toBase58();
  }
}; // converts from internal PublicKey format to bitcoin.js HDNode
// network info is necessary. throws error on wrong xpub


exports.convertBitcoinXpub = convertBitcoinXpub;

const pubKey2bjsNode = (key, network) => {
  const keyNode = key.node;
  const bjsNode = pubNode2bjsNode(keyNode, network);
  const bjsXpub = bjsNode.toBase58();
  const keyXpub = convertXpub(key.xpub, network);

  if (bjsXpub !== keyXpub) {
    throw new Error('Invalid public key transmission detected - ' + 'invalid xpub check. ' + 'Key: ' + bjsXpub + ', ' + 'Received: ' + keyXpub);
  }

  return bjsNode;
};

const checkDerivation = (parBjsNode, childBjsNode, suffix) => {
  const derivedChildBjsNode = parBjsNode.derive(suffix);
  const derivedXpub = derivedChildBjsNode.toBase58();
  const compXpub = childBjsNode.toBase58();

  if (derivedXpub !== compXpub) {
    throw new Error('Invalid public key transmission detected - ' + 'invalid child cross-check. ' + 'Computed derived: ' + derivedXpub + ', ' + 'Computed received: ' + compXpub);
  }
};

const xpubDerive = (xpub, childXPub, suffix, network, requestedNetwork) => {
  const resNode = pubKey2bjsNode(xpub, network || bitcoin.networks.bitcoin);
  const childNode = pubKey2bjsNode(childXPub, network || bitcoin.networks.bitcoin);
  checkDerivation(resNode, childNode, suffix);
  return xpub;
};

exports.xpubDerive = xpubDerive;

const xpubToHDNodeType = (xpub, network) => {
  const hd = bitcoin.HDNode.fromBase58(xpub, network);
  return {
    depth: hd.depth,
    child_num: hd.index,
    fingerprint: hd.parentFingerprint,
    public_key: hd.keyPair.getPublicKeyBuffer().toString('hex'),
    chain_code: hd.chainCode.toString('hex')
  };
};

exports.xpubToHDNodeType = xpubToHDNodeType;