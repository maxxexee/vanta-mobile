// ── A Shield that was broadcast but never acknowledged ───────────────────────
//
// Why this exists (found on a real phone, 2026-09-28). MWA's answer travels
// over a localhost socket between the WebView and the wallet app. The moment the
// wallet takes the foreground the WebView stops servicing that socket, so an
// answer sent while it is in front — or a reply to an association the wallet
// closes as it answers — can simply be lost. Meanwhile the deposit is already on
// chain, because the wallet broadcast it.
//
// Before this module, a lost reply was indistinguishable from a failed deposit,
// and that cost the user four things at once:
//   · a "Shield failed" toast for money that had moved,
//   · no history row (addTxn only ran after the call resolved),
//   · no success page (same reason),
//   · and, because the incoming-credit reservation was dropped as if nothing had
//     happened, a later sync could file the deposit as "Received 0.05 SOL
//     privately" — a receipt for a payment the user made to themselves.
// Reloading mid-flight did the same damage by discarding the in-progress call.
//
// So a Shield is written down BEFORE the wallet is asked to sign, and cleared
// only once the app knows the outcome. If the reply is lost, or the app is
// reloaded, the record is reconciled against the chain: find the deposit the
// wallet actually sent, and give it the row and the success page it earned.
//
// The lookup is deliberately narrow — a transaction by THIS depositor, touching
// the pool program, at or after the slot we were on when we tried. That is
// specific enough that an older deposit or an unrelated transfer cannot be
// mistaken for this one, and it needs no signature from the wallet, which is the
// whole point.

const PENDING_KEY = 'vanta-pending-shield'

// Past this, a record is stale rather than pending: the deposit either landed
// (and the sync below already shows it) or it never will.
const MAX_AGE_MS = 10 * 60 * 1000

// The Privacy Rings 1.0 pool and registry, the same ids relayer/server.js
// allowlists and @heliuslabs/spr exports. Duplicated rather than plumbed through
// props: this module recognises a Vanta deposit without the SDK loaded.
export const POOL_PROGRAM = 'ring1GaLCuJnkUMVkX2JeZLTTX17wKsV4fZmPVzXANW'
export const REGISTRY_PROGRAM = 'regy3WAeRXMYuMYxr5iK3Bf9Arr3PcxGxyzAddbiqDQ'

/** Write the record. Call this BEFORE the wallet is asked to sign anything. */
export function savePendingShield({ amount, symbol, depositor, sinceSlot = null, program = null, mint = null }) {
  try {
    localStorage.setItem(PENDING_KEY, JSON.stringify({
      amount, symbol, depositor, sinceSlot, program, mint, at: Date.now(),
    }))
  } catch (err) {
    // A private-mode localStorage must not stop a Shield; it only costs us the
    // ability to reconcile this one if the reply is lost.
    console.warn('[vanta] could not persist the pending Shield:', err?.message ?? err)
  }
}

/** The record, if one is still worth reconciling. Null otherwise. */
export function loadPendingShield() {
  let raw
  try {
    raw = JSON.parse(localStorage.getItem(PENDING_KEY) || 'null')
  } catch {
    return null
  }
  if (!raw?.depositor || !raw?.amount) return null
  if (Date.now() - (raw.at ?? 0) > MAX_AGE_MS) return null
  return raw
}

export function clearPendingShield() {
  try {
    localStorage.removeItem(PENDING_KEY)
  } catch {
    /* nothing to do — a stale record expires on its own */
  }
}

/** Current slot, or null. Best-effort: a null only widens the recovery window. */
export async function readSlot(rpcUrl) {
  try {
    const { Connection } = await import('@solana/web3.js')
    return await new Connection(rpcUrl, 'confirmed').getSlot()
  } catch (err) {
    console.warn('[vanta] could not read the slot before a Shield:', err?.message ?? err)
    return null
  }
}

/**
 * The deposit this depositor actually sent, or null if there is none.
 *
 * Newest-first scan, stopped as soon as it leaves the window, so the cost is one
 * or two RPC calls in the normal case rather than a walk through history.
 */
// Every fee Vanta has actually measured on the pool: 5,000 lamports relayer-
// paid, 25,000 device-wallet-paid. A candidate whose depositor lost no more than
// that moved none of its own money, so it is not a deposit.
const MAX_FEE_LAMPORTS = 25_000

// Static account keys arrive as PublicKey (json), as {pubkey} (jsonParsed) or as
// a base58 string. All three have to compare equal to `depositor`.
const toKeyString = (key) =>
  key?.toBase58
    ? key.toBase58()
    : key?.pubkey?.toBase58
      ? key.pubkey.toBase58()
      : String(key)

/** How much of `mint` the depositor lost in this transaction, in base units. */
function tokenDelta(meta, depositor, mint) {
  const sum = (rows) => {
    let total = 0n
    for (const row of rows ?? []) {
      if (String(row.mint) !== mint || String(row.owner) !== depositor) continue
      total += BigInt(row.uiTokenAmount?.amount ?? 0)
    }
    return total
  }
  const delta = sum(meta.preTokenBalances) - sum(meta.postTokenBalances)
  return delta > 0n ? delta : 0n
}

/**
 * Every pool deposit this public address has made, newest first.
 *
 * Used when the private indexer is down: the deposit is on chain but the SDK
 * never handed the client a note for it, so without this the swept money is
 * invisible until an indexer returns. Recognition is the same as the recovery
 * lookup above (this depositor, the pool program, own money out), so an
 * unrelated pool transaction cannot be mistaken for a deposit.
 */
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms))

// The public RPC limits these calls hard. A backfill is not urgent enough to
// fail the page over, but three attempts usually outlast the window.
async function retrying(fn, attempts = 3) {
  let last = null
  for (let i = 0; i < attempts; i++) {
    try {
      return await fn()
    } catch (err) {
      last = err
      await sleep(400 * (i + 1))
    }
  }
  throw last
}

export async function listLandedDeposits({
  rpcUrl, depositor, limit = 20, poolProgram = POOL_PROGRAM,
}) {
  const { Connection, PublicKey } = await import('@solana/web3.js')
  const connection = new Connection(rpcUrl, 'confirmed')
  const candidates = await retrying(() =>
    connection.getSignaturesForAddress(new PublicKey(depositor), { limit }),
  )
  const found = []
  // A rate-limited read must not look like "no such deposit": the caller only
  // caches a scan that saw every candidate.
  let incomplete = false

  for (const info of candidates) {
    if (info.err) continue
    await sleep(100)
    const tx = await retrying(() =>
      connection.getTransaction(info.signature, {
        commitment: 'confirmed',
        maxSupportedTransactionVersion: 1,
      }),
    ).catch(() => {
      incomplete = true
      return null
    })
    if (!tx?.meta || tx.meta.err) continue

    const message = tx.transaction?.message
    const keys = (message?.staticAccountKeys ?? message?.accountKeys ?? []).map(toKeyString)
    const owner = keys.indexOf(depositor)
    if (owner < 0 || !keys.includes(poolProgram)) continue

    // SPL first: its lamport outflow is only the fee.
    const moved = []
    const seenMints = new Set()
    for (const row of tx.meta.preTokenBalances ?? []) {
      if (String(row.owner) !== depositor) continue
      const mint = String(row.mint)
      // The same mint can appear once per token account; its delta is summed.
      if (seenMints.has(mint)) continue
      seenMints.add(mint)
      const delta = tokenDelta(tx.meta, depositor, mint)
      if (delta > 0n) {
        const decimals = Number(row.uiTokenAmount?.decimals ?? 0)
        moved.push({ mint, decimals, amount: Number(delta) / 10 ** decimals })
      }
    }
    if (moved.length === 1 && moved[0].amount > 0) {
      found.push({ signature: info.signature, slot: info.slot, blockTime: info.blockTime ?? null, ...moved[0] })
      continue
    }

    const outflow = (tx.meta.preBalances[owner] ?? 0) - (tx.meta.postBalances[owner] ?? 0)
    if (outflow <= MAX_FEE_LAMPORTS) continue
    found.push({
      signature: info.signature,
      slot: info.slot,
      blockTime: info.blockTime ?? null,
      mint: null,
      decimals: 9,
      amount: outflow / 1e9,
    })
  }

  return { deposits: found, incomplete }
}

export async function findLandedDeposit({
  rpcUrl, depositor, sinceSlot = null, notBeforeMs = null, poolProgram = POOL_PROGRAM, mint = null,
}) {
  const { Connection, PublicKey } = await import('@solana/web3.js')
  const connection = new Connection(rpcUrl, 'confirmed')
  // 8 was too few. A wallet that has shielded, shadowed and ghosted since the
  // attempt pushes the real deposit out of the window and the recovery finds
  // nothing — caught by scripts/pending-shield-recover-check.mjs going 5/5 -> 1/5
  // after a handful of real transactions.
  const candidates = await connection.getSignaturesForAddress(new PublicKey(depositor), { limit: 25 })

  const inWindow = []
  for (const info of candidates) {
    if (info.err) continue
    // Signatures come back newest first, so the first one outside the window
    // means every remaining candidate is too.
    if (sinceSlot && info.slot < sinceSlot) break
    if (notBeforeMs && (typeof info.blockTime !== 'number' || info.blockTime * 1000 < notBeforeMs)) break
    inWindow.push(info)
  }
  // Oldest first. The pending record is written BEFORE the wallet is asked to
  // sign, so the deposit being looked for is the first qualifying one at or
  // after the attempt — not whichever pool transaction this wallet touched most
  // recently, which is what newest-first returned and why "refuses another
  // wallet's activity" handed back someone else's Shadow.
  inWindow.reverse()

  for (const info of inWindow) {
    const tx = await connection.getTransaction(info.signature, {
      commitment: 'confirmed',
      maxSupportedTransactionVersion: 1,
    })
    if (!tx?.meta || tx.meta.err) continue

    // Legacy responses carry `accountKeys`, versioned ones `staticAccountKeys`.
    // Either way the pool program and the depositor are both static keys of a
    // deposit, which is all we need to recognise it.
    const message = tx.transaction?.message
    const keys = (message?.staticAccountKeys ?? message?.accountKeys ?? []).map(toKeyString)
    const owner = keys.indexOf(depositor)
    if (owner < 0 || !keys.includes(poolProgram)) continue

    // A DEPOSIT moves the depositor's own money into the pool. A Shadow — or any
    // other pool transaction the wallet merely co-signs — leaves its balance
    // down by the fee and nothing else, and there are plenty of those. Without
    // this the recovery happily filed an unrelated Shadow as the lost deposit,
    // which would have credited the wrong amount to the wrong receipt.
    if (mint) {
      // A SPL deposit moves a token balance, not lamports, so the SOL outflow
      // is only the fee. Detect it by the token balance falling for this mint.
      const delta = tokenDelta(tx.meta, depositor, mint)
      if (!(delta > 0n)) continue
      return { signature: info.signature, slot: info.slot }
    }

    const outflow = (tx.meta.preBalances[owner] ?? 0) - (tx.meta.postBalances[owner] ?? 0)
    if (outflow <= MAX_FEE_LAMPORTS) continue

    return { signature: info.signature, slot: info.slot }
  }

  return null
}
