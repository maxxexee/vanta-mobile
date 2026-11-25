/**
 * The note a sweep creates must survive a reload, even with the indexer down.
 *
 * A deposit used to be saved only by `syncPersistedWallet`, i.e. only after a
 * successful indexer read. With the indexer unreachable the note existed in
 * memory alone, so a reload dropped it and the balance read zero. The engine now
 * seals and saves the wallet immediately after a sweep. This script exercises
 * that exact store and cipher pair:
 *
 *   node scripts/note-persistence-check.mjs
 *
 * Limits: no prover is reachable from here, so a real deposit note cannot be
 * created in this process. The check proves the store, the seal, the reload and
 * the wrong-key refusal. It does not prove a funded note round trips; that needs
 * a live prover and is called out in the run output.
 */
import {
  ShieldedKeypair,
  SigningKey,
  Wallet,
  initializePoseidon,
  loadPersistedWallet,
  walletSnapshotCipher,
} from '@heliuslabs/spr'
import { savePersistedWallet } from '@heliuslabs/spr/wallet'

const results = []
const check = (name, ok, detail = '') => results.push([name, ok, detail])

await initializePoseidon()

const keystore = new Map()
const store = {
  load: async () => keystore.get('snapshot'),
  save: async (snapshot) => keystore.set('snapshot', snapshot),
}

function keypairFrom(byte) {
  return ShieldedKeypair.fromKeypair(SigningKey.fromEd25519Bytes(new Uint8Array(32).fill(byte)))
}

const keypair = keypairFrom(7)
const identity = keypair.shieldedAddress()
const identityText = String(identity)
const wallet = new Wallet({ identity })
const cipher = walletSnapshotCipher(keypair)

await savePersistedWallet({ wallet, store, cipher })
const sealed = keystore.get('snapshot')

check('save writes a snapshot', typeof sealed === 'string' && sealed.length > 0, `${sealed?.length ?? 0} chars`)
check('the snapshot is sealed, not the identity in clear', !sealed.includes(identityText))
// The envelope is JSON (version, nonce, ciphertext), but the wallet state
// inside it must not be.
check('the wallet state inside the snapshot is not readable', !sealed.includes('utxos') && !sealed.includes('signingPublicKey'))

const restored = await loadPersistedWallet({ store, cipher })
check('load restores the same shielded identity', String(restored?.identity) === identityText)
check('the restored wallet has the same note count', restored?.utxos().length === wallet.utxos().length)

// A snapshot sealed for one wallet must not open for another. Otherwise a store
// that can be edited could advance cursors past owned history.
const stranger = walletSnapshotCipher(keypairFrom(9))
let refused = false
try {
  await loadPersistedWallet({ store, cipher: stranger })
} catch {
  refused = true
}
check('a different shielded identity cannot open the snapshot', refused)

let failed = 0
for (const [name, ok, detail] of results) {
  if (!ok) failed += 1
  console.log(`${ok ? 'ok  ' : 'FAIL'} ${name}${detail ? ` (${detail})` : ''}`)
}
console.log(`\n${results.length - failed}/${results.length} passed`)
console.log('not covered here: a funded note round trip, which needs a reachable prover')
process.exit(failed ? 1 : 0)
