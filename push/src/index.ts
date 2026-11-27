import { Pool } from 'pg';
import webpush from 'web-push';
import { attachDatabasePool } from '@neon/functions';
import { parseTriggerDelivery } from '@neon/functions/triggers';
import { arrivalBody, describeDeposits, readMoneyList, type BalanceIncrease, type TokenMeta } from './money';

const pool = new Pool({ connectionString: process.env.DATABASE_URL, max: 5 });
attachDatabasePool(pool);

webpush.setVapidDetails(
  process.env.VAPID_SUBJECT as string,
  process.env.VAPID_PUBLIC_KEY as string,
  process.env.VAPID_PRIVATE_KEY as string,
);

const TOKEN_PROGRAM = 'TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA';
const ADDRESS_PATTERN = /^[1-9A-HJ-NP-Za-km-z]{32,44}$/;
const MAX_ADDRESSES_PER_RUN = 200;
// A send can arrive while the app is open and the recipient is not watching,
// so a sender-side ping is the only way to make a private transfer visible to
// a watcher that can only read public state.
const PING_COOLDOWN_SECONDS = 20;
const BODY_LIMIT_BYTES = 16 * 1024;

let schemaReady: Promise<void> | null = null;

function ensureSchema(): Promise<void> {
  if (!schemaReady) {
    schemaReady = pool
      .query(
        `create table if not exists push_subs (
           endpoint text primary key,
           address text not null,
           subscription jsonb not null,
           last_seen jsonb,
           created_at timestamptz not null default now()
         );
         create index if not exists push_subs_address_idx on push_subs (address);
         create table if not exists push_pings (
           address text primary key,
           at timestamptz not null default now()
         );`,
      )
      .then(() => undefined)
      .catch((err) => {
        schemaReady = null;
        throw err;
      });
  }
  return schemaReady;
}

function cors(request: Request): Record<string, string> {
  const origin = request.headers.get('origin') ?? '';
  const allowed = process.env.ALLOWED_ORIGIN ?? '';
  return {
    'access-control-allow-origin': origin === allowed ? origin : allowed,
    'access-control-allow-methods': 'GET, POST, OPTIONS',
    'access-control-allow-headers': 'content-type',
    vary: 'origin',
  };
}

function json(body: unknown, status: number, headers: Record<string, string>): Response {
  return Response.json(body, { status, headers });
}

async function readJson(request: Request): Promise<Record<string, unknown> | null> {
  const length = Number(request.headers.get('content-length') ?? '0');
  if (length > BODY_LIMIT_BYTES) return null;
  try {
    const body = await request.json();
    return body && typeof body === 'object' ? (body as Record<string, unknown>) : null;
  } catch {
    return null;
  }
}

function readSubscription(value: unknown): PushSubscriptionJSON | null {
  if (!value || typeof value !== 'object') return null;
  const sub = value as PushSubscriptionJSON;
  if (typeof sub.endpoint !== 'string' || !sub.endpoint.startsWith('https://')) return null;
  if (!sub.keys || typeof sub.keys.p256dh !== 'string' || typeof sub.keys.auth !== 'string') return null;
  return sub;
}

async function rpc<T>(method: string, params: unknown[]): Promise<T> {
  const res = await fetch(process.env.SOLANA_RPC_URL as string, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ jsonrpc: '2.0', id: 1, method, params }),
  });
  if (!res.ok) throw new Error(`rpc ${method} answered ${res.status}`);
  const body = (await res.json()) as { result?: T; error?: { message?: string } };
  if (body.error) throw new Error(body.error.message ?? `rpc ${method} failed`);
  if (body.result === undefined) throw new Error(`rpc ${method} returned nothing`);
  return body.result;
}

type TokenAccounts = {
  value: Array<{ account: { data: { parsed: { info: { mint: string; tokenAmount: { amount: string } } } } } }>;
};

/** Public balances keyed by asset, used only to detect an increase. */
async function observeBalances(address: string): Promise<Record<string, number>> {
  const [sol, tokens] = await Promise.all([
    rpc<{ value: number }>('getBalance', [address]),
    rpc<TokenAccounts>('getTokenAccountsByOwner', [
      address,
      { programId: TOKEN_PROGRAM },
      { encoding: 'jsonParsed' },
    ]),
  ]);
  const balances: Record<string, number> = { SOL: sol.value };
  for (const account of tokens.value ?? []) {
    const info = account.account.data.parsed.info;
    const raw = Number(info.tokenAmount.amount);
    if (!Number.isFinite(raw)) continue;
    balances[info.mint] = (balances[info.mint] ?? 0) + raw;
  }
  return balances;
}

function increases(previous: Record<string, number>, next: Record<string, number>): BalanceIncrease[] {
  const out: BalanceIncrease[] = [];
  for (const [asset, amount] of Object.entries(next)) {
    const delta = amount - (previous[asset] ?? 0);
    if (delta > 0) out.push({ asset, raw: delta });
  }
  return out;
}

type AssetRecord = {
  content?: { metadata?: { symbol?: string } };
  token_info?: { symbol?: string; decimals?: number };
};

// The mints Vanta supports, so a wallet knows its own tokens even when the
// RPC's metadata is empty. Anything else falls back to its on-chain symbol.
const KNOWN_TOKENS: Record<string, string> = {
  EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v: 'USDC',
  Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB: 'USDT',
  '4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU': 'USDC',
  '4oG4sjmopf5MzvTHLE8rpVJ2uyczxfsw2K84SUTpNDx7': 'dUSDC',
};
const tokenMetaCache = new Map<string, TokenMeta>();

/** Decimals and a display symbol for one SPL mint, cached per instance. */
async function tokenMeta(mint: string): Promise<TokenMeta | null> {
  const cached = tokenMetaCache.get(mint);
  if (cached) return cached;

  const asset = await rpc<AssetRecord>('getAsset', [mint]).catch(() => null);
  const info = asset?.token_info;
  let decimals = typeof info?.decimals === 'number' ? info.decimals : null;
  if (decimals === null) {
    const supply = await rpc<{ value: { decimals: number } }>('getTokenSupply', [mint]).catch(() => null);
    decimals = typeof supply?.value?.decimals === 'number' ? supply.value.decimals : null;
  }
  if (decimals === null || decimals < 0 || decimals > 18) return null;

  const candidates = [KNOWN_TOKENS[mint], asset?.content?.metadata?.symbol, info?.symbol];
  const named = candidates.find(
    (value): value is string => typeof value === 'string' && /^[A-Za-z0-9]{1,10}$/.test(value),
  );
  const meta = { decimals, symbol: named ?? `${mint.slice(0, 4)}…${mint.slice(-3)}` };
  tokenMetaCache.set(mint, meta);
  return meta;
}

async function pushTo(endpoint: string, subscription: PushSubscriptionJSON, title: string, body: string) {
  try {
    await webpush.sendNotification(subscription as webpush.PushSubscription, JSON.stringify({ title, body, url: './' }), {
      TTL: 300,
    });
    return true;
  } catch (err) {
    const status = (err as { statusCode?: number }).statusCode;
    if (status === 404 || status === 410) {
      await pool.query('delete from push_subs where endpoint = $1', [endpoint]);
    } else {
      console.warn('[push] delivery failed', endpoint.slice(0, 32), status ?? (err as Error).message);
    }
    return false;
  }
}

async function handleSubscribe(request: Request, corsHeaders: Record<string, string>): Promise<Response> {
  const body = await readJson(request);
  const address = typeof body?.address === 'string' ? body.address : '';
  const subscription = readSubscription(body?.subscription);
  if (!ADDRESS_PATTERN.test(address) || !subscription) {
    return json({ error: 'invalid subscription' }, 400, corsHeaders);
  }
  await pool.query(
    `insert into push_subs (endpoint, address, subscription, last_seen)
     values ($1, $2, $3, null)
     on conflict (endpoint) do update
       set address = excluded.address,
           subscription = excluded.subscription`,
    [subscription.endpoint, address, JSON.stringify(subscription)],
  );
  return json({ ok: true }, 200, corsHeaders);
}

async function handleUnsubscribe(request: Request, corsHeaders: Record<string, string>): Promise<Response> {
  const body = await readJson(request);
  const endpoint = typeof body?.endpoint === 'string' ? body.endpoint : '';
  if (!endpoint) return json({ error: 'missing endpoint' }, 400, corsHeaders);
  await pool.query('delete from push_subs where endpoint = $1', [endpoint]);
  return json({ ok: true }, 200, corsHeaders);
}

async function handleNotify(request: Request, corsHeaders: Record<string, string>): Promise<Response> {
  const body = await readJson(request);
  const address = typeof body?.address === 'string' ? body.address : '';
  if (!ADDRESS_PATTERN.test(address)) return json({ error: 'invalid address' }, 400, corsHeaders);
  // The device that discovered the note has already shown it. Skipping its own
  // endpoint keeps the push for the other devices on the same wallet.
  const skip = typeof body?.skip === 'string' ? body.skip : '';

  const allowed = await pool.query(
    `insert into push_pings (address, at) values ($1, now())
     on conflict (address) do update set at = now()
     where push_pings.at < now() - ($2 || ' seconds')::interval
     returning address`,
    [address, PING_COOLDOWN_SECONDS],
  );
  if (allowed.rowCount === 0) return json({ error: 'slow down' }, 429, corsHeaders);

  const rows = await pool.query('select endpoint, subscription from push_subs where address = $1', [address]);
  const targets = rows.rows.filter((row) => row.endpoint !== skip);
  const message = arrivalBody(readMoneyList(body), 'Someone sent you money in Vanta.');
  await Promise.all(targets.map((row) => pushTo(row.endpoint, row.subscription, 'Money arrived', message)));
  return json({ ok: true, delivered: targets.length }, 200, corsHeaders);
}

async function handleCron(request: Request): Promise<Response> {
  const parsed = await parseTriggerDelivery(request);
  if (!parsed.ok) {
    return new Response(parsed.error, { status: parsed.error === 'invalid_body' ? 400 : 401 });
  }

  const rows = await pool.query(
    `select endpoint, address, subscription, last_seen
       from push_subs
      order by created_at
      limit $1`,
    [MAX_ADDRESSES_PER_RUN],
  );

  const byAddress = new Map<string, Array<{ endpoint: string; subscription: PushSubscriptionJSON; lastSeen: Record<string, number> | null }>>();
  for (const row of rows.rows) {
    const list = byAddress.get(row.address) ?? [];
    list.push({ endpoint: row.endpoint, subscription: row.subscription, lastSeen: row.last_seen });
    byAddress.set(row.address, list);
  }

  let notified = 0;
  for (const [address, subs] of byAddress) {
    let observed: Record<string, number>;
    try {
      observed = await observeBalances(address);
    } catch (err) {
      console.warn('[push] could not read', address.slice(0, 8), (err as Error).message);
      continue;
    }

    for (const sub of subs) {
      // The first observation is the baseline: subscribing does not announce a
      // balance that was already there.
      if (!sub.lastSeen) {
        await pool.query('update push_subs set last_seen = $2 where endpoint = $1', [
          sub.endpoint,
          JSON.stringify(observed),
        ]);
        continue;
      }
      const landed = await describeDeposits(increases(sub.lastSeen, observed), tokenMeta);
      if (landed.length) {
        const body = arrivalBody(landed, 'A deposit landed in your Vanta wallet.');
        const sent = await pushTo(sub.endpoint, sub.subscription, 'Money arrived', body);
        if (sent) notified++;
      }
      await pool.query('update push_subs set last_seen = $2 where endpoint = $1', [
        sub.endpoint,
        JSON.stringify(observed),
      ]);
    }
  }

  return Response.json({ ok: true, addresses: byAddress.size, notified });
}

export default {
  async fetch(request: Request): Promise<Response> {
    const corsHeaders = cors(request);
    if (request.method === 'OPTIONS') return new Response(null, { status: 204, headers: corsHeaders });

    const path = new URL(request.url).pathname;

    try {
      if (path === '/config' && request.method === 'GET') {
        return json({ vapidPublicKey: process.env.VAPID_PUBLIC_KEY }, 200, corsHeaders);
      }
      if (path === '/cron' && request.method === 'POST') return await handleCron(request);
      if (request.method !== 'POST') return json({ error: 'not found' }, 404, corsHeaders);

      await ensureSchema();
      if (path === '/subscribe') return await handleSubscribe(request, corsHeaders);
      if (path === '/unsubscribe') return await handleUnsubscribe(request, corsHeaders);
      if (path === '/notify') return await handleNotify(request, corsHeaders);
      return json({ error: 'not found' }, 404, corsHeaders);
    } catch (err) {
      console.error('[push] request failed', path, (err as Error).message);
      return json({ error: 'server error' }, 500, corsHeaders);
    }
  },
};
