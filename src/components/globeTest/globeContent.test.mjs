import assert from 'node:assert/strict'
import { readdir, readFile } from 'node:fs/promises'
import { test } from 'node:test'
import { isStoryPlayable, parseGlobeMarkdown, parseGlobeStories } from './globeContentParser.js'

const root = new URL('../../../content/globe/', import.meta.url)
const expectedBodies = ['earth', 'moon', 'jupiter', 'mars', 'mercury', 'neptune', 'pluto', 'saturn', 'uranus', 'venus', 'sun']
const expectedContinents = ['asia', 'europe', 'africa', 'north-america', 'south-america', 'oceania', 'antarctica']

async function loadEntries(directory, includeStories = false) {
  const folder = new URL(`${directory}/`, root)
  const files = (await readdir(folder)).filter(file => file.endsWith('.md')).sort()
  return Promise.all(files.map(async file => parseGlobeMarkdown(
    await readFile(new URL(file, folder), 'utf8'),
    { includeStories },
  )))
}

test('celestial bodies and continent introductions load from Markdown in the original order', async () => {
  const bodies = (await loadEntries('bodies')).sort((a, b) => a.order - b.order)
  const continents = (await loadEntries('continents', true)).sort((a, b) => a.order - b.order)

  assert.deepEqual(bodies.map(entry => entry.id), expectedBodies)
  assert.deepEqual(continents.map(entry => entry.id), expectedContinents)
  for (const entry of [...bodies, ...continents]) {
    assert.ok(entry.title)
    assert.ok(entry.name)
    assert.ok(entry.subtitle)
    assert.ok(entry.introduction)
    assert.ok(entry.facts.length)
    assert.ok(entry.sections.length)
    assert.ok(entry.sources.length)
  }
})

test('reference sources preserve Markdown links, authors, order, and optional access dates', async () => {
  const bodies = await loadEntries('bodies')
  const continents = await loadEntries('continents')
  for (const entry of [...bodies, ...continents]) {
    assert.ok(entry.sources.length, entry.id)
    assert.ok(entry.sources.every(source => source.title && source.url.startsWith('https://')), entry.id)
  }

  const venus = bodies.find(entry => entry.id === 'venus')
  assert.deepEqual(venus.sources.slice(0, 2).map(source => [source.title, source.author]), [
    ['Venus Facts', 'NASA'],
    ['Venus Exploration', 'NASA'],
  ])
  assert.equal(venus.sources[0].accessedAt, '')

  const withAccessDate = parseGlobeMarkdown(`# Sample

## 參考資料

- [Example](https://example.com) — Example Author｜查閱：2026-11-14`)
  assert.deepEqual(withAccessDate.sources, [{
    title: 'Example',
    url: 'https://example.com',
    author: 'Example Author',
    accessedAt: '2026-11-14',
  }])
  assert.deepEqual(parseGlobeMarkdown('# No sources').sources, [])
})

test('all continent and solar-system dialogue slots are selectable and solar-system stories share one file', async () => {
  const continents = await loadEntries('continents', true)
  for (const continent of continents) assert.equal(continent.stories.length, 3, continent.id)

  const solarSystem = await readFile(new URL('solar-system.md', root), 'utf8')
  const stories = parseGlobeStories(solarSystem)
  assert.equal(stories.length, 3)
  assert.equal((await readdir(root)).filter(file => file === 'solar-system.md').length, 1)

  for (const story of [...continents.flatMap(entry => entry.stories), ...stories]) {
    assert.ok(story.title)
    if (isStoryPlayable(story)) {
      assert.ok(story.dialogue.every(message => message.character && message.text !== undefined))
    }
  }
})

test('draft dialogue with content is playable while empty or placeholder-only slots are not', async () => {
  const continents = await loadEntries('continents', true)
  const solarSystem = parseGlobeStories(await readFile(new URL('solar-system.md', root), 'utf8'))
  const stories = [...continents.flatMap(entry => entry.stories), ...solarSystem]

  assert.ok(stories.some(story => story.dialogue.length === 0))
  assert.ok(stories.some(story => story.status === 'draft' && story.dialogue.length > 0))
  assert.ok(stories.every(story => ['complete', 'draft'].includes(story.status)))
  assert.ok(stories.every(story => story.title))
  assert.ok(stories.filter(story => story.status === 'draft' && story.dialogue.length > 0).every(isStoryPlayable))
  assert.ok(stories.filter(story => story.dialogue.length === 0).every(story => !isStoryPlayable(story)))
  assert.ok(stories.filter(story => story.status === 'complete' && story.dialogue.length > 0).every(isStoryPlayable))

  const antarctica = continents.find(entry => entry.id === 'antarctica')
  assert.deepEqual(antarctica.stories.map(story => story.title), [
    '好想養企鵝！',
    '南極條約：把一整塊大陸主要留給和平與科學用途',
    '南極是沙漠',
  ])
  assert.ok(antarctica.stories[0].dialogue.length > 0)
  assert.ok(antarctica.stories[1].dialogue.length > 0)
  assert.equal(antarctica.stories[2].dialogue.length, 0)
  assert.equal(parseGlobeStories('## 閒聊\n\n### placeholder\n\n#### 尚未完成\n\n<!-- status: draft -->\n\n〔待補充〕')[0].dialogue.length, 0)
})

test('Markdown title and dialogue edits are reflected by the content parser', async () => {
  const markdown = await readFile(new URL('continents/asia.md', root), 'utf8')
  const edited = markdown
    .replace('# 亞洲 Asia', '# 亞洲測試 Asia')
    .replace('伊爾：中國的料理感覺都好好吃啊，以後集齊材料了來煮煮看吧。', '伊爾：測試文字')
  const result = parseGlobeMarkdown(edited, { includeStories: true })

  assert.equal(result.title, '亞洲測試 Asia')
  assert.equal(result.stories[0].dialogue[0].text, '測試文字')
})
