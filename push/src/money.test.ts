import assert from 'node:assert/strict';
import test from 'node:test';
import { arrivalBody, describeDeposits, readMoneyList } from './money.ts';

const money = (amount: number, symbol: string, usd: number | null) => ({ amount, symbol, usd });
const FALLBACK = 'Someone sent you money in Vanta.';

test('a priced amount reads as amount, symbol and dollars', () => {
  assert.equal(
    arrivalBody([money(2.5, 'SOL', 370)], FALLBACK),
    '2.5 SOL ($370.00) arrived in Vanta.',
  );
});

test('a token without a price is named without dollars', () => {
  assert.equal(arrivalBody([money(10, 'USDC', null)], FALLBACK), '10 USDC arrived in Vanta.');
});

test('several notes in one sync are listed in one sentence', () => {
  assert.equal(
    arrivalBody([money(2.5, 'SOL', 370), money(10, 'USDC', 10), money(1, 'USDT', 1)], FALLBACK),
    '2.5 SOL ($370.00), 10 USDC ($10.00) and 1 USDT ($1.00) arrived in Vanta.',
  );
});

test('amounts keep four decimals at most', () => {
  assert.equal(arrivalBody([money(0.00012345, 'SOL', null)], FALLBACK), '0.0001 SOL arrived in Vanta.');
});

test('nothing usable keeps the generic message', () => {
  assert.equal(arrivalBody([], FALLBACK), FALLBACK);
});

test('items are read from the app payload and capped', () => {
  const items = Array.from({ length: 7 }, (_, i) => money(i + 1, 'SOL', null));
  assert.equal(readMoneyList({ items }).length, 4);
});

test('a flat money body still works', () => {
  assert.deepEqual(readMoneyList({ amount: 3, symbol: 'SOL', usd: 300 }), [money(3, 'SOL', 300)]);
});

const usdc = async () => ({ symbol: 'USDC', decimals: 6 });

test('raw balance increases become named amounts', async () => {
  const items = await describeDeposits(
    [
      { asset: 'SOL', raw: 1_500_000_000 },
      { asset: 'usdc-mint', raw: 12_500_000 },
    ],
    usdc,
  );
  assert.deepEqual(items, [money(1.5, 'SOL', null), money(12.5, 'USDC', null)]);
  assert.equal(arrivalBody(items, FALLBACK), '1.5 SOL and 12.5 USDC arrived in Vanta.');
});

test('a mint the chain cannot describe is left out', async () => {
  const items = await describeDeposits([{ asset: 'unknown', raw: 5 }], async () => null);
  assert.deepEqual(items, []);
});

test('zero and negative increases are ignored', async () => {
  const items = await describeDeposits(
    [
      { asset: 'SOL', raw: 0 },
      { asset: 'SOL', raw: -1 },
    ],
    usdc,
  );
  assert.deepEqual(items, []);
});

test('invalid amounts and symbols are dropped, not rendered', () => {
  assert.deepEqual(readMoneyList({ items: [money(-1, 'SOL', null)] }), []);
  assert.deepEqual(readMoneyList({ items: [money(Number.NaN, 'SOL', null)] }), []);
  assert.deepEqual(readMoneyList({ items: [money(1, 'SO L', null)] }), []);
  assert.deepEqual(readMoneyList({ items: [money(1, '<b>', null)] }), []);
  assert.deepEqual(readMoneyList({ items: [money(1, 'SOL', -5)] }), [money(1, 'SOL', null)]);
});
