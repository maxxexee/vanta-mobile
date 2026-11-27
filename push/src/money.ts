/**
 * The amount line inside a push notification.
 *
 * Kept apart from the HTTP handler so the wording and the validation can be
 * tested without Postgres, VAPID keys or a live wallet. The client sends plain
 * numbers and the server owns the string: a notification can not be made to say
 * something the wallet did not.
 */

export type Money = { amount: number; symbol: string; usd: number | null };

export const MONEY_ITEMS_LIMIT = 4;
const SYMBOL_PATTERN = /^[A-Za-z0-9]{1,10}$/;
const AMOUNT_FORMAT = new Intl.NumberFormat('en-US', { maximumFractionDigits: 4 });

export function readMoney(value: unknown): Money | null {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return null;
  const record = value as Record<string, unknown>;
  const { amount, symbol, usd } = record;
  if (typeof amount !== 'number' || !Number.isFinite(amount) || amount <= 0 || amount > 1e15) return null;
  if (typeof symbol !== 'string' || !SYMBOL_PATTERN.test(symbol)) return null;
  const priced = typeof usd === 'number' && Number.isFinite(usd) && usd > 0 ? usd : null;
  return { amount, symbol, usd: priced };
}

/** `items` from the app, or the older flat `{ amount, symbol, usd }` shape. */
export function readMoneyList(body: Record<string, unknown> | null): Money[] {
  if (!body) return [];
  const raw = Array.isArray(body.items) ? body.items.slice(0, MONEY_ITEMS_LIMIT) : [body];
  return raw.map(readMoney).filter((money): money is Money => money !== null);
}

function formatMoney(money: Money): string {
  const amount = `${AMOUNT_FORMAT.format(money.amount)} ${money.symbol}`;
  return money.usd === null ? amount : `${amount} ($${money.usd.toFixed(2)})`;
}

export function arrivalBody(items: Money[], fallback: string): string {
  if (!items.length) return fallback;
  const named = items.map(formatMoney);
  const list = named.length < 2 ? named[0] : `${named.slice(0, -1).join(', ')} and ${named[named.length - 1]}`;
  return `${list} arrived in Vanta.`;
}
