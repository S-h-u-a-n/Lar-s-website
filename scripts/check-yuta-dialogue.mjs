import assert from 'node:assert/strict'
import { readFileSync, readdirSync } from 'node:fs'
import { YUTA_DIALOGUE as groups, CHAT_GROUP_IDS } from '../src/components/telescopeTest/dialogue/yutaDialogue.js'
import { MODE_DIALOGUE } from '../src/components/telescopeTest/dialogue/modeDialogue.js'
import { createDialogueController, DIALOGUE_STORAGE_KEY, DIALOGUE_CONFIG } from '../src/components/telescopeTest/dialogue/dialogueController.js'
import { chooseIdleMotion, isDialogueMotion } from '../src/components/telescopeTest/dialogue/motionPolicy.js'

// Independently extract balanced OUTER quotation pairs from the supplied text.
// Inner 「你」, 「做不到」, etc. remain literal dialogue, not new bubbles.
const original = readFileSync(new URL('../src/components/telescopeTest/dialogue/yuta-original.txt', import.meta.url), 'utf8')
const quoted = []; let depth = 0, buffer = ''
for (const ch of original) {
  if (ch === '「') { if (depth++) buffer += ch }
  else if (ch === '」') { if (--depth) buffer += ch; else { quoted.push(buffer); buffer = '' } }
  else if (depth) buffer += ch
}
assert.equal(depth, 0)
const all = Object.values(groups).flatMap(group => group.segments)
const modeSegments = Object.values(MODE_DIALOGUE).flat()
assert.equal(all.length, 82); assert.equal(CHAT_GROUP_IDS.length, 14)
assert.deepEqual([...all, ...modeSegments].map(s => s.text), quoted)
const rawMotions = [...original.matchAll(/^（(開場|指右邊-開心|指右邊|開心|感興趣|對話(?:-思考|-開心|-wink|-笑容)?)）$/gm)].map(match => match[1])
assert.deepEqual([...all, ...modeSegments].filter(s => s.motion).map(s => s.motion), rawMotions)
const allowed = new Set(['開場','指右邊-開心','指右邊','開心','感興趣','對話','對話-思考','對話-開心','對話-wink','對話-笑容'])
assert(all.every(s => s.motion === null || allowed.has(s.motion)))
const motionFiles = new Set(readdirSync(new URL('../Art/telescope/yuta-live2d/', import.meta.url)).filter(file => file.endsWith('.motion3.json')).map(file => file.replace(/\.motion3\.json$/, '')))
assert([...new Set(all.map(s => s.motion).filter(Boolean))].every(motion => motionFiles.has(motion)))
assert(motionFiles.has('對話-wink'))
const assetSource = readFileSync(new URL('../src/components/telescopeTest/yutaAssets.js', import.meta.url), 'utf8')
const mappedNames = assetSource.match(/export const YUTA_MOTIONS = Object\.fromEntries\(\[([\s\S]*?)\]\.map/)?.[1]
assert(mappedNames)
assert.deepEqual([...mappedNames.matchAll(/'([^']+)'/g)].map(match => match[1]), [
  '待機1','待機2','待機3','待機一般','指右邊-開心','指右邊','開心','開場','感興趣','對話-思考','對話-開心','對話','對話-wink',
])
assert([...mappedNames.matchAll(/'([^']+)'/g)].every(([, name]) => motionFiles.has(name)))
assert([...new Set([...all, ...modeSegments].map(s => s.motion).filter(Boolean))].every(motion => mappedNames.includes(`'${motion}'`)))
assert.deepEqual(CHAT_GROUP_IDS.map(id => groups[id].segments.length), [5,3,5,4,4,5,3,3,3,4,4,7,3,8])
assert.deepEqual(groups.intro.segments.map(s => s.motion), ['開場', '指右邊', null, '對話-wink'])
for (const name of ['開場','指右邊','指右邊-開心','開心','感興趣','對話','對話-思考','對話-開心','對話-wink']) assert(isDialogueMotion(name))
for (const name of ['待機1','待機2','待機3','待機一般']) assert(!isDialogueMotion(name))

function fixture(initial) {
  let time = 0, seed = 12345
  const map = new Map(initial ? [[DIALOGUE_STORAGE_KEY, JSON.stringify(initial)]] : [])
  const storage = { getItem: key => map.get(key) ?? null, setItem: (key, value) => map.set(key, value) }
  const now = () => time, random = () => ((seed = (seed * 16807) % 2147483647) / 2147483647)
  const create = (initialEntry = 'intro') => createDialogueController({ storage, now, random, initialEntry })
  const c = create()
  const advance = controller => { time += 150; return controller.advance() }
  const finish = (controller = c) => { while (controller.getSnapshot().active) advance(controller) }
  return { c, map, create, advance, finish, elapse: ms => { time += ms } }
}
{
  const { c, map, create, advance } = fixture()
  assert.equal(map.size, 0); assert.equal(create().getSnapshot().group, 'intro')
  c.feature('recommendations'); c.talk(); assert.equal(c.getSnapshot().group, 'intro')
  assert(c.advance()); assert(!c.advance()); assert.equal(c.getSnapshot().index, 1)
  advance(c); advance(c)
  assert.equal(c.getSnapshot().index, 3); assert.equal(c.getSnapshot().hasNext, false)
  assert(c.getSnapshot().introActive); assert(!c.getSnapshot().introCompleted)
  advance(c); assert(!c.getSnapshot().introActive); assert(c.getSnapshot().introCompleted)
  const returning = create('welcome'); assert.equal(returning.getSnapshot().group, 'welcome'); assert(!returning.getSnapshot().introActive)
  assert.equal(groups.welcome.segments.length, 3)
}
{
  const saved = { version: 1, introCompleted: true, randomCount: 7, favoriteCount: 3, used: { random: true }, shownHints: ['random'], chatBag: ['chat-3'], lastChat: 'chat-2', lastRandom: 1, creditedFavorites: [] }
  const f = fixture(saved)
  let time = 0
  const storage = { getItem: key => f.map.get(key) ?? null, setItem: (key, value) => f.map.set(key, value) }
  const replay = createDialogueController({ storage, initialEntry: 'intro', now: () => time })
  assert.equal(replay.getSnapshot().group, 'intro'); assert(replay.getSnapshot().introActive); assert(!replay.getSnapshot().introCompleted)
  while (replay.getSnapshot().active) { time += 150; replay.advance() }
  assert.equal(replay.getSnapshot().introCompleted, true)
  assert.deepEqual(JSON.parse(f.map.get(DIALOGUE_STORAGE_KEY)), saved)
  assert.equal(createDialogueController({ storage, initialEntry: 'intro', now: () => time }).getSnapshot().group, 'intro')
  assert.equal(createDialogueController({ storage, initialEntry: 'welcome', now: () => time }).getSnapshot().group, 'welcome')
}
{
  const f = fixture(); f.finish()
  let last = null
  for (let i = 1; i <= 12; i++) {
    f.c.randomObserved(); const s = f.c.getSnapshot()
    assert.equal(s.randomCount, i)
    if ([5, 10].includes(i)) assert.equal(s.group, `random-milestone-${i}`)
    else { assert.equal(s.group, 'random'); assert.notEqual(s.segment.id, last); last = s.segment.id }
  }
  assert.equal(f.create().getSnapshot().randomCount, 12)
  f.c.feature('collection'); assert.equal(f.c.getSnapshot().favoriteCount, 0)
  for (let i = 1; i <= 10; i++) {
    const location = { longitude: i * 10, latitude: 20, zoom: 5 }
    f.c.favoriteAdded(location); assert.equal(f.c.getSnapshot().favoriteCount, i)
    if ([1, 5, 10].includes(i)) assert.equal(f.c.getSnapshot().group, `favorite-${i}`)
    f.c.favoriteAdded({ ...location, longitude: location.longitude + .0000001 })
    assert.equal(f.c.getSnapshot().favoriteCount, i)
  }
}
{
  const f = fixture(); f.finish(); const seen = []
  for (let i = 0; i < 28; i++) {
    assert(f.c.talk()); const start = f.c.getSnapshot(); seen.push(start.group)
    const texts = []
    while (f.c.getSnapshot().active) { texts.push(f.c.getSnapshot().segment.text); f.c.talk(); f.elapse(100000); assert(!f.c.tick()); f.advance(f.c) }
    assert.deepEqual(texts, groups[start.group].segments.map(s => s.text))
  }
  assert.equal(new Set(seen.slice(0, 14)).size, 14); assert.equal(new Set(seen.slice(14)).size, 14); assert.notEqual(seen[13], seen[14])
  f.c.talk(); const prior = f.c.getSnapshot().group; f.c.talk(); assert.equal(f.c.getSnapshot().group, prior)
  f.c.randomObserved(); assert.equal(f.c.getSnapshot().kind, 'function')
}
{
  const f = fixture(); f.elapse(100000); assert(!f.c.tick()); f.finish()
  for (const feature of DIALOGUE_CONFIG.hintOrder) { f.elapse(100000); assert(f.c.tick()); assert.equal(f.c.getSnapshot().group, `hint-${feature}`); f.finish(); assert(!f.c.tick()) }
  f.elapse(100000); assert(!f.c.tick())
  const priority = fixture(); priority.finish(); priority.elapse(100000); priority.c.tick(); assert.equal(priority.c.getSnapshot().kind, 'hint'); assert(priority.c.talk()); assert.equal(priority.c.getSnapshot().kind, 'chat'); priority.c.randomObserved(); assert.equal(priority.c.getSnapshot().kind, 'function')
  const used = fixture(); used.finish(); used.c.feature('random'); used.finish(); used.elapse(100000); used.c.tick(); assert.equal(used.c.getSnapshot().group, 'hint-recommendations')
}
assert.notEqual(chooseIdleMotion({ current: '待機3', dialogueActive: false, idleForMs: 29999 }, () => 0), '待機2')
assert.equal(chooseIdleMotion({ current: '待機3', dialogueActive: false, idleForMs: 30000 }, () => 0), '待機2')
assert.notEqual(chooseIdleMotion({ current: '待機2', dialogueActive: false, idleForMs: 90000 }, () => 0), '待機2')
assert.notEqual(chooseIdleMotion({ current: '待機3', dialogueActive: true, idleForMs: 90000 }, () => 0), '待機2')
console.log('Yuta: exact 82 segments and motions, final intro confirmation, persistence, priority, debounce, 14-chat shuffle, hints, random/favorite milestones, deduplication and idle policy passed.')
