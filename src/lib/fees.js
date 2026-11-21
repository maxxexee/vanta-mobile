// What a Vanta transaction costs, and where the fee goes.
//
// Why this module exists: a privacy wallet that only says what it took after the
// money has left reads as a trap, however small the number. The deposit sheet
// and the send sheet both price from here, so the number quoted when money goes
// in cannot drift from the number quoted when it comes out.
//
// Three costs, owed to different parties:
//   · the Solana network fee, measured rather than guessed (the 25,000-lamport
//     deposit is receipted in lib/tokens; a spend is one signature, 5,000)
//   · Vanta's cut, a percentage with a dollar ceiling so a large transfer never
//     gets a large bill (see "the cap" below)
//   · rent for a note account, ~0.0007 SOL, which is capital rather than burn
//     and is why small payments are not charged on-chain
//
// THE CAP. `VANTA_FEE_BPS` alone would charge $50 on a $10,000 transfer and
// hand the privacy-wallet comparison to anyone charging 0.3%. Capping in
// dollars keeps one sentence true at every size: a quarter of a percent, never
// more than five dollars.
//
// THE PRICE. The cap is in dollars and the transfer is in SOL, so there is a
// fixed conversion here. That is a deliberate devnet simplification: before
// mainnet this must read a real price, or the cap quietly drifts with SOL.
//
// WHERE THE FEE GOES. `VANTA_TREASURY` is a Vanta shielded identity, so the fee
// is collected as a private transfer to it and the amount of Vanta's revenue
// never becomes a public number. It is collected as a SECOND transaction,
// because this SDK version cannot split one payment between two recipients
// (see `chargeFee` in App.jsx). If the treasury is not configured the fee is
// off entirely: the app must never advertise a cut it cannot collect.

import { NETWORK_FEE_SOL } from './tokens'

/** A Shadow or Ghost is one signature: no compute budget, no priority fee. */
export const SPEND_FEE_SOL = 0.000005

/** Deposit cost when the connected wallet is the fee payer (the MWA path). */
export const DEPOSIT_FEE_SOL = NETWORK_FEE_SOL

/** Basis points Vanta keeps on a private send. 25 bps = 0.25%. */
export const VANTA_FEE_BPS = 25

/** The most a single send can be charged, in dollars. */
export const VANTA_FEE_CAP_USD = 5

/** Devnet assumption only. The cap is meaningless without a price. */
export const SOL_USD_ASSUMPTION = 150

/** The treasury's Vanta address. Empty means the fee is off. */
export const VANTA_TREASURY = import.meta.env.VITE_VANTA_TREASURY ?? ''

/** True only when there is both a rate and somewhere for the money to land. */
export const feeEnabled = () => VANTA_FEE_BPS > 0 && Boolean(VANTA_TREASURY)

/** What Vanta keeps, as the sheets print it: "0%" or "0.25%". */
export const vantaCut = () => `${VANTA_FEE_BPS / 100}%`

/** "0.25%, max $5" - or "no fee" when the treasury is missing. */
export const feeTerms = () =>
  feeEnabled() ? `${vantaCut()}, max $${VANTA_FEE_CAP_USD}` : 'no fee'

/**
 * The fee for a transfer, in the asset's own units. SOL is converted at the
 * assumption above; a dollar-denominated token (DUSDC) is already dollars.
 * Returns 0 when the fee is off, so callers never branch on config.
 */
export function feeForAmount(amount, symbol = 'SOL') {
  if (!feeEnabled() || !(amount > 0)) return 0
  const usd = symbol === 'SOL' ? amount * SOL_USD_ASSUMPTION : amount
  const feeUsd = Math.min(usd * (VANTA_FEE_BPS / 10_000), VANTA_FEE_CAP_USD)
  return symbol === 'SOL' ? feeUsd / SOL_USD_ASSUMPTION : feeUsd
}
