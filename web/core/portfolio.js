// ── What the wallet actually holds ───────────────────────────────────────────
// The main screen used to paint invented balances. This module reads the two
// facts that can be read without a working indexer: the SOL price, and the SPL
// accounts owned by the public address. Everything else comes from the engine's
// state, so the screen can only show a number somebody measured.

const PRICE_URL =
  'https://lite-api.jup.ag/price/v3?ids=So11111111111111111111111111111111111111112'
const PRICE_TTL_MS = 60_000
const RPC_TIMEOUT_MS = 15_000

// SPL Token and Token-2022. Memecoins increasingly use 2022, so a read that
// only asks the classic program silently shows zero for them.
export const TOKEN_PROGRAM = 'TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA'
export const TOKEN_2022_PROGRAM = 'TokenzQdBNbLqP5VEhdkAS6EPFLC1PHnBqCXEpPxuEb'

// Tether on Solana mainnet. Devnet has no canonical USDT, so a devnet build has
// to name its own mint through VITE_USDT_MINT or the card stays hidden.
export const USDT_MINT =
  import.meta.env.VITE_USDT_MINT || 'Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB'

// USD Coin has a different mint on each cluster. The app has no cluster
// constant of its own, so it accepts any of the canonical ones and lets the
// deposit name the one that actually moved.
export const USDC_MINTS = {
  mainnet: 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v',
  devnet: '4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU',
}

export const STABLE_TOKEN_MINTS = new Set([USDT_MINT, ...Object.values(USDC_MINTS)])

/** Symbol for a mint this build can name, or an empty string. */
export function knownTokenSymbol(mint) {
  if (!mint) return ''
  if (mint === USDT_MINT) return 'USDT'
  if (Object.values(USDC_MINTS).includes(mint)) return 'USDC'
  return ''
}

let priceCache = { at: 0, value: null }

/** USD price of one SOL, or null when no price source answered. */
export async function solPriceUsd() {
  if (Date.now() - priceCache.at < PRICE_TTL_MS) return priceCache.value
  try {
    const res = await fetch(PRICE_URL, { signal: AbortSignal.timeout(8000) })
    if (!res.ok) throw new Error(`price ${res.status}`)
    const body = await res.json()
    const value = Number(body?.So11111111111111111111111111111111111111112?.usdPrice)
    if (!Number.isFinite(value) || value <= 0) throw new Error('no price in response')
    priceCache = { at: Date.now(), value }
    return value
  } catch (err) {
    console.warn('[portfolio] SOL price unavailable:', err?.message || err)
    priceCache = { at: Date.now(), value: null }
    return null
  }
}

async function rpc(rpcUrl, method, params) {
  const res = await fetch(rpcUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ jsonrpc: '2.0', id: 1, method, params }),
    signal: AbortSignal.timeout(RPC_TIMEOUT_MS),
  })
  const body = await res.json().catch(() => ({}))
  if (body?.error) throw new Error(body.error.message || 'RPC error')
  return body?.result
}

function readTokenAccounts(result, program) {
  const rows = []
  for (const item of result?.value || []) {
    const info = item?.account?.data?.parsed?.info
    const amount = Number(info?.tokenAmount?.uiAmountString ?? info?.tokenAmount?.uiAmount)
    if (!info?.mint || !Number.isFinite(amount) || amount <= 0) continue
    rows.push({
      mint: String(info.mint),
      amount,
      // The amount in this one account. A sweep sends from one account, so the
      // summed holding is not what can be moved in a single deposit.
      accountAmount: amount,
      decimals: Number(info.tokenAmount?.decimals ?? 0),
      // The account and its program are what a SPL deposit is built from.
      account: String(item.pubkey),
      program,
    })
  }
  return rows
}

// One mint can have several token accounts, and a sweep moves one account at a
// time. Keep the largest funded account per mint so the sweep has somewhere to
// send from, and sum the rest into the amount.
function keepLargestAccount(prior, row) {
  if (!prior) return row
  const largest = row.amount > prior.accountAmount
  return {
    ...prior,
    amount: prior.amount + row.amount,
    ...(largest
      ? {
          account: row.account,
          program: row.program,
          accountAmount: row.amount,
          decimals: row.decimals,
        }
      : {}),
  }
}

/**
 * Native SOL and every nonzero SPL balance at `owner`.
 *
 * The SOL read is load-bearing, so it throws. A token-program read that fails
 * yields no rows for that program instead of failing the screen: an empty SPL
 * list is a smaller lie than hiding the SOL balance behind an error.
 */
export async function fetchHoldings({ owner, rpcUrl }) {
  if (!owner) throw new Error('No wallet address')
  const [lamports, classic, token2022] = await Promise.all([
    rpc(rpcUrl, 'getBalance', [owner, { commitment: 'confirmed' }]),
    rpc(rpcUrl, 'getTokenAccountsByOwner', [
      owner,
      { programId: TOKEN_PROGRAM },
      { encoding: 'jsonParsed', commitment: 'confirmed' },
    ]).catch(() => null),
    rpc(rpcUrl, 'getTokenAccountsByOwner', [
      owner,
      { programId: TOKEN_2022_PROGRAM },
      { encoding: 'jsonParsed', commitment: 'confirmed' },
    ]).catch(() => null),
  ])

  if (typeof lamports?.value !== 'number') throw new Error('Could not read the wallet balance')

  // One mint can have several token accounts. The holding is their sum.
  const byMint = new Map()
  for (const row of [
    ...readTokenAccounts(classic, TOKEN_PROGRAM),
    ...readTokenAccounts(token2022, TOKEN_2022_PROGRAM),
  ]) {
    byMint.set(row.mint, keepLargestAccount(byMint.get(row.mint), row))
  }

  return {
    sol: lamports.value / 1e9,
    tokens: [...byMint.values()],
  }
}
