// What a Vanta transaction costs, in one place.
//
// Why this module exists: a privacy wallet that only says what it took after the
// money has left reads as a trap, however small the number. The deposit sheet
// and the send sheet both price from here, so the number quoted when money goes
// in cannot drift from the number quoted when it comes out.
//
// Two costs, owed to different parties:
//   · the Solana network fee, measured rather than guessed (the 25,000-lamport
//     deposit is receipted in lib/tokens; a spend is one signature, 5,000)
//   · Vanta's cut, which is zero: no shipped path skims a deposit or a send.
//     docs/pitch-deck-monetization.md prices a future split-note fee, and until
//     that ships this constant stays 0 so the UI says so in as many words.

import { NETWORK_FEE_SOL } from './tokens'

/** A Shadow or Ghost is one signature: no compute budget, no priority fee. */
export const SPEND_FEE_SOL = 0.000005

/** Deposit cost when the connected wallet is the fee payer (the MWA path). */
export const DEPOSIT_FEE_SOL = NETWORK_FEE_SOL

/** Basis points Vanta keeps. Read by both sheets, never retyped as a string. */
export const VANTA_FEE_BPS = 0

/** What Vanta keeps, as the sheets print it: "0%" or "0.5%". */
export const vantaCut = () => `${VANTA_FEE_BPS / 100}%`
