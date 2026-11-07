import assert from 'node:assert/strict'
import { test } from 'node:test'
import { readFileSync, readdirSync } from 'node:fs'
import { createHash } from 'node:crypto'

const root = new URL('../../../', import.meta.url)
const manifest = JSON.parse(readFileSync(new URL('commonsPhotos.json', import.meta.url)))
const audit = JSON.parse(readFileSync(new URL('docs/ResearchImageLicenses.json', root))).images
const find = (page, id) => audit.find(item => item.page === page && item.topicId === id)

test('every displayed photo has a matching verified Commons credit and intact local asset', () => {
  const paths = new Set()
  for (const [page, topics] of Object.entries(manifest)) for (const [id, photo] of Object.entries(topics)) {
    const evidence = find(page, id)
    assert.ok(evidence, `${page}/${id}`)
    assert.deepEqual(photo.photoCredit, Object.fromEntries(Object.keys(photo.photoCredit).map(key => [key, evidence[key]])))
    assert.equal(new URL(photo.photoCredit.sourceUrl).hostname, 'commons.wikimedia.org')
    assert.match(new URL(photo.photoCredit.sourceUrl).pathname, /^\/wiki\/File:/)
    assert.match(photo.photoCredit.license, /^(CC0 1\.0|CC BY(?:-SA)? (?:2\.0|2\.5|3\.0|4\.0)|Public domain)$/)
    assert.ok(photo.photoCredit.author && photo.photoCredit.modifications && photo.photoCredit.verifiedAt)
    assert.ok(evidence.sourcePageRevision && evidence.sourcePageSha256)
    assert.ok(['creativecommons.org', 'commons.wikimedia.org'].includes(new URL(photo.photoCredit.licenseUrl).hostname))
    assert.match(photo.image, /^\/research-photos\/[a-z0-9-]+\.(jpg|png|webp)$/)
    assert.match(photo.imageAlt, /\p{Script=Han}/u)
    assert.ok(photo.photoCredit.width > 0 && photo.photoCredit.height > 0)
    assert.ok(!paths.has(photo.image), photo.image)
    paths.add(photo.image)
    const asset = readFileSync(new URL(`public${photo.image}`, root))
    assert.equal(createHash('sha256').update(asset).digest('hex'), evidence.assetSha256)
    assert.equal(asset.length, evidence.bytes)
  }
  assert.equal(paths.size, audit.length)
  assert.equal(paths.size, readdirSync(new URL('public/research-photos/', root)).length)
})

test('abstract subjects and special content retain their unassigned photo state', () => {
  assert.equal(Object.keys(manifest.natural).length, 35)
  assert.equal(Object.keys(manifest.human).length, 30)
  assert.equal(manifest.natural['origin-of-life'], undefined)
  for (const id of ['economic-systems', 'language-families', 'timeline', 'books', 'conversation']) assert.equal(manifest.human[id], undefined)
})
