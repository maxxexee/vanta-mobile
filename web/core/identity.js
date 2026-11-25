// ── Device identity ──────────────────────────────────────────────────────────
//
// One secret per install. Everything else is derived from it.
//
// The old build kept two unrelated keypairs in two stores: the session wallet
// (`vanta-wallet-session`, the public address people send to) and X, a randomly
// generated "ephemeral" key that owned the pool notes (`vanta-ephemeral`). Both
// had to be backed up, and losing either lost something.
//
// X does not have to be random. It is derived here from the session seed under a
// label, so:
//
//   seed                 ← the only secret a user ever has to keep
//   ├── ed25519(seed)        public wallet, the address people send to
//   └── ed25519(H(seed))     shielded identity, owns the private notes
//
// H is HMAC-SHA512 under a fixed label, so the shielded key cannot be recovered
// from the public address alone. Registration publishes the owner→shielded link
// on chain anyway (see initZolana in the legacy app), so nothing is being hidden
// that the chain was not already told.
//
// The derived identity is still written to `vanta-ephemeral` in the legacy shape
// because backup.js and the privacy engine read that store.

import { ed25519 } from '@noble/curves/ed25519.js'
import { hmac } from '@noble/hashes/hmac.js'
import { sha512 } from '@noble/hashes/sha2.js'
import { readSlots, saveSessionWallet } from './walletStore.js'

const ALPHABET = '123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz'
const SHIELDED_LABEL = 'vanta-shielded/v1'
const SHIELDED_STORE = 'vanta-ephemeral'

export function base58Encode(bytes) {
  if (!bytes?.length) return ''
  let zeros = 0
  while (zeros < bytes.length && bytes[zeros] === 0) zeros++
  const digits = [0]
  for (let i = zeros; i < bytes.length; i++) {
    let carry = bytes[i]
    for (let j = 0; j < digits.length; j++) {
      carry += digits[j] << 8
      digits[j] = carry % 58
      carry = (carry / 58) | 0
    }
    while (carry) {
      digits.push(carry % 58)
      carry = (carry / 58) | 0
    }
  }
  let out = '1'.repeat(zeros)
  for (let i = digits.length - 1; i >= 0; i--) out += ALPHABET[digits[i]]
  return out
}

export function base58Decode(text) {
  const clean = String(text || '').trim()
  if (!clean) throw new Error('No key to read')
  let zeros = 0
  while (zeros < clean.length && clean[zeros] === '1') zeros++
  const bytes = [0]
  for (let i = zeros; i < clean.length; i++) {
    const value = ALPHABET.indexOf(clean[i])
    if (value < 0) throw new Error('That is not a base58 private key')
    let carry = value
    for (let j = 0; j < bytes.length; j++) {
      carry += bytes[j] * 58
      bytes[j] = carry & 0xff
      carry >>= 8
    }
    while (carry) {
      bytes.push(carry & 0xff)
      carry >>= 8
    }
  }
  while (bytes.length > 1 && bytes[bytes.length - 1] === 0) bytes.pop()
  const out = new Uint8Array(zeros + bytes.length)
  for (let i = 0; i < bytes.length; i++) out[out.length - 1 - i] = bytes[i]
  return out
}

/** `4kQp…9xZt` — the chip form the header and cards use. */
export const addressChip = (address) =>
  address && address.length > 12 ? `${address.slice(0, 4)}…${address.slice(-4)}` : address || ''

const secretFromSeed = (seed) => {
  const publicKey = ed25519.getPublicKey(seed)
  const secretKey = new Uint8Array(64)
  secretKey.set(seed, 0)
  secretKey.set(publicKey, 32)
  return { publicKey: base58Encode(publicKey), secretKey: Array.from(secretKey) }
}

/**
 * Derive the shielded identity's seed from the wallet seed. Never derive the
 * shielded key from its own public key: nobody without the seed can follow this.
 */
export function shieldedSeedOf(wallet) {
  const secret = Uint8Array.from(wallet?.secretKey || [])
  if (secret.length < 32) throw new Error('This wallet has no key on this device')
  const label = new TextEncoder().encode(SHIELDED_LABEL)
  return hmac(sha512, secret.slice(0, 32), label).slice(0, 32)
}

/**
 * Persist the shielded identity next to the wallet. It is derived, so this is a
 * convenience for the engine and for backup.js, never a second thing to keep.
 */
export function ensureShieldedIdentity(wallet) {
  let stored = null
  try {
    stored = JSON.parse(localStorage.getItem(SHIELDED_STORE) || 'null')
  } catch {
    stored = null
  }
  if (stored?.secretKey) return stored
  const identity = secretFromSeed(shieldedSeedOf(wallet))
  try {
    localStorage.setItem(SHIELDED_STORE, JSON.stringify(identity))
  } catch (err) {
    console.warn('[identity] could not store the shielded identity:', err?.message || err)
  }
  return identity
}

/** Make `wallet` the session wallet and keep its derived identity in step. */
function persist(wallet) {
  ensureShieldedIdentity(wallet)
  saveSessionWallet(wallet)
  return wallet
}

export function createWallet() {
  return persist(secretFromSeed(crypto.getRandomValues(new Uint8Array(32))))
}

/**
 * Restore from a base58 private key. Both shapes are accepted: the 64-byte
 * seed+public key that Solana tooling exports, and a bare 32-byte seed.
 */
export function importPrivateKey(text) {
  const bytes = base58Decode(text)
  let seed
  if (bytes.length === 64) {
    seed = bytes.slice(0, 32)
    const derived = ed25519.getPublicKey(seed)
    for (let i = 0; i < 32; i++) {
      if (bytes[32 + i] !== derived[i]) throw new Error('That key does not match its own public half')
    }
    // A restored key brings its own identity with it.
    try {
      localStorage.removeItem(SHIELDED_STORE)
    } catch {
      /* private-mode storage; persist() will try again */
    }
  } else if (bytes.length === 32) {
    seed = bytes
    try {
      localStorage.removeItem(SHIELDED_STORE)
    } catch {
      /* see above */
    }
  } else {
    throw new Error('A private key is 32 or 64 bytes, base58 encoded')
  }
  return persist(secretFromSeed(seed))
}

/** The active wallet if one is bound, else null. */
export function currentWallet() {
  const { wallet } = readSlots()
  return wallet?.publicKey ? wallet : null
}

/** The active wallet, creating and persisting one on first run. */
export function ensureWallet() {
  return currentWallet() || createWallet()
}
