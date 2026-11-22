// Optional argument: a running development or preview URL, including its Vite base.
// Example: node scripts/check-telescope-recommendation-photos.mjs http://127.0.0.1:4186/Lar-s-website/
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { createHash } from 'node:crypto'
import { photoUrl } from '../src/components/research/photoUrl.js'

const root = new URL('../', import.meta.url)
const { images } = JSON.parse(readFileSync(new URL('docs/TelescopeRecommendationImageLicenses.json', root)))
const origin = process.argv[2] ? new URL(process.argv[2]) : null
for (const image of images) {
  const bytes = readFileSync(new URL(`public${image.image}`, root))
  assert.equal(bytes.length, image.bytes, image.characterId)
  assert.equal(createHash('sha256').update(bytes).digest('hex'), image.assetSha256, image.characterId)
  if (origin) {
    const url = new URL(photoUrl(image.image, origin.pathname), origin)
    const response = await fetch(url)
    assert.equal(response.status, 200, `${url}: HTTP`)
    assert.match(response.headers.get('content-type') ?? '', /^image\//, `${url}: MIME`)
    assert.equal(createHash('sha256').update(Buffer.from(await response.arrayBuffer())).digest('hex'), image.assetSha256, `${url}: bytes`)
  }
}
console.log(`${images.length}/${images.length} recommendation photos verified${origin ? ` at ${origin}` : ' locally'}.`)
