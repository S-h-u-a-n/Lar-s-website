import assert from 'node:assert/strict'
import { after, test } from 'node:test'
import { createServer } from 'vite'

const server = await createServer({ server: { middlewareMode: true, watch: null, hmr: false, ws: false }, appType: 'custom' })
after(() => server.close())
const { CATEGORIES, ENTRIES, ARTICLES, NOTES } = await server.ssrLoadModule('/src/components/naturalTest/data.js')
const { SOURCE_ARTICLES, ARTICLE_LIST } = await server.ssrLoadModule('/src/components/naturalTest/articles.js')
const { TOPIC_MERGES } = await server.ssrLoadModule('/src/components/naturalTest/balancedArticles.js')

test('all six categories have six unique topics and preserve ecology coverage', () => {
  assert.deepEqual(CATEGORIES.map(c => c.chineseName), ['陸地與地質', '海洋與水域', '大氣與氣候', '植物與真菌', '動物與生命', '宇宙與天文'])
  assert.deepEqual(CATEGORIES.map(c => c.entries.length), [6, 6, 6, 6, 6, 6])
  assert.equal(ENTRIES.length, 36)
  assert.equal(new Set(ENTRIES.map(entry => entry.id)).size, 36)
  for (const id of ['ecosystems', 'food-webs', 'biodiversity', 'conservation']) {
    const article = ARTICLE_LIST.find(a => a.topicIds.includes(id))
    assert.equal(ENTRIES.find(e => e.id === article.id)?.category, 'life')
  }
  assert.equal(ENTRIES.find(e => e.id === 'pollinators')?.category, 'plants')
  assert.ok(!CATEGORIES.some(c => c.id === 'environment'))
})

test('all cards fit their category and resolve to complete articles, notes and references', () => {
  for (const category of CATEGORIES) for (const id of category.entries) {
    const entry = ENTRIES.find(e => e.id === id), article = ARTICLES[entry.article]
    assert.equal(entry.category, category.id)
    assert.ok(entry.x >= 0 && entry.x + 370 <= category.width, id)
    assert.ok(entry.y >= 0 && entry.y + 150 <= category.height, id)
    assert.ok(article.chineseName && article.introduction && article.sections.length >= 2 && NOTES[entry.note], id)
    assert.ok(article.sources.length > 0 && article.sources.every(s => new URL(s.url).protocol === 'https:'), id)
  }
})

test('astronomy uses reviewed Chinese content and the existing globe route', () => {
  const astronomy = CATEGORIES.find(c => c.id === 'astronomy')
  assert.equal(astronomy.entries.length, 6)
  assert.equal(astronomy.decoration, 'orbit')
  for (const id of astronomy.entries) {
    const article = ARTICLES[id]
    assert.match(article.description, /\p{Script=Han}/u)
    assert.ok(article.sources.every(s => new URL(s.url).hostname === 'en.wikipedia.org' && s.accessedAt === '2026-11-07'), id)
  }
  assert.deepEqual(ARTICLES['space-exploration'].relatedPage, { route: 'globe', label: '前往天體觀測 ↗' })
  assert.equal(Object.values(ARTICLES).filter(a => a.relatedPage).length, 1)
})

test('every original topic remains represented, with merged paragraphs, sections and sources intact', () => {
  assert.equal(SOURCE_ARTICLES.length, 37)
  assert.deepEqual(new Set(ARTICLE_LIST.flatMap(a => a.topicIds)), new Set(SOURCE_ARTICLES.map(a => a.id)))
  assert.deepEqual(new Set(ARTICLE_LIST.map(a => a.id)), new Set(ENTRIES.map(e => e.article)))
  for (const merge of TOPIC_MERGES) {
    const combined = ARTICLES[merge.ids[0]]
    for (const id of merge.ids) {
      const original = SOURCE_ARTICLES.find(a => a.id === id)
      for (const paragraph of original.paragraphs) assert.ok(combined.paragraphs.includes(paragraph), id)
      for (const section of original.sections) assert.ok(combined.sections.some(s => s.text === section.text), id)
      for (const source of original.sources) assert.ok(combined.sources.some(s => s.url === source.url), id)
    }
  }
})

test('split articles retain the original knowledge sentences and the seasons reference', () => {
  for (const id of ['rocks-minerals', 'rivers-lakes', 'seasons']) {
    const split = ARTICLE_LIST.filter(a => a.topicIds.includes(id))
    assert.equal(split.length, 2, id)
    const prose = split.flatMap(a => a.sections.map(s => s.text)).join('\n')
    for (const section of SOURCE_ARTICLES.find(a => a.id === id).sections) {
      for (const sentence of section.text.split('。').filter(Boolean)) assert.ok(prose.includes(sentence), `${id}: ${sentence}`)
    }
  }
  assert.ok(ARTICLES['seasonal-cycle'].sources.some(s => s.url === 'https://spaceplace.nasa.gov/seasons/en/'))
})
