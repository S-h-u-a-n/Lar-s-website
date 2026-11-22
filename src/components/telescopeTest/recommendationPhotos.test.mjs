import assert from 'node:assert/strict'
import { readFileSync, readdirSync } from 'node:fs'
import { createHash } from 'node:crypto'
import { test, after } from 'node:test'
import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { createServer } from 'vite'
import { parseRecommendations } from './recommendationsParser.js'
import { photoUrl } from '../research/photoUrl.js'

const root = new URL('../../../', import.meta.url)
const read = path => readFileSync(new URL(path, root), 'utf8')
const places = parseRecommendations(read('content/telescope/recommendations.md'))
const photos = JSON.parse(read('src/components/telescopeTest/recommendationPhotos.json'))
const audit = JSON.parse(read('docs/TelescopeRecommendationImageLicenses.json')).images
const expected = {
  ral:'Svalbard_Global_Seed_Vault_Exterior_2020.jpg', il:'26065891',
  ost:'British_Museum_at_night_2024-12-20.jpg', yuta:'34571466', reed:'39195537',
  anpu:'木雕阿努比斯像.jpg', harriet:'American_Airlines_Center_(6246886325)_cropped.jpg',
  kane:'4228971', seth:'37687962', laike:'26381580', pato:'40692070',
  arena:'Glastonbury_tor_(the_final_climb)_arp_(cropped).jpg', dioscuri:'Pefnos_egg.jpg',
  farenai:'13228960', isis:'36623370',
}

test('all fifteen characters keep the exact selected source and a unique intact local photo', () => {
  assert.deepEqual(Object.keys(photos), places.map(place => place.id))
  const hashes = new Set()
  for (const place of places) {
    const photo = photos[place.id], record = audit.find(item => item.characterId === place.id)
    assert.equal(place.photoPath, photo.image)
    assert.match(photo.image, /^\/images\/telescope\/recommendations\/[a-z0-9-]+\.jpg$/)
    assert.deepEqual(photo.photoCredit, record.photoCredit)
    const source = decodeURIComponent(photo.photoCredit.sourceUrl).replaceAll(' ', '_')
    assert.ok(source.includes(expected[place.id]), place.id)
    const bytes = readFileSync(new URL(`public${photo.image}`, root))
    const hash = createHash('sha256').update(bytes).digest('hex')
    assert.equal(hash, record.assetSha256)
    assert.equal(bytes.length, record.bytes)
    assert.equal(bytes.subarray(0, 3).toString('hex'), 'ffd8ff')
    assert.ok(!hashes.has(hash), place.id)
    hashes.add(hash)
    const credit = photo.photoCredit
    for (const field of ['title','author','sourceUrl','license','licenseUrl','modifications','verifiedAt']) assert.ok(credit[field], `${place.id}: ${field}`)
    assert.ok(credit.width <= 1280 && credit.width > 0 && credit.height > 0)
    assert.ok(Math.abs(credit.height - credit.width * record.originalHeight / record.originalWidth) <= 1, `${place.id}: uncropped aspect ratio`)
    for (const base of ['/', '/Lar-s-website/']) assert.equal(photoUrl(photo.image, base), base + photo.image.slice(1))
    if (record.provider === 'Pexels') {
      assert.equal(credit.license, 'Pexels License')
      assert.equal(credit.licenseUrl, 'https://www.pexels.com/license/')
      assert.ok(record.photographerUrl.startsWith('https://www.pexels.com/'))
    } else assert.ok(record.sourcePageRevision && record.sourceWikitext)
  }
  assert.equal(hashes.size, 15)
  assert.equal(readdirSync(new URL('public/images/telescope/recommendations/', root)).length, 15)
})

const server = await createServer({ server:{ middlewareMode:true, watch:null, hmr:false, ws:false }, appType:'custom' })
after(() => server.close())

test('each recommendation renders a base-aware photo, lazy loading, shared credit control and Anpu note', async () => {
  const { default: RecommendationPhoto } = await server.ssrLoadModule('/src/components/telescopeTest/RecommendationPhoto.jsx')
  for (const place of places) {
    const html = renderToStaticMarkup(createElement(RecommendationPhoto, { place }))
    assert.ok(html.includes(`src="/Lar-s-website${place.photoPath}"`), place.id)
    assert.ok(html.includes('loading="lazy"') && html.includes('decoding="async"'), place.id)
    assert.ok(html.includes('class="research-photo-info"') && html.includes('aria-haspopup="dialog"'), place.id)
    assert.equal(html.includes('tt-recommendation-photo-note'), place.id === 'anpu')
  }
  assert.ok(photos.anpu.note.includes('並非埃爾凱斯遺址實景'))
  assert.ok(photos.anpu.imageAlt.includes('阿努比斯'))
})
