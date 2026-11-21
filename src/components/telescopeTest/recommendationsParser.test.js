import assert from 'node:assert/strict'
import { readFileSync, existsSync } from 'node:fs'
import test from 'node:test'
import { parseRecommendations } from './recommendationsParser.js'

const markdownUrl = new URL('../../../content/telescope/recommendations.md', import.meta.url)
const markdown = readFileSync(markdownUrl, 'utf8')
const recommendations = parseRecommendations(markdown)

test('parses all fifteen recommendations in the requested order', () => {
  assert.deepEqual(recommendations.map(place => place.id), [
    'ral', 'il', 'ost', 'yuta', 'reed', 'anpu', 'harriet', 'kane',
    'seth', 'laike', 'pato', 'arena', 'dioscuri', 'farenai', 'isis',
  ])
})

test('validates coordinates, zooms, links, and existing portrait paths', () => {
  for (const place of recommendations) {
    assert.ok(Math.abs(place.latitude) <= 90, place.id)
    assert.ok(Math.abs(place.longitude) <= 180, place.id)
    assert.ok(place.zoom >= 1 && place.zoom <= 16, place.id)
    assert.equal(new URL(place.website).protocol, 'https:')
    assert.ok(existsSync(new URL(`../../../${place.avatarPath}`, import.meta.url)), place.avatarPath)
    assert.match(place.photoPath, /^\/places\/telescope-recommendations\/.+\.webp$/)
  }
})

test('uses edited Markdown values when parsed again', () => {
  const updated = markdown.replace(
    '- quote: 怎麼想都是最偉大最帥的地方了吧⋯！！',
    '- quote: Markdown 更新測試',
  )
  assert.equal(parseRecommendations(updated)[0].quote, 'Markdown 更新測試')
})
