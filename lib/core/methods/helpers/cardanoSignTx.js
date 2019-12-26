"use strict";

exports.__esModule = true;
exports.cardanoSignTx = void 0;

const processTxRequest = async (typedCall, request, transactions) => {
  const transaction = transactions[request.tx_index];

  if (request.tx_index < transactions.length - 1) {
    const response = await typedCall('CardanoTxAck', 'CardanoTxRequest', {
      transaction
    });
    return processTxRequest(typedCall, response.message, transactions);
  } else {
    const response = await typedCall('CardanoTxAck', 'CardanoSignedTx', {
      transaction
    });
    return response.message;
  }
};

const cardanoSignTx = async (typedCall, inputs, outputs, transactions, protocol_magic) => {
  const response = await typedCall('CardanoSignTx', 'CardanoTxRequest', {
    inputs: inputs,
    outputs: outputs,
    transactions_count: transactions.length,
    protocol_magic: protocol_magic
  });
  return await processTxRequest(typedCall, response.message, transactions);
};

exports.cardanoSignTx = cardanoSignTx;