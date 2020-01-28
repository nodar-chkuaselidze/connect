"use strict";

var _interopRequireWildcard = require("@babel/runtime/helpers/interopRequireWildcard");

exports.__esModule = true;
exports.selectAccount = void 0;

var _builder = require("../../message/builder");

var UI = _interopRequireWildcard(require("../../constants/ui"));

var _common = require("./common");

const setHeader = payload => {
  const h3 = _common.container.getElementsByTagName('h3')[0];

  if (payload.type === 'end') {
    h3.innerHTML = `Select ${payload.coinInfo.label} account`;
  } else {
    h3.innerHTML = `Loading ${payload.coinInfo.label} accounts...`;
  }
};

const selectAccount = payload => {
  if (!payload) return;
  const {
    accountTypes,
    accounts
  } = payload; // first render
  // show "select-account" view
  // configure tabs

  if (Array.isArray(accountTypes)) {
    (0, _common.showView)('select-account'); // setHeader(payload);

    if (accountTypes.length > 1) {
      const tabs = _common.container.getElementsByClassName('tabs')[0];

      tabs.style.display = 'flex';

      const selectAccountContainer = _common.container.getElementsByClassName('select-account')[0];

      const buttons = tabs.getElementsByClassName('tab-selection');
      let button;

      for (button of buttons) {
        const type = button.getAttribute('data-tab');

        if (type && accountTypes.indexOf(type) >= 0) {
          button.onclick = event => {
            selectAccountContainer.className = 'select-account ' + type;
          };
        } else {
          tabs.removeChild(button);
        }
      }
    } // return;

  } // set header


  setHeader(payload);
  if (!accounts) return;
  const buttons = {
    'normal': _common.container.querySelectorAll('.select-account-list.normal')[0],
    'segwit': _common.container.querySelectorAll('.select-account-list.segwit')[0],
    'legacy': _common.container.querySelectorAll('.select-account-list.legacy')[0]
  };

  const handleClick = event => {
    if (!(event.currentTarget instanceof HTMLElement)) return;
    const index = event.currentTarget.getAttribute('data-index');
    (0, _common.postMessage)((0, _builder.UiMessage)(UI.RECEIVE_ACCOUNT, parseInt(index)));
    (0, _common.showView)('loader');
  };

  const removeEmptyButton = buttonContainer => {
    const defaultButton = buttonContainer.querySelectorAll('.account-default')[0];

    if (defaultButton) {
      buttonContainer.removeChild(defaultButton);
    }
  };

  const updateButtonValue = (button, account) => {
    if (button.innerHTML.length < 1) {
      button.innerHTML = `
                <span class="account-title"></span>
                <span class="account-status"></span>`;
    }

    const title = button.getElementsByClassName('account-title')[0];
    const status = button.getElementsByClassName('account-status')[0];
    title.innerHTML = account.label; // TODO: Disable button once an account is fully loaded and its balance is 0

    if (typeof account.balance !== 'string') {
      status.innerHTML = 'Loading...';
      button.disabled = true;
    } else {
      status.innerHTML = account.empty ? 'New account' : account.balance;
      button.disabled = false;

      if (payload.preventEmpty) {
        button.disabled = account.empty === true;
      } else {
        button.disabled = false;
      }

      if (!button.disabled) {
        button.onclick = handleClick;
      }
    }
  };

  for (const [index, account] of accounts.entries()) {
    const buttonContainer = buttons[account.type];
    const existed = buttonContainer.querySelectorAll(`[data-index="${index}"]`)[0];

    if (!existed) {
      const button = document.createElement('button');
      button.className = 'list';
      button.setAttribute('data-index', index.toString());
      updateButtonValue(button, account);
      removeEmptyButton(buttonContainer);
      buttonContainer.appendChild(button);
    } else {
      updateButtonValue(existed, account);
    }
  }
};

exports.selectAccount = selectAccount;