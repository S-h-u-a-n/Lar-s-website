import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'

test('多萊絲 profile matches its portrait filename', async () => {
  const profiles = JSON.parse(await readFile(new URL('./characterProfiles.json', import.meta.url), 'utf8'))
  const portrait = new URL('../../../Art/avatar/多萊絲.jpg', import.meta.url)
  const id = decodeURIComponent(portrait.pathname.split('/').at(-1)).replace(/\.[^.]+$/, '')

  assert.equal(id, '多萊絲')
  assert.equal(profiles[id].name, id)
  assert.ok(profiles[id].biography.includes('靈魂'))
  assert.ok((await readFile(portrait)).length > 0)
})
