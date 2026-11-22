import assert from 'node:assert/strict'
import { test } from 'node:test'
import { readFileSync, readdirSync } from 'node:fs'
import { createHash } from 'node:crypto'
import { photoUrl } from './photoUrl.js'

const root = new URL('../../../', import.meta.url)
const manifest = JSON.parse(readFileSync(new URL('commonsPhotos.json', import.meta.url)))
const solar = JSON.parse(readFileSync(new URL('../globeTest/solarPhotos.json', import.meta.url)))
const audit = JSON.parse(readFileSync(new URL('docs/ResearchImageLicenses.json', root))).images

test('all current Commons photos match their credit, audit, and unique local asset', () => {
  const paths = new Set(), hashes = new Set()
  for (const [page, topics] of Object.entries({ ...manifest, solar })) for (const [id, photo] of Object.entries(topics)) {
    if (photo.photoCredit.attribution) continue
    const evidence = audit.find(item => item.page === page && item.topicId === id)
    assert.ok(evidence, `${page}/${id}`)
    assert.deepEqual(photo.photoCredit, Object.fromEntries(Object.keys(photo.photoCredit).map(key => [key, evidence[key]])))
    assert.equal(new URL(photo.photoCredit.sourceUrl).hostname, 'commons.wikimedia.org')
    for (const key of ['title', 'author', 'license', 'licenseUrl', 'modifications', 'verifiedAt']) assert.ok(photo.photoCredit[key], `${id}: ${key}`)
    assert.ok(evidence.sourcePageRevision && evidence.sourceMetadata)
    assert.match(photo.image, new RegExp(`^/images/${page}/[a-z0-9-]+\\.(jpg|png|gif|webp)$`))
    assert.ok(photo.photoCredit.width > 0 && photo.photoCredit.height > 0)
    assert.ok(!paths.has(photo.image), photo.image)
    paths.add(photo.image)
    const asset = readFileSync(new URL(`public${photo.image}`, root))
    const hash = createHash('sha256').update(asset).digest('hex')
    assert.equal(hash, evidence.assetSha256)
    assert.equal(asset.length, evidence.bytes)
    assert.ok(!hashes.has(hash), `${id}: duplicate asset`)
    hashes.add(hash)
  }
  assert.equal(paths.size, 81)
  assert.equal(paths.size, audit.length)
  for (const page of ['natural', 'human', 'solar']) assert.equal(
    readdirSync(new URL(`public/images/${page}/`, root)).length,
    audit.filter(item => item.page === page).length,
  )
})

test('image paths work at the domain root and a GitHub Pages repository base', () => {
  for (const base of ['/', '/Lar-s-website/', '/another-repository/']) {
    for (const item of audit) assert.equal(photoUrl(item.file, base), `${base}${item.file.slice(1)}`)
  }
  for (const source of ['/research-photos/human-food-culture-original.JPG', '/assets/original.png', 'https://example.com/image.jpg', undefined]) assert.equal(photoUrl(source, '/Lar-s-website/'), source)
})

test('the original photograph and animated Commons asset are preserved', () => {
  const original = manifest.human['food-culture']
  assert.equal(original.image, '/research-photos/human-food-culture-original.JPG')
  assert.equal(original.photoCredit.attribution, '攝影：REMOANPU © 2026')
  assert.ok(readFileSync(new URL(`public${original.image}`, root)).length)
  const animation = manifest.human['film-animation']
  assert.equal(readFileSync(new URL(`public${animation.image}`, root)).subarray(0, 3).toString(), 'GIF')
})
