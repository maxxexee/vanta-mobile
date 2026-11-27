/**
 * Tracks which inbound private notes this device has already announced.
 *
 * The wallet sync returns the full inbound history on every read, so a note that
 * arrived while the app was closed is only distinguishable from one seen last
 * week by its id. Ids are kept per owner in local storage and trimmed, since a
 * note older than the window is not worth re-announcing either way.
 */

const SEEN_KEY_PREFIX = 'vanta-inbound-seen:'
const SEEN_LIMIT = 200

function readSeen(owner, storage) {
  let stored = null
  try {
    stored = JSON.parse(storage.getItem(SEEN_KEY_PREFIX + owner) || 'null')
  } catch (err) {
    // A corrupt record is replaced by the next baseline write.
    console.warn('[inbound] could not read the note record:', err?.message || err)
  }
  if (Array.isArray(stored)) return stored.filter((id) => typeof id === 'string')
  return null
}

function writeSeen(owner, storage, ids) {
  try {
    storage.setItem(SEEN_KEY_PREFIX + owner, JSON.stringify(ids.slice(-SEEN_LIMIT)))
  } catch (err) {
    console.warn('[inbound] could not save the note record:', err?.message || err)
  }
}

/**
 * Records the notes the saved wallet already holds, before the first sync.
 * Without this, the first diff after launch would include the entire history.
 * A second call is a no-op, so launch order does not matter.
 */
export function seedInboundBaseline(notes, owner, storage = localStorage) {
  if (readSeen(owner, storage) !== null) return
  writeSeen(owner, storage, notes.map((note) => note.id))
}

/**
 * Returns notes in this read that the device has not seen, and records them.
 * On a device with no baseline the first call seeds silently and returns [].
 */
export function takeFreshInbound(notes, owner, storage = localStorage) {
  const known = readSeen(owner, storage)
  if (known === null) {
    seedInboundBaseline(notes, owner, storage)
    return []
  }
  const knownSet = new Set(known)
  const fresh = notes.filter((note) => !knownSet.has(note.id))
  if (!fresh.length) return []
  writeSeen(owner, storage, [...known, ...fresh.map((note) => note.id)])
  return fresh
}
