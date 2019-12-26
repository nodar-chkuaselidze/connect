"use strict";

exports.__esModule = true;
exports.transformReferencedTransactions = exports.getReferencedTransactions = void 0;

var _utxoLib = require("@trezor/utxo-lib");

var _bufferUtils = require("../../../utils/bufferUtils");

// local modules
// Get array of unique referenced transactions ids
const getReferencedTransactions = inputs => {
  const legacyInputs = inputs.filter(utxo => !utxo.segwit);

  if (legacyInputs.length < 1) {
    return [];
  }

  return legacyInputs.reduce((result, utxo) => {
    const hash = (0, _bufferUtils.reverseBuffer)(utxo.hash).toString('hex');
    if (result.includes(hash)) return result;
    return result.concat(hash);
  }, []);
}; // Transform referenced transactions from Bitcore to Trezor format


exports.getReferencedTransactions = getReferencedTransactions;

const transformReferencedTransactions = txs => {
  return txs.map(tx => {
    const extraData = tx.getExtraData();
    const version_group_id = _utxoLib.coins.isZcash(tx.network) ? parseInt(tx.versionGroupId, 16) : null;
    return {
      version: tx.isDashSpecialTransaction() ? tx.version | tx.type << 16 : tx.version,
      hash: tx.getId(),
      inputs: tx.ins.map(input => {
        return {
          prev_index: input.index,
          sequence: input.sequence,
          prev_hash: (0, _bufferUtils.reverseBuffer)(input.hash).toString('hex'),
          script_sig: input.script.toString('hex')
        };
      }),
      bin_outputs: tx.outs.map(output => {
        return {
          amount: typeof output.value === 'number' ? output.value.toString() : output.value,
          script_pubkey: output.script.toString('hex')
        };
      }),
      extra_data: extraData ? extraData.toString('hex') : null,
      lock_time: tx.locktime,
      timestamp: tx.timestamp,
      version_group_id,
      expiry: tx.expiry
    };
  });
};

exports.transformReferencedTransactions = transformReferencedTransactions;