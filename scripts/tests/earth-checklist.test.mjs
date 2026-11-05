import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import vm from 'node:vm'

const config = readFileSync(new URL('../../src/edition/config.js', import.meta.url), 'utf8')
const tools = [...config.matchAll(/\{ id: '([^']+)', route: '[^']+', number: '[^']+', name: '([^']+)'/g)].map(([, id, name]) => ({ id, name }))
const objects = vm.runInNewContext(config.match(/export const DESK_OBJECTS = (.*)/)[1])
const source = readFileSync(new URL('../../src/components/bigTest/earthExplorationStore.js', import.meta.url), 'utf8')
async function load(storage = new Map()) {
  const code = source.replace(/^import .*$/gm, '')
  const listeners = {}
  const context = vm.createContext({ TOOLS: tools, DESK_OBJECTS: objects, localStorage: { getItem: key => storage.get(key) ?? null, setItem: (key, value) => storage.set(key, value) }, window: { addEventListener: (name, listener) => { listeners[name] = listener } }, useSyncExternalStore: (_, snapshot) => snapshot() })
  const module = new vm.SourceTextModule(code, { context })
  await module.link(() => {}); await module.evaluate()
  return module.namespace
}
test('16 unique items; only all 16 unlock the exact text', async () => {
  const store = await load()
  assert.equal(store.CHECKLIST_ITEMS.length, 16)
  assert.equal(new Set(store.CHECKLIST_ITEMS.map(item => item.id)).size, 16)
  for (const item of store.CHECKLIST_ITEMS.slice(0, 15)) store.markEarthExplored(item.id)
  assert.equal(store.useEarthProgress().unlocked, false)
  store.markEarthExplored(store.CHECKLIST_ITEMS[15].id)
  assert.equal(store.useEarthProgress().unlockedText, '檢查完畢！地球今天也運轉得很好呢。')
})
test('opening the checklist, duplicates and pending entries cannot complete items; progress survives reload', async () => {
  const storage = new Map(), store = await load(storage)
  assert.equal(store.useEarthProgress().completed.length, 0)
  store.markEarthExplored('pending'); store.markEarthExplored('bookink')
  assert.equal(store.useEarthProgress().completed.length, 0)
  store.markEarthExplored('letter'); store.markEarthExplored('letter')
  assert.equal(store.useEarthProgress().completed.length, 1)
  const reloaded = await load(storage)
  assert.equal(reloaded.useEarthProgress().completed[0], 'letter')
  assert.equal(reloaded.useEarthProgress().unlocked, false)
})
test('corrupt data is recoverable and cannot forge an unlock', async () => {
  const store = await load(new Map([['genesis:earth-checklist:v1', '{invalid']]))
  assert.equal(store.useEarthProgress().completed.length, 0)
  const normalized = store.normalizeProgress({ completed: ['letter', 'letter', 'bookink'], unlocked: true })
  assert.equal(normalized.completed.length, 1)
  assert.equal(normalized.unlocked, false)
})
