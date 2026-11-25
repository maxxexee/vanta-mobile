/**
 * Prove the lost-reply recovery finds the right transaction — and only that one.
 *
 * The fixture is real: the first Shield into the Privacy Rings 1.0 pool on
 * 2026-11-25, the path that now ships. If this pass stops passing, the recovery
 * has stopped being able to recognise our own deposit, and a lost reply would go
 * back to costing the user a row and a success page.
 *
 *   node scripts/pending-shield-recover-check.mjs
 */
import { findLandedDeposit, POOL_PROGRAM } from '../web/core/pendingShield.js'

const RPC = process.env.VITE_PUBLIC_RPC || 'https://api.devnet.solana.com'

// The real 1.0 deposit, verbatim from the chain.
const DEPOSITOR = 'Bp2CKd3rKLwBupFXGvg46rpQuuMzPGwqh3g9kKGyw3fF'
const DEPOSIT = '35a6WEJWXJSyGdxy2do18SsTAEhiYbC5cUt3Bzz9LLJh9UzCVxKHdDpxn4mJBErjtFBLBtofi6y91RUqrRwYEXRc'
const DEPOSIT_SLOT = 525961591
const DEPOSIT_TIME = 1795564512 // chain blockTime, seconds
const STRANGER = '6zfATGzn1DyX3ufeU8wkLs3uJtGY6M2EUyxNn6Gypq1T'

const results = []
async function check(name, expected, args) {
  let actual
  try {
    const found = await findLandedDeposit({ rpcUrl: RPC, poolProgram: POOL_PROGRAM, ...args })
    actual = found?.signature ?? null
  } catch (err) {
    results.push([name, false, `threw: ${err?.message ?? err}`])
    return
  }
  // `expected` may be a predicate when the right answer is "anything but this".
  const ok = typeof expected === 'function' ? expected(actual) : actual === expected
  results.push([name, ok, `got ${actual ? actual.slice(0, 12) + '…' : 'null'}`])
}

// Found: a wallet that never heard back about a deposit it did send.
await check('recovers the deposit the wallet broadcast', DEPOSIT, {
  depositor: DEPOSITOR, sinceSlot: DEPOSIT_SLOT,
})

// Widened window (no slot) still finds it, but only with the time bound.
await check('recovers with a time bound instead of a slot', DEPOSIT, {
  depositor: DEPOSITOR, notBeforeMs: (DEPOSIT_TIME - 3600) * 1000,
})

// Never the OLD deposit. The window opens after it, so whatever comes back —
// including nothing at all — must not be the deposit the wallet already had.
// This is the guard against filing a previous Shield as the one that just
// failed. It is written as "anything but DEPOSIT" rather than as `null`
// because this fixture is a LIVE chain: the wallet has shielded repeatedly
// since, so a stricter expectation would rot every time it does.
await check('refuses a transaction older than the attempt', (sig) => sig !== DEPOSIT, {
  depositor: DEPOSITOR, sinceSlot: DEPOSIT_SLOT + 1,
})

// Not found: outside the time window, even though the chain still has it.
await check('refuses a deposit outside the time window', null, {
  depositor: DEPOSITOR, notBeforeMs: Date.now() + 60_000,
})

// Not found: a different wallet. The record names the depositor, so this is the
// line between "our deposit" and "somebody else's". It used to hand back
// MWBx3zCZ9a3Y… — a pool transaction that merely CO-SIGNS with that wallet and
// moves none of its money — because nothing checked that a deposit actually
// moves the depositor's balance.
await check('refuses another wallet’s activity', null, {
  depositor: STRANGER, sinceSlot: 0,
})

console.log('── pending-Shield recovery ──')
for (const [name, ok, detail] of results) console.log(`${ok ? '✓' : '✗'} ${name}  (${detail})`)

const passed = results.filter(([, ok]) => ok).length
console.log(`════ ${passed}/${results.length} ════`)
process.exitCode = passed === results.length ? 0 : 1
