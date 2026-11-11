import test from 'node:test'
import assert from 'node:assert/strict'
import { collectReferences, referenceKey } from './references.js'

test('Wikipedia article identity ignores fragments, query strings, mobile host and encoding differences', () => {
  const urls = [
    'https://en.wikipedia.org/wiki/Ancient_Greece',
    'http://en.m.wikipedia.org/wiki/Ancient%20Greece?utm_source=example#History',
    'https://en.wikipedia.org/wiki/ancient_Greece?oldid=123',
    'https://en.wikipedia.org/w/index.php?title=Ancient_Greece&action=view',
  ]
  assert.equal(new Set(urls.map(referenceKey)).size, 1)
  assert.equal(referenceKey('https://en.wikipedia.org/wiki/Encyclop%C3%A9die'), referenceKey('https://en.wikipedia.org/wiki/Encyclopédie'))
  assert.notEqual(referenceKey(urls[0]), referenceKey('https://en.wikipedia.org/wiki/Athenian_democracy'))
  assert.notEqual(referenceKey(urls[0]), referenceKey('https://en.wikipedia.org/wiki/Sparta'))
  assert.notEqual(referenceKey(urls[0]), referenceKey('https://fr.wikipedia.org/wiki/Ancient_Greece'))
})

test('collect all section references in reading order, deduplicate URLs despite different names, preserve original data and links', () => {
  const sources = {
    a: ['Wikipedia · 古希臘', 'https://en.wikipedia.org/wiki/Ancient_Greece'],
    b: ['Wikipedia · 希臘世界', 'http://en.m.wikipedia.org/wiki/Ancient%20Greece#History'],
    c: ['Wikipedia · 斯巴達', 'https://en.wikipedia.org/wiki/Sparta'],
    d: ['Wikipedia · 雅典民主', 'https://en.wikipedia.org/wiki/Athenian_democracy'],
  }
  const record = { sections: [{ sources: ['a','c'] }, { sources: ['b','d'] }], sources: ['b'] }
  const original = JSON.stringify({ record, sources })
  const result = collectReferences(record, sources)
  assert.deepEqual(result.map(source=>source.id), ['a','c','d'])
  assert.equal(result[0].href, sources.a[1])
  assert.equal(result[0].label, '古希臘')
  assert.equal(JSON.stringify({ record, sources }), original)
})
