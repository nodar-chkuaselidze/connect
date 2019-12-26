"use strict";

exports.__esModule = true;
exports.prepareTx = void 0;
const FIELDS_TO_RENAME = ['lifetime', 'keysgroup'];

const snakefy = val => val.replace(/([A-Z])/g, el => '_' + el.toLowerCase());

const prepareField = (name, value, obj) => {
  // Convert camelCase -> snake_keys
  let newName = snakefy(name); // convert to snake_keys fields that are not in camelCase format

  if (FIELDS_TO_RENAME.includes(name)) {
    newName = [name.substr(0, 4), '_', name.substr(4)].join('');
  }

  obj[newName] = value;
};

const prepareTx = (tx, newTx = {}) => {
  for (const field in tx) {
    const value = tx[field];

    if (typeof value === 'object' && !Array.isArray(value)) {
      newTx[field] = prepareTx(value);
    } else {
      prepareField(field, value, newTx);
    }
  }

  return newTx;
};

exports.prepareTx = prepareTx;