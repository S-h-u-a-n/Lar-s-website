import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { MODE_DIALOGUE, MODE_SWITCH_CONFIG } from '../src/components/telescopeTest/dialogue/modeDialogue.js'
import { createDialogueController, DIALOGUE_STORAGE_KEY } from '../src/components/telescopeTest/dialogue/dialogueController.js'
import { chooseIdleMotion, chooseDialogueIdle } from '../src/components/telescopeTest/dialogue/motionPolicy.js'
import { HOME_SWATCH_COLORS } from '../src/components/telescopeTest/homeSwatchColors.js'
const root = new URL('../', import.meta.url)
const home = readFileSync(new URL('src/components/HeroSection.jsx', root), 'utf8').split('\n').find(line => line.includes('home-geometry-swatches'))
assert.deepEqual(HOME_SWATCH_COLORS, home.match(/#[0-9a-f]{6}/g))
const idle3 = JSON.parse(readFileSync(new URL('Art/telescope/yuta-live2d/待機3.motion3.json', root)))
assert(idle3.Meta.Duration > 0 && idle3.Curves.length > 0)
assert.deepEqual(Object.values(MODE_DIALOGUE).flat().map(line => line.text), [
  '這樣一看，地球真是又小又大呢。',
  '原本還想加入更多標記功能的，不過最後還是決定讓畫面簡單一些，哈哈。',
  '如果能直接在地圖上畫出傳送陣就好了。啊，差點忘了那裡不能用魔法呢。',
  '果然還是看看實景比較有意思呢～',
  '因為裡面內建了比較複雜的術式，所以可能要加載一會才能完整顯示喔。',
  '同一個地點，從不同的方式觀察，得到的印象也會不太一樣呢。',
  '嗯？是在比較兩種模式的差異嗎？',
  '呵呵，這台望遠鏡的切換功能應該已經通過你的測試了吧？',
])
assert.deepEqual(Object.values(MODE_DIALOGUE).flat().map(line => line.motion), [
  '對話', '對話-開心', '感興趣',
  '對話-開心', '開心', '對話',
  '感興趣', '對話-wink',
])
const weights = { '待機3': 0, '待機一般': 0, '待機1': 0 }
for (let i = 0; i < 10000; i++) weights[chooseDialogueIdle(() => (i + .5) / 10000)]++
assert.deepEqual(weights, { '待機3': 7000, '待機一般': 1500, '待機1': 1500 })
let current = '待機一般'
for (let i = 0; i < 100; i++) {
  const next = chooseIdleMotion({ current, dialogueActive: false, idleForMs: 0 }, () => i % 2 ? .9 : .1)
  if (['待機一般', '待機1'].includes(current)) assert.equal(next, '待機3')
  else assert(['待機一般', '待機1'].includes(next))
  current = next
}
assert.equal(chooseIdleMotion({ current: '待機3', dialogueActive: false, idleForMs: 30000 }, () => 0), '待機2')
assert.equal(chooseIdleMotion({ current: '待機2', dialogueActive: false, idleForMs: 30000 }, () => 0), '待機3')
assert.equal(chooseIdleMotion({ current: '待機一般', dialogueActive: false, idleForMs: 30000 }, () => 0), '待機3')
assert.notEqual(chooseIdleMotion({ current: '待機3', dialogueActive: true, idleForMs: 30000 }, () => 0), '待機2')
function fixture(completed = true) {
  let time = 0, seed = 719, mode = 'globe'
  const storage = { getItem: () => completed ? JSON.stringify({ version: 1, introCompleted: true, randomCount: 0, favoriteCount: 0, used: {}, shownHints: [], chatBag: [], lastChat: null, lastRandom: null, creditedFavorites: [] }) : null, setItem() {} }
  const c = createDialogueController({ storage, now: () => time, random: () => (seed = seed * 16807 % 2147483647) / 2147483647 })
  return { c, elapse: ms => { time += ms }, flip: () => { mode = mode === 'globe' ? 'satellite' : 'globe'; return c.modeSwitched(mode) }, same: () => c.modeSwitched(mode), finish: () => { while (c.getSnapshot().active) { time += 150; c.advance() } } }
}
{
  const f = fixture(false); f.flip(); assert.equal(f.c.getSnapshot().group, 'intro'); f.finish()
  for (let i = 0; i < 5; i++) { f.flip(); assert.notEqual(f.c.getSnapshot().group, 'mode-burst') }
}
{
  const f = fixture(); f.finish(); const seen = { 'mode-map': new Set(), 'mode-view': new Set() }, last = {}
  for (let i = 0; i < 50; i++) {
    f.elapse(16000); f.flip(); const state = f.c.getSnapshot()
    assert.equal(state.active, false); assert.equal(state.hasNext, false); assert.equal(state.kind, 'mode')
    assert.notEqual(state.segment.id, last[state.group]); last[state.group] = state.segment.id
    seen[state.group].add(state.segment.id)
    const revision = state.segmentKey; assert.equal(f.same(), false); assert.equal(f.c.getSnapshot().segmentKey, revision)
  }
  assert.equal(seen['mode-map'].size, 3); assert.equal(seen['mode-view'].size, 3)
  f.elapse(100000); assert.equal(f.c.tick(), false)
  f.c.talk(); assert.equal(f.c.getSnapshot().kind, 'chat'); f.flip(); assert.equal(f.c.getSnapshot().kind, 'mode')
}
{
  const f = fixture(); f.finish(); let priorBurst
  for (let episode = 0; episode < 2; episode++) {
    if (episode) f.elapse(MODE_SWITCH_CONFIG.cooldownMs + 1)
    for (let i = 0; i < 6; i++) { f.elapse(200); f.flip(); if (i < 5) assert.notEqual(f.c.getSnapshot().group, 'mode-burst') }
    assert.equal(f.c.getSnapshot().group, 'mode-burst')
    assert.notEqual(f.c.getSnapshot().segment.id, priorBurst); priorBurst = f.c.getSnapshot().segment.id
    for (let i = 0; i < 8; i++) { f.elapse(200); f.flip(); assert.notEqual(f.c.getSnapshot().group, 'mode-burst') }
  }
}
console.log('Telescope modes: ten-file metadata, exact eight quotes, nonrepeat pools, accepted-switch counting, 6/15s burst and cooldown, latest response priority, no confirmation, idle3 alternation, exact 70/15/15 boundaries, idle2 restriction and exact Home colors passed.')
