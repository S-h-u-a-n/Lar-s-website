import assert from 'node:assert/strict'
import { readFileSync, existsSync, statSync } from 'node:fs'
import { test } from 'node:test'

test('every body and the scale diagram have a local image and verified attribution', () => {
  const photos = JSON.parse(readFileSync(new URL('./solarPhotos.json', import.meta.url)))
  const bodies = ['earth', 'moon', 'sun', 'mercury', 'venus', 'mars', 'jupiter', 'saturn', 'uranus', 'neptune', 'pluto', 'solar-system']
  assert.deepEqual(Object.keys(photos).sort(), bodies.sort())
  for (const [id, photo] of Object.entries(photos)) {
    const path = new URL(`../../../public${photo.image}`, import.meta.url)
    assert.ok(existsSync(path), id)
    assert.ok(statSync(path).size > 10000, id)
    for (const key of ['title', 'author', 'license', 'sourceUrl', 'licenseUrl', 'modifications']) assert.ok(photo.photoCredit[key], `${id}: ${key}`)
    const signature = readFileSync(path).subarray(0, 3).toString('hex')
    assert.ok(['ffd8ff', '89504e'].includes(signature), `${id}: browser-supported image`)
  }
})

test('introduction is claimed once per page load and resets on reload', async () => {
  const page = await import('./solarIntroduction.js?first-page')
  assert.equal(page.claimSolarIntroduction(), true)
  assert.equal(page.claimSolarIntroduction(), false)
  const revisit = await import('./solarIntroduction.js?first-page')
  assert.equal(revisit.claimSolarIntroduction(), false)
  const reload = await import('./solarIntroduction.js?reloaded-page')
  assert.equal(reload.claimSolarIntroduction(), true)
})
