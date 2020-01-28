"use strict";

var _interopRequireWildcard = require("@babel/runtime/helpers/interopRequireWildcard");

exports.__esModule = true;
exports.initInvalidPassphraseView = void 0;

var _builder = require("../../message/builder");

var UI = _interopRequireWildcard(require("../../constants/ui"));

var _common = require("./common");

const initInvalidPassphraseView = payload => {
  (0, _common.showView)('invalid-passphrase');

  const confirmButton = _common.container.getElementsByClassName('confirm')[0];

  const cancelButton = _common.container.getElementsByClassName('cancel')[0];

  confirmButton.onclick = () => {
    (0, _common.postMessage)((0, _builder.UiMessage)(UI.INVALID_PASSPHRASE_ACTION, false));
    (0, _common.showView)('loader');
  };

  cancelButton.onclick = () => {
    (0, _common.postMessage)((0, _builder.UiMessage)(UI.INVALID_PASSPHRASE_ACTION, true));
    (0, _common.showView)('loader');
  };
};

exports.initInvalidPassphraseView = initInvalidPassphraseView;