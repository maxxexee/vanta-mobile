import assert from 'node:assert/strict'
import test from 'node:test'
import { seedInboundBaseline, takeFreshInbound } from './inboundNotes.js'

function memoryStorage(initial = {}) {
  const data = new Map(Object.entries(initial))
  return {
    getItem: (key) => (data.has(key) ? data.get(key) : null),
    setItem: (key, value) => data.set(key, String(value)),
  }
}

const note = (id) => ({ id, signature: id, mint: 'mint', symbol: 'SOL', amount: 1 })

test('the first launch records the history without announcing it', () => {
  const storage = memoryStorage()
  assert.deepEqual(takeFreshInbound([note('a'), note('b')], 'owner', storage), [])
  assert.deepEqual(JSON.parse(storage.getItem('vanta-inbound-seen:owner')), ['a', 'b'])
})

test('a seeded baseline makes the next read report only the arrival', () => {
  const storage = memoryStorage()
  seedInboundBaseline([note('a')], 'owner', storage)
  assert.deepEqual(takeFreshInbound([note('a'), note('b')], 'owner', storage), [note('b')])
  assert.deepEqual(JSON.parse(storage.getItem('vanta-inbound-seen:owner')), ['a', 'b'])
})

test('the same note is not reported twice', () => {
  const storage = memoryStorage()
  seedInboundBaseline([note('a')], 'owner', storage)
  assert.equal(takeFreshInbound([note('a'), note('b')], 'owner', storage).length, 1)
  assert.deepEqual(takeFreshInbound([note('a'), note('b')], 'owner', storage), [])
})

test('owners do not share a record', () => {
  const storage = memoryStorage()
  seedInboundBaseline([note('a')], 'one', storage)
  assert.deepEqual(takeFreshInbound([note('a')], 'two', storage), [])
})

test('a corrupt record is treated as no baseline', () => {
  const storage = memoryStorage({ 'vanta-inbound-seen:owner': '{not json' })
  assert.deepEqual(takeFreshInbound([note('a')], 'owner', storage), [])
})

test('the record keeps only the newest ids', () => {
  const storage = memoryStorage()
  const notes = Array.from({ length: 250 }, (_, i) => note(`n${i}`))
  takeFreshInbound(notes, 'owner', storage)
  const stored = JSON.parse(storage.getItem('vanta-inbound-seen:owner'))
  assert.equal(stored.length, 200)
  assert.equal(stored.at(-1), 'n249')
})

test('a failing storage does not throw', () => {
  const storage = {
    getItem: () => null,
    setItem: () => {
      throw new Error('quota')
    },
  }
  assert.deepEqual(takeFreshInbound([note('a')], 'owner', storage), [])
})
