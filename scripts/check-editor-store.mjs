// Isolated storage regression checks. Never reads the browser's real drafts.
import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { resolve } from 'node:path'
import { pathToFileURL } from 'node:url'

const source = (await readFile(new URL('../src/dev/textEditorStore.js', import.meta.url), 'utf8'))
  .replace("from 'react'", `from '${pathToFileURL(resolve('node_modules/react/index.js')).href}'`)
  .replaceAll('import.meta.env.DEV', 'true')
const storage = new Map()
let writes = 0
const warnings = []
console.warn = (...args) => warnings.push(args)
globalThis.localStorage = {
  getItem: key => storage.get(key) ?? null,
  setItem: (key, value) => { writes++; storage.set(key, value) },
}
globalThis.document = { body: {} }
globalThis.getComputedStyle = () => ({
  color: 'rgb(52,70,90)', fontFamily: 'serif', fontSize: '16px', fontWeight: '400',
  lineHeight: 'normal', letterSpacing: 'normal', textAlign: 'left', writingMode: 'horizontal-tb', zIndex: 'auto', opacity: '1',
})
const store = await import(`data:text/javascript;base64,${Buffer.from(source).toString('base64')}`)
const key = page => `genesis:text-editor:${page}:v1`
const legacy = (pageId, text) => ({ 'draft-text-1': { type: 'draft', pageId, label: 'Draft 1', defaults: { text, x: 12, y: 8 }, values: { text, x: 24, y: 10 }, customLegacyField: 'keep' } })
const homeBytes = JSON.stringify(legacy('home', 'Home draft'))
const telescopeBytes = JSON.stringify(legacy('telescope-test', 'Telescope draft'))
storage.set(key('home'), homeBytes)
storage.set(key('telescope-test'), telescopeBytes)
const stopHome = store.enablePageTextPersistence('home', 'main-')
const stopTelescope = store.enablePageTextPersistence('telescope-test', 'telescope-test-')
assert.equal(writes, 0, 'Opening/restoring editors must not write drafts')
const homeDraft = store.getTextConfig('home').draft[0]
const telescopeDraft = store.getTextConfig('telescope-test').draft[0]
assert.notEqual(homeDraft.id, telescopeDraft.id, 'Identical legacy IDs need distinct runtime identities')
assert.equal(homeDraft.originalId, 'draft-text-1')
assert.equal(homeDraft.text, 'Home draft')
assert.equal(telescopeDraft.text, 'Telescope draft')
assert.equal(homeDraft.x, 24, 'Saved offsets are preserved')
store.updateText(homeDraft.id, { text: 'Edited home draft' })
assert.equal(JSON.parse(storage.get(key('home')))['draft-text-1'].values.text, 'Edited home draft')
assert.equal(JSON.parse(storage.get(key('home')))['draft-text-1'].customLegacyField, 'keep')
assert.equal(storage.get(key('telescope-test')), telescopeBytes, 'Other page draft remains byte-for-byte intact')
const stopComic = store.enablePageTextPersistence('t-comic', 't-comic-')
store.registerText('t-dialog-text-1', 'Dialog 1', { style: {}, childNodes: [] }, 'registered', { defaultValues: { text: 'Original dialogue' } })
const multiline = '第一行\n第二行\n\n最後一行'
store.updateText('t-dialog-text-1', { text: multiline })
assert.equal(JSON.parse(storage.get(key('t-comic')))['t-dialog-text-1'].values.text, multiline, 'Saving preserves manual and blank lines')
assert.equal(store.getTextConfig('t-comic').registered['t-dialog-text-1'].text, multiline, 'Copy Config preserves manual lines')
stopComic()
store.updateText('t-dialog-text-1', { text: 'Unsaved temporary value' })
const stopComicRestore = store.enablePageTextPersistence('t-comic', 't-comic-', { readOnly: true })
assert.equal(store.getTextValues('t-dialog-text-1').text, multiline, 'Production read-only restore preserves manual lines')
stopComicRestore()
const afterComicChecks = writes
const element = { style: {}, childNodes: [{ nodeName: '#text', textContent: 'Footer' }] }
store.registerText('home-footer-credit', 'Footer', element)
assert.equal(writes, afterComicChecks, 'Registering DOM text does not save or replace drafts')
store.registerText('telescope-test-heading', 'Telescope', element)
assert.deepEqual(Object.keys(store.getTextConfig('home').registered), ['home-footer-credit'], 'Copy Config is page scoped')
const stopWeather = store.enablePageTextPersistence('bottled-weather', 'bottled-weather-')
store.addDraft('bottled-weather')
const added = store.getTextConfig('bottled-weather').draft[0]
assert.ok(added.id.startsWith('draft-text-bottled-weather-'), 'New draft IDs include the page')
assert.equal(JSON.parse(storage.get(key('bottled-weather')))[added.id].pageId, 'bottled-weather')
store.deleteDraft(added.id)
assert.equal(store.getTextConfig('bottled-weather').draft.length, 0)
assert.equal(JSON.parse(storage.get(key('bottled-weather')))[added.id], undefined)
storage.set(key('broken-page'), '{invalid-json')
const stopBroken = store.enablePageTextPersistence('broken-page', 'broken-page-')
store.registerText('broken-page-label', 'Broken page', element)
store.updateText('broken-page-label', { text: 'Available in Copy Config' })
assert.equal(storage.get(key('broken-page')), '{invalid-json', 'Unreadable drafts are not overwritten')
assert.ok(warnings.length >= 2)
for (const stop of [stopHome, stopTelescope, stopWeather, stopBroken]) stop()
console.log('Editor store checks passed: page isolation, legacy draft compatibility, edit-only persistence, scoped Config, Add/Delete, corrupt-draft preservation.')
