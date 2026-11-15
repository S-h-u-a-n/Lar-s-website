import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readdirSync, readFileSync } from 'node:fs'
import { loadBigContent, parseBigContentMarkdown } from '../../src/components/bigTest/bigContentParser.js'
const noteSource = readFileSync(new URL('../../content/celestial-notes/royal-orbis-academy.md', import.meta.url), 'utf8')
const diarySource = readFileSync(new URL('../../content/research-logs/laboratory-diary.md', import.meta.url), 'utf8')
const letterDirectory = new URL('../../content/letters/', import.meta.url)
const artworkDirectory = new URL('../../Art/Big/Big-letter/', import.meta.url)
const letterSources = Object.fromEntries(readdirSync(letterDirectory).filter(file => /\.md$/i.test(file)).map(file => [`/content/letters/${file}`, readFileSync(new URL(file, letterDirectory), 'utf8')]))
const letterArtworks = Object.fromEntries(readdirSync(artworkDirectory).map(file => [file, `/assets/${file}`]))

test('The existing academy note remains a published special card sourced from Markdown', () => {
  const note = parseBigContentMarkdown(noteSource, 'royal-orbis-academy.md')
  assert.equal(note.id, 'royal-orbis-academy')
  assert.equal(note.title, '王立 Orbis 學院')
  assert.equal(note.subtitle, 'Royal Orbis Academy')
  assert.equal(note.signature, '校長')
  assert.equal(note.icon, 'orbis.PNG')
  assert.equal(note.theme, 'butterMint')
  assert.equal(note.status, 'published')
  assert.equal(note.body.split('\n\n').length, 11)
  assert.equal(note.body.split('\n').at(-1), '或許下一條道路，就藏在某個尚未問出口的問題裡。')
})

test('The existing diary introduction is kept as Markdown content', () => {
  const diary = parseBigContentMarkdown(diarySource, 'laboratory-diary.md')
  assert.equal(diary.title, 'Laboratory Diary')
  assert.equal(diary.body, 'A record of quiet discoveries, unusual experiments and the small mysteries of everyday life. This space is reserved for the official diary entries and their illustrations.')
})

test('Every folder loads only published records, excluding README and sorting by order', () => {
  const records = loadBigContent({
    '/content/letters/README.md': '# Instructions',
    '/content/letters/later.md': '---\nid: later\ntitle: Later\norder: 2\nstatus: published\n---\nSecond',
    '/content/letters/draft.md': '---\nid: draft\ntitle: Draft\norder: 0\nstatus: draft\n---\nHidden',
    '/content/letters/first.md': '---\nid: first\ntitle: First\norder: 1\nstatus: published\n---\nFirst',
  }, 'letters')
  assert.deepEqual(records.map(record => record.id), ['first', 'later'])
})

test('Diary page breaks retain content order and tolerate an empty body', () => {
  const diary = parseBigContentMarkdown('---\nid: pages\ntitle: Pages\nstatus: published\n---\nFirst page.\n\n<!-- pagebreak -->\n\n## Second page\n\n**More notes.**')
  assert.deepEqual(diary.pages, ['First page.', '## Second page\n\n**More notes.**'])
  const empty = parseBigContentMarkdown('---\nid: empty\ntitle: Empty\nstatus: published\n---\n')
  assert.deepEqual(empty.pages, [''])
})

test('Leading blank lines before front matter do not block letter parsing', () => {
  const letter = parseBigContentMarkdown('\n---\nid: leading-blank\ntitle: Leading blank\nstatus: published\n---\nBody remains unchanged.', 'leading-blank.md')
  assert.equal(letter.body, 'Body remains unchanged.')
})

test('Every published letter is valid, uniquely identified, ordered, and references existing artwork', () => {
  const letters = loadBigContent(letterSources, 'letters', letterArtworks)
  const expectedPublishedCount = Object.entries(letterSources)
    .filter(([path]) => !/\/readme\.md$/i.test(path))
    .map(([path, source]) => parseBigContentMarkdown(source, path))
    .filter(letter => letter.status === 'published').length
  assert.equal(letters.length, expectedPublishedCount)
  assert.deepEqual(letters.map(letter => letter.order), [...letters].map(letter => letter.order).sort((a, b) => a - b))
  assert.equal(new Set(letters.map(letter => letter.id)).size, letters.length)
  assert.ok(letters.every(letter => letter.status === 'published'))
  assert.equal(letters.find(letter => letter.id === 'letter-kane').icon, '/assets/凱恩.PNG')
  assert.equal(letters.find(letter => letter.id === 'letter-dolores').icon, '/assets/多萊絲.PNG')
})

test('Invalid metadata and duplicate IDs report their source instead of silently falling back', () => {
  assert.throws(() => parseBigContentMarkdown('---\nid: missing-status\ntitle: Missing\n---\n', 'missing.md'), /missing\.md: status must/)
  assert.throws(() => loadBigContent({
    '/content/notes/a.md': '---\nid: same\ntitle: A\nstatus: published\n---\nA',
    '/content/notes/b.md': '---\nid: same\ntitle: B\nstatus: published\n---\nB',
  }, 'notes'), /duplicate content id/)
})

test('The academy illustration filename resolves through the Vite asset map', () => {
  const note = loadBigContent({ '/content/notes/academy.md': noteSource }, 'notes', { 'orbis.PNG': '/assets/orbis-hash.PNG' })
  assert.equal(note[0].icon, '/assets/orbis-hash.PNG')
})
