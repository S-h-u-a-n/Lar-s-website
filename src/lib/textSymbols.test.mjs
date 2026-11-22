import test from 'node:test'
import assert from 'node:assert/strict'
import { textSymbolLabel } from './textSymbols.js'

test('audited UI arrows and ornaments get exactly one text selector', () => {
  const label = '↔ ↗ ↙ ◀ ▶ ☑ ✉ ✳'
  const result = textSymbolLabel(label)
  assert.equal(result.match(/\uFE0E/gu).length,8)
  assert.equal(result.replaceAll('\uFE0E',''),label)
  assert.equal(textSymbolLabel(result),result)
})

test('explicit emoji, content emoji and unsupported text variation sequences remain unchanged', () => {
  const content = '✉\uFE0F ☑\uFE0F ↗\uFE0F ❤️ 🎉 😊 ♥ ✦ ✧ ★ ☆ ← ↑ → ↓ ☐'
  assert.equal(textSymbolLabel(content),content)
  assert.equal(textSymbolLabel(''), '')
})
