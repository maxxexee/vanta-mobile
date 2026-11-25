// ── The privacy engine ───────────────────────────────────────────────────────
//
// Framework-free controller over @heliuslabs/zolana. The pages (index.html,
// onboarding.html) own pixels; this file owns the chain.
//
// Relationship to the pages: they never touch the SDK. They call
// `engine.init()` once and then `engine.shield(amount)`, `engine.sync()`, and
// subscribe with `engine.on('state', fn)`. Every value the UI shows comes out of
// `engine.get()`.
//
// What it does not do yet: private sends (Shadow / Ghost). Those are a later
// step on purpose; the deposit path is what unblocks the Sweep button, and it is
// the only path that has ever been exercised on a physical device.
//
// Keys: the wallet seed and the shielded seed both come from core/identity.js,
// which derives the second from the first. Nothing here generates a keypair.

import * as zk from '@heliuslabs/spr'
import { savePersistedWallet } from '@heliuslabs/spr/wallet'
import { SignedTeePolicy } from '@heliuslabs/spr/client'
import * as kit from '@solana/kit'
import { ed25519 } from '@noble/curves/ed25519.js'
import { currentWallet, ensureShieldedIdentity } from '../core/identity.js'
import { relayerFetch } from '../core/config.js'
import { USDC_MINTS, USDT_MINT, fetchHoldings } from '../core/portfolio.js'
import {
  POOL_PROGRAM,
  clearPendingShield,
  findLandedDeposit,
  loadPendingShield,
  readSlot,
  savePendingShield,
} from '../core/pendingShield.js'

const HELIUS_API_KEY = import.meta.env.VITE_HELIUS_API_KEY ?? ''

/** Same endpoints the legacy engine used. Overridable per build. */
const RPC_URL =
  import.meta.env.VITE_RPC_URL ||
  (HELIUS_API_KEY
    ? `https://devnet.helius-rpc.com/?api-key=${HELIUS_API_KEY}`
    : 'https://api.devnet.solana.com')
const RPC_WSS = import.meta.env.VITE_RPC_WSS || RPC_URL.replace(/^http/, 'ws')

// Privacy Rings 1.0 serves the indexer and the prover under the Helius RPC host
// at /v1/spr, keyed by the same api-key as the RPC. Left unset, the SDK derives
// both from solanaRpcUrl and keeps its query, so switching this build to
// mainnet is a VITE_RPC_URL change. An explicit URL must carry its own key.
const INDEXER_URL = import.meta.env.VITE_INDEXER_URL || undefined
const PROVER_URL = import.meta.env.VITE_PROVER_URL || undefined
/** Picks the signed TEE policy that matches the RPC the build points at. */
const ZOLANA_NETWORK =
  import.meta.env.VITE_ZOLANA_NETWORK || (/mainnet/.test(RPC_URL) ? 'mainnet' : 'devnet')

/** The RPC every balance read uses. Exported so the portfolio reads the same chain. */
export const rpcUrl = RPC_URL

const SNAPSHOT_KEY = 'vanta-zwallet'
const SHIELDED_STORE = 'vanta-ephemeral'

/** Below this, X cannot pay for its own spends, so the relayer tops it up. */
const FLOAT_FLOOR_LAMPORTS = 2_000_000
const FLOAT_AMOUNT_SOL = 0.01
/** Wall-clock ceiling for one private sync, retries included. */
const SYNC_BUDGET_MS = 20000
/** Consecutive hard failures that end a sync early. A dead indexer stays dead. */
const SYNC_MAX_FAILURES = 3

/** Last successful private read, keyed by wallet, so launch can paint it. */
const PRIVATE_CACHE_KEY = 'vanta-private-balances'

const listeners = new Set()
let initializedPromise = null

const state = {
  ready: false,
  status: '',
  error: '',
  /** Set when a deposit landed but the private side could not be read. */
  syncError: '',
  /** Public wallet, the address people send to. */
  address: '',
  /** 99-byte shielded address. Not a Solana address. */
  shielded: '',
  registered: false,
  /** [{ mint, symbol, amount }] from the last successful sync. */
  privateBalances: [],
  /** False until a private sync has succeeded on this launch. An unreadable
   *  private balance is not an empty one, and the UI must be able to say so. */
  privateSynced: false,
  /** True when the rows above come from notes saved on this device rather
   *  than a fresh indexer read. They are real notes, just not re-confirmed. */
  privateStale: false,
  /** True when the rows above are the last successful read, restored from
   *  localStorage while the first sync of this launch is still running. */
  privateCached: false,
  /** A deposit recovered from a lost wallet reply, once. */
  recoveredDeposit: null,
  /** SOL in the public wallet, read from the RPC. */
  publicBalance: 0,
  initialized: false,
}

function set(patch) {
  Object.assign(state, patch)
  for (const fn of listeners) {
    try {
      fn(state)
    } catch (err) {
      console.error('[engine] listener threw:', err)
    }
  }
}

const snapshotStore = {
  load: async () => localStorage.getItem(SNAPSHOT_KEY) || undefined,
  save: async (snapshot) => localStorage.setItem(SNAPSHOT_KEY, snapshot),
}

// ── Relay ────────────────────────────────────────────────────────────────────
// The SDK returns an already-compiled transaction: { messageBytes, signatures }.
// The relayer is the required fee payer and fills only its own slot, so the
// client signs just the slots it owns. The relayer rejects any message whose
// slot 0 is not its address.
async function relayTx(compiledTx, userSigners = []) {
  const messageBytes = new Uint8Array(compiledTx.messageBytes)
  const slots = Object.entries(compiledTx.signatures).map(([addr]) => ({
    addr,
    sig: null,
  }))
  const seedByAddr = new Map(userSigners.map((s) => [s.address, s.seed]))
  for (const slot of slots) {
    const seed = seedByAddr.get(slot.addr)
    if (seed) {
      slot.sig = btoa(String.fromCharCode(...ed25519.sign(messageBytes, seed)))
    }
  }
  const res = await relayerFetch('/relay', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      message: btoa(String.fromCharCode(...messageBytes)),
      slots,
    }),
  })
  const data = await res.json().catch(() => ({}))
  if (!res.ok || !data.ok) {
    throw new Error(data.error || `Relay failed (${res.status})`)
  }
  return data.signature
}

/**
 * A balance read that cannot hold the UI hostage. Without a timeout the public
 * RPC can queue a request for tens of seconds and the sweep button sits on
 * "Sweeping" with nothing to show for it.
 */
const RPC_TIMEOUT_MS = 15000

/** Plain JSON-RPC balance, so the engine needs no web3.js. */
async function solBalance(address) {
  const res = await fetch(RPC_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      jsonrpc: '2.0',
      id: 1,
      method: 'getBalance',
      params: [address, { commitment: 'confirmed' }],
    }),
    signal: AbortSignal.timeout(RPC_TIMEOUT_MS),
  })
  const body = await res.json().catch(() => ({}))
  const lamports = body?.result?.value
  if (typeof lamports !== 'number') throw new Error('Could not read the wallet balance')
  return lamports / 1e9
}

/**
 * Lamport balance in SOL for any address. Exported because the deposit watcher
 * has to read the funding wallet before the engine is initialised: init loads a
 * wallet snapshot, registers the identity and asks the relayer for float, none
 * of which should happen just to find out whether money arrived.
 */
export async function publicBalance(address) {
  if (!address) return 0
  return solBalance(address)
}

const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms))

/**
 * Save the notes this process holds. Called right after a deposit lands, before
 * the indexer sync, because the sync is the part that can fail and the note is
 * the money.
 */
async function persistWalletNote() {
  if (!runtime) return
  try {
    await savePersistedWallet({
      wallet: runtime.wallet,
      store: snapshotStore,
      cipher: zk.walletSnapshotCipher(runtime.keypair),
    })
  } catch (err) {
    console.warn('[engine] could not save the private note locally:', err?.message || err)
  }
}

// ── Runtime ──────────────────────────────────────────────────────────────────
let runtime = null

function readShieldedStore() {
  try {
    return JSON.parse(localStorage.getItem(SHIELDED_STORE) || 'null')
  } catch {
    return null
  }
}

// Decimals and labels for the assets this build recognises. A mint outside the
// map is still reported, but it cannot be given a correct amount without its
// metadata, so it is labelled by its mint and the caller decides what to show.
const ASSET_INFO = {
  [String(zk.SOL_MINT)]: { symbol: 'SOL', decimals: 9 },
  '4oG4sjmopf5MzvTHLE8rpVJ2uyczxfsw2K84SUTpNDx7': { symbol: 'dUSDC', decimals: 6 },
  [USDT_MINT]: { symbol: 'USDT', decimals: 6 },
  [USDC_MINTS.mainnet]: { symbol: 'USDC', decimals: 6 },
  [USDC_MINTS.devnet]: { symbol: 'USDC', decimals: 6 },
}

function readPrivateCache(owner) {
  try {
    const cached = JSON.parse(localStorage.getItem(PRIVATE_CACHE_KEY) || 'null')
    if (cached?.owner === owner && Array.isArray(cached.rows)) return cached
  } catch {}
  return null
}

function writePrivateCache(owner, rows) {
  try {
    if (!rows.length) localStorage.removeItem(PRIVATE_CACHE_KEY)
    else localStorage.setItem(PRIVATE_CACHE_KEY, JSON.stringify({ owner, at: Date.now(), rows }))
  } catch (err) {
    console.warn('[engine] could not cache the private balance:', err?.message || err)
  }
}

function privateTotals() {
  const wallet = runtime?.wallet
  if (!wallet) return []
  const totals = new Map()
  for (const entry of wallet.balances()) {
    const mint = String(entry.mint)
    totals.set(mint, (totals.get(mint) ?? 0n) + BigInt(entry.amount))
  }
  return [...totals].map(([mint, amount]) => {
    const info = ASSET_INFO[mint]
    return {
      mint,
      symbol: info?.symbol ?? `${mint.slice(0, 4)}…`,
      amount: Number(amount) / 10 ** (info?.decimals ?? 0),
      decimals: info?.decimals ?? 0,
    }
  })
}

async function syncPrivate({ expectMint = null, expectRaw = 0n } = {}) {
  if (!runtime) throw new Error('The engine is not ready')
  const { client, wallet, keys, keypair } = runtime
  // A deposit can land on chain before the indexer has it. Without a target,
  // the first answer that includes any note looks complete and the new note
  // shows up only on the next reload; this is the balance the sweep should end
  // on, and the loop below waits for it instead.
  const rawTotal = (mint) => {
    let total = 0n
    for (const entry of wallet.balances()) {
      if (String(entry.mint) === String(mint)) total += BigInt(entry.amount)
    }
    return total
  }
  const expected = expectMint ? rawTotal(expectMint) + BigInt(expectRaw) : 0n
  // Two different waits live in this loop. An indexer that answers but has not
  // caught up with a deposit yet is worth waiting out, so that case gets the
  // full budget. An indexer that fails outright (unreachable host, dead DNS) is
  // not fixed by retrying, and grinding the budget turns a dead endpoint into a
  // twenty second hang on every boot.
  const deadline = Date.now() + SYNC_BUDGET_MS
  let lastError = null
  let failures = 0
  for (let attempt = 1; Date.now() < deadline; attempt++) {
    try {
      await zk.syncWallet({ client, wallet, keys })
      lastError = null
      failures = 0
      // A wallet with notes can stop, unless a specific deposit is still
      // missing: then the indexer has not caught up and the wait is the point.
      // A plain launch read is complete after one successful answer, even
      // when it is empty. Only a deposit that has not been indexed yet is
      // worth retrying, and that case carries an expectation.
      if (!expectMint || rawTotal(expectMint) >= expected) break
    } catch (err) {
      lastError = err
      failures += 1
      if (failures >= SYNC_MAX_FAILURES) break
    }
    await wait(Math.min(attempt * 2000, Math.max(0, deadline - Date.now())))
  }
  if (lastError) {
    // The indexer is unreachable, but notes saved on this device are still
    // real, and the last successful read is what the user saw before this
    // launch. Show those instead of a zero the user will read as lost money.
    const local = privateTotals()
    const rows = local.length ? local : state.privateCached ? state.privateBalances : []
    set({ privateBalances: rows, privateSynced: false, privateStale: rows.length > 0 })
    throw lastError
  }
  await zk.syncPersistedWallet({
    client,
    wallet,
    keys,
    store: snapshotStore,
    cipher: zk.walletSnapshotCipher(keypair),
  })
  const rows = privateTotals()
  set({
    privateBalances: rows,
    privateSynced: true,
    privateStale: false,
    privateCached: false,
    status: '',
  })
  writePrivateCache(runtime.publicAddress, rows)
  if (expectMint && rawTotal(expectMint) < expected) {
    throw new Error('The deposit is not readable yet')
  }
  return state.privateBalances
}

/**
 * A sweep whose reply was lost may still be on chain. Reconcile the record
 * written before the relayer call against the chain, and report the deposit
 * once so the page can give it a receipt.
 */
async function recoverPendingDeposit() {
  const pending = loadPendingShield()
  if (!pending) return null
  try {
    const found = await findLandedDeposit({
      rpcUrl: RPC_URL,
      depositor: pending.depositor,
      sinceSlot: pending.sinceSlot,
      notBeforeMs: (pending.at ?? Date.now()) - 60_000,
      poolProgram: pending.program || POOL_PROGRAM,
      mint: pending.mint || null,
    })
    if (!found) return null
    clearPendingShield()
    const recovered = {
      signature: found.signature,
      amount: pending.amount,
      symbol: pending.symbol || 'SOL',
      mint: pending.mint || null,
    }
    set({ recoveredDeposit: recovered })
    return recovered
  } catch (err) {
    console.warn('[engine] could not reconcile the pending deposit:', err?.message || err)
    return null
  }
}

/**
 * X owns the private notes and also pays their fees. The relayer cannot sign
 * that slot, so it funds X instead, a little at a time.
 */
async function ensureFloat() {
  if (!runtime) return
  const balance = await solBalance(runtime.xAddress).catch(() => 0)
  if (balance >= FLOAT_FLOOR_LAMPORTS / 1e9) return
  try {
    const res = await relayerFetch('/fund', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ address: runtime.xAddress, amount: FLOAT_AMOUNT_SOL }),
    })
    const data = await res.json().catch(() => ({}))
    if (!res.ok || !data.ok) {
      console.warn('[engine] the relayer would not fund fees:', data.error || res.status)
    }
  } catch (err) {
    // Not fatal: registration and the deposit on-ramp are relayer-paid anyway.
    console.warn('[engine] fee float failed:', err?.message || err)
  }
}

export const engine = {
  get() {
    return { ...state }
  },

  on(fn) {
    listeners.add(fn)
    return () => listeners.delete(fn)
  },

  /** Idempotent. Safe to call from every page load. */
  async init() {
    if (initializedPromise) return initializedPromise
    initializedPromise = (async () => {
      const walletData = currentWallet()
      if (!walletData?.publicKey) throw new Error('No wallet on this device')

      set({ status: 'Starting the privacy engine…', error: '', address: walletData.publicKey })

      // The shielded identity is derived from the wallet seed, and written to
      // `vanta-ephemeral` so the backup module and the legacy page find it.
      const shieldedData = ensureShieldedIdentity(walletData) || readShieldedStore()
      if (!shieldedData?.secretKey) throw new Error('The shielded identity is missing')

      const client = await zk.createSprClient({
        solanaRpcUrl: RPC_URL,
        solanaRpcSubscriptionsUrl: RPC_WSS,
        ...(INDEXER_URL ? { indexerUrl: INDEXER_URL } : {}),
        ...(PROVER_URL ? { proverUrl: PROVER_URL } : {}),
        // A hosted prover must attest before it receives a witness.
        proverTee: SignedTeePolicy.forNetwork(ZOLANA_NETWORK),
      })

      const xSeed = new Uint8Array(shieldedData.secretKey.slice(0, 32))
      const signingKey = zk.SigningKey.fromEd25519Bytes(xSeed)
      const keypair = zk.ShieldedKeypair.fromKeypair(signingKey)
      const signer = await kit.createKeyPairSignerFromPrivateKeyBytes(xSeed)

      const keys = zk.LocalKeys.fromKeypair(keypair, client.proofService)
      const shielded = String(keypair.shieldedAddress().solanaAddress())

      let wallet = null
      try {
        const restored = await zk.loadPersistedWallet({
          store: snapshotStore,
          cipher: zk.walletSnapshotCipher(keypair),
        })
        wallet = restored ?? new zk.Wallet({ identity: keypair.shieldedAddress() })
      } catch (err) {
        console.warn('[engine] could not restore private state:', err?.message || err)
        wallet = new zk.Wallet({ identity: keypair.shieldedAddress() })
      }

      runtime = {
        client,
        wallet,
        keys,
        keypair,
        signer,
        // Two addresses, and they are not interchangeable. `publicAddress` is
        // the wallet people send SOL to; `xAddress` is the key that owns the
        // private notes and pays their fees.
        publicAddress: walletData.publicKey,
        publicSeed: new Uint8Array(walletData.secretKey.slice(0, 32)),
        xAddress: signer.address,
        solMint: zk.SOL_MINT,
        xSeed,
      }

      // Ready means the keys exist and the client is built. Init keeps working
      // after this point (registration, float, the first private sync), and each
      // of those sets its own stage text so nothing claims to be done while it
      // is still running.
      set({ ready: true, shielded })

      // The last successful read paints before the indexer answers, so the
      // page has real numbers in the first frame instead of a skeleton for
      // the length of a sync.
      const cached = readPrivateCache(walletData.publicKey)
      if (cached?.rows?.length) {
        set({ privateBalances: cached.rows, privateCached: true })
      }

      set({ status: 'Reading your private balance…' })
      const firstSync = syncPrivate().catch((err) => {
        console.warn('[engine] first sync failed:', err?.message || err)
      })

      // Registration only gates being paid by address, and float only pays
      // later spends. Neither is needed to read the balance, so both run
      // beside the first sync instead of in front of it.
      void (async () => {
        try {
          const relayer = await relayerFetch('/address')
            .then((r) => r.json())
            .then((d) => d?.address || '')
            .catch(() => '')
          runtime.relayerAddress = relayer
          if (relayer) {
            const reg = await zk.buildRegistrationTransaction({
              client,
              owner: signer.address,
              address: keypair.shieldedAddress(),
              payer: relayer,
            })
            if (reg !== undefined) {
              set({ status: 'Registering the private identity…' })
              await relayTx(reg, [{ address: signer.address, seed: runtime.xSeed }])
            }
            set({ registered: true })
          }
        } catch (err) {
          // A registered identity is only needed to RECEIVE privately.
          console.warn('[engine] registration failed:', err?.message || err)
        }
        await ensureFloat()
      })().catch((err) => {
        console.warn('[engine] background setup failed:', err?.message || err)
      })

      await firstSync
      set({ initialized: true, status: '' })
      try {
        set({ publicBalance: await solBalance(walletData.publicKey) })
      } catch {
        /* the UI can retry */
      }
      return engine.get()
    })().catch((err) => {
      initializedPromise = null
      set({ ready: false, error: err?.message || String(err), status: 'Privacy engine failed' })
      throw err
    })
    return initializedPromise
  },

  /**
   * Sweep `amount` SOL from the public wallet into the private pool.
   *
   * The relayer is the fee payer and the wallet is the depositor, so the
   * transaction needs two signatures and only the wallet's can be produced here.
   * The deposit itself is public by design: it names the depositor and the
   * amount, and hides only what happens afterwards.
   */
  async shield(amount) {
    await engine.init()
    if (!runtime) throw new Error('The engine is not ready')
    const value = Number(amount)
    if (!(value > 0)) throw new Error('Nothing to sweep')

    const requested = BigInt(Math.round(value * 1e9))
    const balance = await solBalance(runtime.publicAddress)
    set({ publicBalance: balance })
    const available = BigInt(Math.round(balance * 1e9))
    if (available <= 0n) {
      // The amount comes from the UI's last balance read, so it can outlive the
      // money. An empty address has nothing to move and no sweep can succeed.
      throw new Error('Nothing has arrived yet')
    }
    // The chain wins over the cached amount. Sweeping what is actually there is
    // better than refusing a deposit because an estimate drifted upward.
    const rawAmount = requested > available ? available : requested
    const sweptSol = Number(rawAmount) / 1e9

    set({ status: `Sweeping ${sweptSol} SOL into the private pool…`, error: '', syncError: '' })

    const relayer = runtime.relayerAddress || (await relayerFetch('/address').then((r) => r.json()).then((d) => d.address))
    runtime.relayerAddress = relayer

    const deposit = await zk.buildDepositTransaction({
      client: runtime.client,
      feePayer: relayer,
      depositor: runtime.publicAddress,
      recipient: runtime.keypair.shieldedAddress(),
      asset: zk.SOL_MINT,
      amount: rawAmount,
    })

    // Written before the relayer is asked to sign, and only once the transaction
    // exists: a reply can be lost after the deposit is on chain, and this is the
    // only record that it happened. A deposit that was never built cannot have
    // landed, so it must not leave a record behind.
    const sinceSlot = await readSlot(RPC_URL)
    savePendingShield({
      amount: sweptSol,
      symbol: 'SOL',
      depositor: runtime.publicAddress,
      sinceSlot,
      program: POOL_PROGRAM,
    })

    let signature
    try {
      signature = await relayTx(deposit, [
        { address: runtime.publicAddress, seed: runtime.publicSeed },
      ])
    } catch (err) {
      // The wallet may have broadcast before the answer was lost. Ask the chain
      // before reporting a failure for money that moved.
      const recovered = await recoverPendingDeposit()
      if (!recovered) {
        set({ status: '', error: err?.message || String(err) })
        throw err
      }
      signature = recovered.signature
    }
    clearPendingShield()

    // Persist the note before anything that can fail. The indexer sync below
    // is what normally saves wallet state; when it is down the note would
    // otherwise exist only in memory and vanish on the next reload.
    await persistWalletNote()

    // The deposit is on-chain now, so the sweep is done. Reading the private
    // side is a separate job against a remote indexer: it can take a while and
    // it can fail. Neither is a reason to keep the user on a spinning button,
    // so this returns now and the private balance catches up behind it.
    set({ status: 'Swept. Reading your private balance…', syncError: '' })
    syncPrivate({ expectMint: String(zk.SOL_MINT), expectRaw: rawAmount })
      .then(() => {
        solBalance(runtime.publicAddress)
          .then((balance) => set({ publicBalance: balance }))
          .catch(() => {})
      })
      .catch((err) => {
        console.warn('[engine] sync after sweep failed:', err?.message || err)
        set({
          status: '',
          syncError: 'Money is in. Updating balance.',
        })
      })
    return { signature, amount: sweptSol, privateBalances: state.privateBalances }
  },

  /**
   * Sweep an SPL balance from the public address into the private pool.
   *
   * The mint decides everything: the deposit names the asset, the depositor own
   * token account and its token program. The amount is read from that account,
   * never from the UI, and only the largest account for the mint is swept in one
   * call, which is what one deposit transaction can move.
   */
  async shieldToken({ mint }) {
    await engine.init()
    if (!runtime) throw new Error('The engine is not ready')
    const wanted = String(mint || '')
    if (!wanted) throw new Error('No token to sweep')

    const holdings = await fetchHoldings({ owner: runtime.publicAddress, rpcUrl: RPC_URL })
    const token = holdings.tokens.find((row) => row.mint === wanted)
    if (!token || !(token.accountAmount > 0)) throw new Error('Nothing has arrived yet')

    const rawAmount = BigInt(Math.round(token.accountAmount * 10 ** token.decimals))
    const sweptAmount = Number(rawAmount) / 10 ** token.decimals
    const symbol = ASSET_INFO[wanted]?.symbol || `${wanted.slice(0, 4)}…`

    set({ status: `Sweeping ${sweptAmount} ${symbol} into the private pool…`, error: '', syncError: '' })

    const relayer =
      runtime.relayerAddress ||
      (await relayerFetch('/address').then((r) => r.json()).then((d) => d.address))
    runtime.relayerAddress = relayer

    const deposit = await zk.buildDepositTransaction({
      client: runtime.client,
      feePayer: relayer,
      depositor: runtime.publicAddress,
      recipient: runtime.keypair.shieldedAddress(),
      amount: rawAmount,
      asset: wanted,
      splTokenAccount: token.account,
      splTokenProgram: token.program,
    })

    const sinceSlot = await readSlot(RPC_URL)
    savePendingShield({
      amount: sweptAmount,
      symbol,
      mint: wanted,
      depositor: runtime.publicAddress,
      sinceSlot,
      program: POOL_PROGRAM,
    })

    let signature
    try {
      signature = await relayTx(deposit, [
        { address: runtime.publicAddress, seed: runtime.publicSeed },
      ])
    } catch (err) {
      const recovered = await recoverPendingDeposit()
      if (!recovered) {
        set({ status: '', error: err?.message || String(err) })
        throw err
      }
      signature = recovered.signature
    }
    clearPendingShield()
    await persistWalletNote()

    set({ status: 'Swept. Reading your private balance…', syncError: '' })
    syncPrivate({ expectMint: wanted, expectRaw: rawAmount })
      .then(() => solBalance(runtime.publicAddress).then((b) => set({ publicBalance: b })).catch(() => {}))
      .catch((err) => {
        console.warn('[engine] sync after token sweep failed:', err?.message || err)
        set({ status: '', syncError: 'Money is in. Updating balance.' })
      })
    return { signature, amount: sweptAmount, symbol, privateBalances: state.privateBalances }
  },

  sync: syncPrivate,

  recoverPendingDeposit,

  async refreshPublicBalance() {
    if (!state.address) return 0
    const balance = await solBalance(state.address)
    set({ publicBalance: balance })
    return balance
  },
}
