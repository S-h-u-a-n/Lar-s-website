import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import vm from 'node:vm'

const palette = readFileSync(new URL('../../src/edition/palette.js', import.meta.url), 'utf8')
const pigments = vm.runInNewContext(`(${palette.match(/export const PIGMENTS = (.*)/)[1]})`)
const source = readFileSync(new URL('../../src/components/bigTest/letters.js', import.meta.url), 'utf8')
const context = vm.createContext({ PIGMENTS: pigments, orbisIcon: 'orbis.PNG' })
const module = new vm.SourceTextModule(source.replace(/^import .*$/gm, ''), { context })
await module.link(() => {}); await module.evaluate()
const { LETTERS, LETTER_THEMES, adjacentLetterIndex } = module.namespace

test('Only the supplied Orbis letter exists, with both titles, original artwork and signature', () => {
  assert.equal(LETTERS.length, 1)
  assert.equal(LETTERS[0].title, '王立 Orbis 學院')
  assert.equal(LETTERS[0].subtitle, 'Royal Orbis Academy')
  assert.equal(LETTERS[0].signature, '校長')
  assert.equal(LETTERS[0].icon, 'orbis.PNG')
  assert.equal(LETTERS[0].body.split('\n\n').length, 11)
  assert.equal(LETTERS[0].body.split('\n').at(-1), '或許下一條道路，就藏在某個尚未問出口的問題裡。')
})
test('One-letter navigation never leaves the real record', () => {
  assert.equal(adjacentLetterIndex(0, -1), 0)
  assert.equal(adjacentLetterIndex(0, 1), 0)
})
test('Future multiple-letter navigation moves between records and stops at either end', () => {
  assert.equal(adjacentLetterIndex(0, 1, 3), 1)
  assert.equal(adjacentLetterIndex(1, -1, 3), 0)
  assert.equal(adjacentLetterIndex(1, 1, 3), 2)
  assert.equal(adjacentLetterIndex(2, 1, 3), 2)
})
test('Six reusable palettes do not add letters and keep a light reading surface', () => {
  assert.equal(Object.keys(LETTER_THEMES).length, 6)
  for (const theme of Object.values(LETTER_THEMES)) {
    assert.equal(theme.paper, pigments.white)
    assert.equal(theme.ink, pigments.ink)
  }
})
