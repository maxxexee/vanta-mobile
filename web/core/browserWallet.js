// Browser wallets (Phantom, Solflare, Backpack) over Wallet Standard.
//
// Why this is not `lib/mwa.js`: that module registers Vanta as an MWA *app* and
// then picks a wallet out of the registry by MWA's own name list, because on a
// phone the wallet lives in another app and the bridge has to be established
// first. In a browser the extension injects itself through
// `wallet-standard:register-wallet`, which `lib/wallets.js` already listens for,
// so discovery is free and there is no bridge, no association, and no app
// handshake.
//
// What is shared is the part that is genuinely shared: the payload bridge.
// Zolana emits Solana **v1** transactions, and `serializeCompiledTx` is the one
// place that knows the `[message][signatures]` envelope those need. Reusing it
// here means a browser wallet and a phone wallet are handed byte-identical
// payloads, so a wallet that works in one works in the other.
//
// The signing calls themselves ARE Wallet Standard features
// (`solana:signAndSendTransaction`), identical to what MWA exercises. That is
// the whole point of the standard, and it is why this file is short.
import { getWallets } from './wallets'
import { DEVNET_CHAIN, isMwaWallet } from './mwa'

const CONNECT_TIMEOUT_MS = 120_000
const REQUEST_TIMEOUT_MS = 90_000

let connectedWallet = null
let connectedAccount = null

/** Idempotent. Attaches the registry listener before any wallet announces. */
export function initBrowserWallet() {
  if (typeof window === 'undefined') return
  getWallets()
}

/**
 * Every *injected* wallet that can carry a Vanta deposit.
 *
 * MWA's shim is excluded on purpose. It registers itself in the same registry
 * and advertises the same feature, so without this filter an Android browser
 * showed "Connect browser wallet" while there was no browser wallet at all —
 * the button was offering the phone-wallet path under a desktop label. That
 * path has its own button and its own handshake.
 */
export function listBrowserWallets() {
  initBrowserWallet()
  return getWallets()
    .get()
    .filter(
      (wallet) => wallet?.features?.['solana:signAndSendTransaction'] && !isMwaWallet(wallet),
    )
}

export function isBrowserWalletAvailable() {
  return listBrowserWallets().length > 0
}

export function getBrowserAccount() {
  return connectedAccount
}

export function isBrowserConnected() {
  return !!connectedAccount
}

function withTimeout(promise, label, timeoutMs = REQUEST_TIMEOUT_MS) {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(
      () => reject(new Error(`${label} timed out. Approve the request in your wallet and try again`)),
      timeoutMs,
    )
    promise.then(
      (value) => {
        clearTimeout(timer)
        resolve(value)
      },
      (err) => {
        clearTimeout(timer)
        reject(err)
      },
    )
  })
}

/**
 * Connect one browser wallet, by name when the user picked one. Silent when the
 * extension already has a grant, so a page reload re-authorizes instead of
 * prompting again.
 */
export async function connectBrowserWallet(name) {
  const wallets = listBrowserWallets()
  const wallet = name ? wallets.find((w) => w.name === name) : wallets[0]
  if (!wallet) {
    throw new Error(
      'No browser wallet found. Install Phantom or Solflare, then reload this page.',
    )
  }
  const connect = wallet.features?.['standard:connect']
  if (!connect) throw new Error(`${wallet.name} does not support connecting to sites`)
  try {
    const { accounts } = await withTimeout(
      connect.connect(),
      'Connecting',
      CONNECT_TIMEOUT_MS,
    )
    if (!accounts?.length) throw new Error(`${wallet.name} returned no accounts`)
    // Prefer the account on our chain; a wallet may hand back mainnet first.
    const account = accounts.find((a) => a.chains?.includes(DEVNET_CHAIN)) ?? accounts[0]
    connectedWallet = wallet
    connectedAccount = account
    return account
  } catch (err) {
    throw translateBrowserWalletError(err, wallet.name)
  }
}

export async function disconnectBrowserWallet() {
  const wallet = connectedWallet
  try {
    await wallet?.features?.['standard:disconnect']?.disconnect()
  } finally {
    connectedWallet = null
    connectedAccount = null
  }
}

/**
 * Sign the already-compiled deposit with the browser wallet and broadcast it
 * from the wallet itself, so Vanta never holds the key and there is no foreign
 * signature to recover. Returns the signature as bytes.
 */
export async function signAndSendTransactionWithBrowserWallet(transactionBytes) {
  if (!connectedWallet || !connectedAccount) throw new Error('Wallet not connected')
  const feature = connectedWallet.features?.['solana:signAndSendTransaction']
  if (!feature) {
    throw new Error(`${connectedWallet.name ?? 'This wallet'} cannot sign and send transactions`)
  }
  try {
    const [result] = await withTimeout(
      feature.signAndSendTransaction({
        account: connectedAccount,
        chain: DEVNET_CHAIN,
        transaction: transactionBytes,
      }),
      'Signing',
    )
    return result.signature // Uint8Array(64)
  } catch (err) {
    throw translateBrowserWalletError(err, connectedWallet.name)
  }
}

// Same story as the MWA path: every Vanta privacy transaction is a v1, and a
// wallet that only understands the legacy envelope refuses it with one of these
// strings. The raw text names no action, so it is translated here into the one
// thing the user can do about it.
const V1_UNSUPPORTED = new RegExp(
  [
    'end of buffer',
    'failed to process request',
    'unexpectedly',
    'payloads? invalid',
    'invalid payload',
    'transaction version \\(1\\)',
    'not supported',
    'deserializ',
  ].join('|'),
  'i',
)

function translateBrowserWalletError(err, name) {
  const message = String(err?.message || err || '')
  if (V1_UNSUPPORTED.test(message)) {
    const wrapped = new Error(
      `${name ?? 'This wallet'} could not read the transaction: it does not support Solana v1 ` +
        'transactions yet, and every Vanta privacy transaction is a v1 by design. Use the ' +
        'in-app wallet on this page instead, then move funds over.',
      { cause: err },
    )
    wrapped.userFacing = true
    return wrapped
  }
  return err
}
