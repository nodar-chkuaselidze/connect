"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

var _coins = _interopRequireDefault(require("../../../data/coins.json"));

var _CoinInfo = require("../CoinInfo");

describe('data/CoinInfo', () => {
  beforeAll(() => {
    (0, _CoinInfo.parseCoinsJson)(_coins.default);
  });
  it('getUniqueNetworks', () => {
    const inputs = [null, (0, _CoinInfo.getCoinInfo)('btc'), (0, _CoinInfo.getCoinInfo)('ltc'), (0, _CoinInfo.getCoinInfo)('btc'), (0, _CoinInfo.getCoinInfo)('ltc'), (0, _CoinInfo.getCoinInfo)('ltc')];
    const result = [(0, _CoinInfo.getCoinInfo)('btc'), (0, _CoinInfo.getCoinInfo)('ltc')];
    expect((0, _CoinInfo.getUniqueNetworks)(inputs)).toEqual(result);
  });
});