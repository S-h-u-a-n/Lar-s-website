// node scripts/check-recommendation-posters.mjs [http://127.0.0.1:4186/Lar-s-website/]
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { createHash } from 'node:crypto'
import { photoUrl } from '../src/components/research/photoUrl.js'
const root = new URL('../', import.meta.url)
const sources = Object.values(JSON.parse(readFileSync(new URL('src/components/ballTest/posterSources.json',root))))
const origin = process.argv[2] ? new URL(process.argv[2]) : null
for (const source of sources) {
  const bytes = readFileSync(new URL(`public${source.localPath}`,root))
  assert.equal(bytes.length,source.bytes,source.id)
  assert.equal(createHash('sha256').update(bytes).digest('hex'),source.assetSha256,source.id)
  if (origin) {
    const url = new URL(photoUrl(source.localPath,origin.pathname),origin)
    const response = await fetch(url)
    assert.equal(response.status,200,`${source.id}: status`)
    assert.match(response.headers.get('content-type') ?? '',/^image\//,`${source.id}: MIME`)
    assert.equal(createHash('sha256').update(Buffer.from(await response.arrayBuffer())).digest('hex'),source.assetSha256,`${source.id}: served bytes`)
  }
}
console.log(`${sources.length}/${sources.length} posters verified${origin ? ` at ${origin}` : ' locally'}.`)
