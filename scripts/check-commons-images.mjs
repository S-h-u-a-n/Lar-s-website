// Usage: node scripts/check-commons-images.mjs http://127.0.0.1:4186/Lar-s-website/
// With no URL, checks the local files only. A URL also checks served bytes and MIME.
import { readFileSync } from 'node:fs'
import { createHash } from 'node:crypto'
import assert from 'node:assert/strict'
import { photoUrl } from '../src/components/research/photoUrl.js'

const root = new URL('../', import.meta.url)
const { images } = JSON.parse(readFileSync(new URL('docs/ResearchImageLicenses.json', root)))
const origin = process.argv[2] ? new URL(process.argv[2]) : null
for (const image of images) {
  const local = readFileSync(new URL(`public${image.file}`, root))
  assert.equal(local.length, image.bytes, image.file)
  assert.equal(createHash('sha256').update(local).digest('hex'), image.assetSha256, image.file)
  if (origin) {
    const url = new URL(photoUrl(image.file, origin.pathname), origin)
    const response = await fetch(url)
    assert.equal(response.status, 200, `${url}: HTTP status`)
    assert.match(response.headers.get('content-type') ?? '', /^image\//, `${url}: MIME type`)
    const served = Buffer.from(await response.arrayBuffer())
    assert.equal(createHash('sha256').update(served).digest('hex'), image.assetSha256, `${url}: served content`)
  }
}
console.log(`${images.length}/${images.length} Commons images verified${origin ? ` at ${origin}` : ' locally'}.`)
