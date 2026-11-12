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
const { LETTERS, NOTES, LETTER_THEMES, adjacentLetterIndex } = module.namespace

test('Orbis belongs only to the notes collection and retains its supplied content', () => {
  assert.equal(LETTERS.length, 0)
  assert.equal(NOTES.length, 1)
  assert.equal(NOTES[0].title, '王立 Orbis 學院')
  assert.equal(NOTES[0].subtitle, 'Royal Orbis Academy')
  assert.equal(NOTES[0].signature, '校長')
  assert.equal(NOTES[0].icon, 'orbis.PNG')
  assert.equal(NOTES[0].body.split('\n\n').length, 11)
  assert.equal(NOTES[0].body.split('\n').at(-1), '或許下一條道路，就藏在某個尚未問出口的問題裡。')
})
test('One-letter navigation never leaves the real record', () => {
  assert.equal(adjacentLetterIndex(0, -1, NOTES.length), 0)
  assert.equal(adjacentLetterIndex(0, 1, NOTES.length), 0)
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

const configSource = readFileSync(new URL('../../src/components/bigTest/config.js', import.meta.url), 'utf8')
const configModule = new vm.SourceTextModule(configSource.replace(/^import .*$/gm, ''), { context })
await configModule.link(() => {}); await configModule.evaluate()
const { documentPanelTheme, DOCUMENT_PANEL_THEMES } = configModule.namespace

test('Document colors are stable across openings and shared across entrance paths', () => {
  for (const id of ['letter', 'diary', 'notes', 'future-note']) {
    const initial = documentPanelTheme(id)
    for (let repeat = 0; repeat < 10; repeat++) assert.equal(documentPanelTheme(id), initial)
  }
  assert.notEqual(documentPanelTheme('letter').cover, documentPanelTheme('diary').cover)
  assert.equal(DOCUMENT_PANEL_THEMES.length, 5)
  for (const color of ['#ffe1d8', '#d8e9ff', '#f1e5f6', '#ffefd3']) assert.ok(DOCUMENT_PANEL_THEMES.some(theme => theme.cover === color))
  for (const theme of DOCUMENT_PANEL_THEMES.filter(theme => ['#d8e9ff', '#f1e5f6'].includes(theme.cover))) assert.equal(theme.dots, '#9bb9d1')
})
