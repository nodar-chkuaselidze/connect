"use strict";

exports.__esModule = true;
exports.createTx = exports.TX_TYPES = exports.NEM_SUPPLY_CHANGE = exports.NEM_MOSAIC_CREATION = exports.NEM_PROVISION_NAMESPACE = exports.NEM_MULTISIG = exports.NEM_MULTISIG_SIGNATURE = exports.NEM_AGGREGATE_MODIFICATION = exports.NEM_IMPORTANCE_TRANSFER = exports.NEM_COSIGNING = exports.NEM_TRANSFER = exports.NETWORKS = exports.NEM_MIJIN = exports.NEM_TESTNET = exports.NEM_MAINNET = void 0;
const NEM_MAINNET = 0x68;
exports.NEM_MAINNET = NEM_MAINNET;
const NEM_TESTNET = 0x98;
exports.NEM_TESTNET = NEM_TESTNET;
const NEM_MIJIN = 0x60;
exports.NEM_MIJIN = NEM_MIJIN;
const NETWORKS = {
  'mainnet': NEM_MAINNET,
  'testnet': NEM_TESTNET,
  'mijin': NEM_MIJIN
};
exports.NETWORKS = NETWORKS;
const NEM_TRANSFER = 0x0101;
exports.NEM_TRANSFER = NEM_TRANSFER;
const NEM_COSIGNING = 0x0102;
exports.NEM_COSIGNING = NEM_COSIGNING;
const NEM_IMPORTANCE_TRANSFER = 0x0801;
exports.NEM_IMPORTANCE_TRANSFER = NEM_IMPORTANCE_TRANSFER;
const NEM_AGGREGATE_MODIFICATION = 0x1001;
exports.NEM_AGGREGATE_MODIFICATION = NEM_AGGREGATE_MODIFICATION;
const NEM_MULTISIG_SIGNATURE = 0x1002;
exports.NEM_MULTISIG_SIGNATURE = NEM_MULTISIG_SIGNATURE;
const NEM_MULTISIG = 0x1004;
exports.NEM_MULTISIG = NEM_MULTISIG;
const NEM_PROVISION_NAMESPACE = 0x2001;
exports.NEM_PROVISION_NAMESPACE = NEM_PROVISION_NAMESPACE;
const NEM_MOSAIC_CREATION = 0x4001;
exports.NEM_MOSAIC_CREATION = NEM_MOSAIC_CREATION;
const NEM_SUPPLY_CHANGE = 0x4002;
exports.NEM_SUPPLY_CHANGE = NEM_SUPPLY_CHANGE;
const TX_TYPES = {
  'transfer': NEM_TRANSFER,
  'cosigning': NEM_COSIGNING,
  'importanceTransfer': NEM_IMPORTANCE_TRANSFER,
  'aggregateModification': NEM_AGGREGATE_MODIFICATION,
  'multisigSignature': NEM_MULTISIG_SIGNATURE,
  'multisig': NEM_MULTISIG,
  'provisionNamespace': NEM_PROVISION_NAMESPACE,
  'mosaicCreation': NEM_MOSAIC_CREATION,
  'supplyChange': NEM_SUPPLY_CHANGE
};
exports.TX_TYPES = TX_TYPES;
const NEM_MOSAIC_LEVY_TYPES = {
  '1': 'MosaicLevy_Absolute',
  '2': 'MosaicLevy_Percentile'
};
const NEM_SUPPLY_CHANGE_TYPES = {
  '1': 'SupplyChange_Increase',
  '2': 'SupplyChange_Decrease'
};
const NEM_AGGREGATE_MODIFICATION_TYPES = {
  '1': 'CosignatoryModification_Add',
  '2': 'CosignatoryModification_Delete'
};
const NEM_IMPORTANCE_TRANSFER_MODES = {
  '1': 'ImportanceTransfer_Activate',
  '2': 'ImportanceTransfer_Deactivate'
};

const getCommon = (tx, address_n) => {
  return {
    address_n,
    network: tx.version >> 24 & 0xFF,
    timestamp: tx.timeStamp,
    fee: tx.fee,
    deadline: tx.deadline,
    signer: address_n ? undefined : tx.signer
  };
};

const transferMessage = tx => {
  const mosaics = tx.mosaics ? tx.mosaics.map(mosaic => ({
    namespace: mosaic.mosaicId.namespaceId,
    mosaic: mosaic.mosaicId.name,
    quantity: mosaic.quantity
  })) : undefined;
  return {
    recipient: tx.recipient,
    amount: tx.amount,
    payload: tx.message.payload || undefined,
    public_key: tx.message.type === 0x02 ? tx.message.publicKey : undefined,
    mosaics
  };
};

const importanceTransferMessage = tx => ({
  mode: NEM_IMPORTANCE_TRANSFER_MODES[tx.importanceTransfer.mode],
  public_key: tx.importanceTransfer.publicKey
});

const aggregateModificationMessage = tx => {
  const modifications = tx.modifications ? tx.modifications.map(modification => ({
    type: NEM_AGGREGATE_MODIFICATION_TYPES[modification.modificationType],
    public_key: modification.cosignatoryAccount
  })) : undefined;
  return {
    modifications,
    relative_change: tx.minCosignatories.relativeChange
  };
};

const provisionNamespaceMessage = tx => ({
  namespace: tx.newPart,
  parent: tx.parent || undefined,
  sink: tx.rentalFeeSink,
  fee: tx.rentalFee
});

const mosaicCreationMessage = tx => {
  const levy = tx.mosaicDefinition.levy && tx.mosaicDefinition.levy.type ? tx.mosaicDefinition.levy : undefined;
  const definition = {
    namespace: tx.mosaicDefinition.id.namespaceId,
    mosaic: tx.mosaicDefinition.id.name,
    levy: levy && NEM_MOSAIC_LEVY_TYPES[levy.type],
    fee: levy && levy.fee,
    levy_address: levy && levy.recipient,
    levy_namespace: levy && levy.mosaicId.namespaceId,
    levy_mosaic: levy && levy.mosaicId.name,
    description: tx.mosaicDefinition.description
  };
  const properties = tx.mosaicDefinition.properties;

  if (Array.isArray(properties)) {
    properties.forEach(property => {
      const {
        name,
        value
      } = property;

      switch (name) {
        case 'divisibility':
          definition.divisibility = parseInt(value);
          break;

        case 'initialSupply':
          definition.supply = parseInt(value);
          break;

        case 'supplyMutable':
          definition.mutable_supply = value === 'true';
          break;

        case 'transferable':
          definition.transferable = value === 'true';
          break;
      }
    });
  }

  return {
    definition,
    sink: tx.creationFeeSink,
    fee: tx.creationFee
  };
};

const supplyChangeMessage = tx => ({
  namespace: tx.mosaicId.namespaceId,
  mosaic: tx.mosaicId.name,
  type: NEM_SUPPLY_CHANGE_TYPES[tx.supplyType],
  delta: tx.delta
});

const createTx = (tx, address_n) => {
  let transaction = tx;
  const message = {
    transaction: getCommon(tx, address_n)
  };
  message.cosigning = tx.type === 0x1002;

  if (message.cosigning || tx.type === 0x1004) {
    transaction = tx.otherTrans;
    message.multisig = getCommon(transaction);
  }

  switch (transaction.type) {
    case 0x0101:
      message.transfer = transferMessage(transaction);
      break;

    case 0x0801:
      message.importance_transfer = importanceTransferMessage(transaction);
      break;

    case 0x1001:
      message.aggregate_modification = aggregateModificationMessage(transaction);
      break;

    case 0x2001:
      message.provision_namespace = provisionNamespaceMessage(transaction);
      break;

    case 0x4001:
      message.mosaic_creation = mosaicCreationMessage(transaction);
      break;

    case 0x4002:
      message.supply_change = supplyChangeMessage(transaction);
      break;

    default:
      throw new Error('Unknown transaction type');
  }

  return message;
};

exports.createTx = createTx;