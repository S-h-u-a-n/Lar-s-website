import assert from 'node:assert/strict'
import { after, test } from 'node:test'
import { readFileSync, existsSync, readdirSync } from 'node:fs'
import { createHash } from 'node:crypto'
import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { createServer } from 'vite'

const root = new URL('../../../', import.meta.url)
const sources = JSON.parse(readFileSync(new URL('posterSources.json', import.meta.url)))
const expected = {
  movies:['the-big-short','the-parent-trap','deadpool'],
  games:['persona-3-reload','raging-loop','fate-grand-order'],
  anime:['hunter-x-hunter','witch-watch','monthly-girls-nozaki-kun'],
  novels:['old-poverty-chronicles','okay-for-now','all-tomorrows'],
  'performing-arts':['hamilton','come-from-away','next-to-normal'],
}
const server = await createServer({ plugins:[{name:'poster-test-static-text',enforce:'pre',transform(code,id){
  if (id.endsWith('/ballTest/Text.jsx')) return {code:`import { createElement } from 'react'; export default function Text({as='span',children}) { return createElement(as,null,children) }`,map:null}
}}], server:{middlewareMode:true,watch:null,hmr:false,ws:false},appType:'custom' })
after(() => server.close())
const { CATEGORIES, WORKS, WORK_MARKDOWN } = await server.ssrLoadModule('/src/components/ballTest/data.js')

test('six categories retain their order, five shelves contain only the selected three titles', () => {
  assert.deepEqual(CATEGORIES.map(category=>category.id),['movies','games','anime','novels','performing-arts','music'])
  assert.equal(CATEGORIES.find(category=>category.id==='novels').name,'文學')
  for (const [id, ids] of Object.entries(expected)) assert.deepEqual(CATEGORIES.find(category=>category.id===id).works,ids)
  const all = CATEGORIES.flatMap(category=>category.works)
  assert.equal(new Set(all).size,21)
  assert.deepEqual(Object.keys(WORKS).sort(),all.sort())
  assert.equal(Object.keys(sources).length,15)
  for (const path of ['Art/ball/poster/DEADPOOL/all.jpg','Art/ball/poster/persona3reload/all.jpg']) assert.ok(existsSync(new URL(path,root)))
  assert.equal(['movies','anime','literature','performing-arts','games'].reduce((n,category)=>n+readdirSync(new URL(`public/images/recommendations/${category}/`,root)).length,0),15)
  const music = CATEGORIES.find(category=>category.id==='music').works
  assert.deepEqual(music,['tattoo','sayonara-mata-itsuka','naizou-arimasuka','rubia','haru-wa-tokete','yuureigai-to-gyakusetsu'])
  for (const id of music) assert.ok(WORKS[id].spotifyEmbedUrl && WORK_MARKDOWN[WORKS[id].markdown])
})

test('existing prose and original artwork files stay intact; new works have no invented copy', () => {
  for (const id of Object.keys(sources)) {
    const work = WORKS[id]
    if (['deadpool','persona-3-reload'].includes(id)) {
      assert.ok(work.posterPreview && work.posterDetail)
      assert.ok(WORK_MARKDOWN[work.markdown].includes('© REMOANPU'))
    } else {
      assert.equal(work.summary,'')
      assert.deepEqual(work.description,[])
      assert.equal(work.recommendation,'')
      assert.deepEqual(work.dialogue,[])
      assert.equal(work.posterPreview,sources[id].localPath)
      assert.equal(work.posterDetail,sources[id].localPath)
    }
  }
})

test('all fifteen selected posters are unique intact local assets and retain the rights research', () => {
  const seen = new Set()
  for (const [id, source] of Object.entries(sources)) {
    assert.equal(source.id,id)
    assert.ok(!seen.has(source.requestedImageUrl));seen.add(source.requestedImageUrl)
    assert.equal(new URL(source.requestedImageUrl).protocol,'https:')
    assert.equal(source.permissionStatus,'pending-permission')
    assert.equal(source.integrationStatus,'local-integrated-by-user-request')
    assert.match(source.localPath,/^\/images\/recommendations\/(movies|anime|literature|performing-arts|games)\/[a-z0-9-]+\.(jpg|webp)$/)
    assert.equal(source.downloaded,true)
    const bytes = readFileSync(new URL(`public${source.localPath}`,root))
    assert.equal(bytes.length,source.bytes)
    assert.equal(createHash('sha256').update(bytes).digest('hex'),source.assetSha256)
    assert.ok(source.width <= source.downloadWidth && source.height <= source.downloadHeight)
    assert.ok(Math.abs(source.height - source.width * source.downloadHeight / source.downloadWidth) <= 1)
    assert.equal(WORKS[id].posterPreview,source.localPath)
    assert.equal(WORKS[id].posterDetail,source.localPath)
    assert.ok(source.transformations.length)
    assert.ok(!seen.has(source.assetSha256));seen.add(source.assetSha256)
    assert.equal(source.posterRightsHolder,'尚待確認')
    assert.ok(source.workRightsParties.length && source.permissionSummary && source.requiredAction)
    assert.ok(existsSync(new URL(`public${source.localPath}`,root)))
    assert.ok(source.workRightsParties.every(party=>party.name && party.role && new URL(party.sourceUrl).protocol==='https:'))
    if (source.bookCredits) {
      assert.ok(source.bookCredits.author && source.bookCredits.publisher)
      assert.equal(source.bookCredits.coverDesigner,'尚待確認')
      assert.equal(source.bookCredits.coverIllustrator,'尚待確認')
    }
  }
  assert.equal(new URL(sources['the-big-short'].requestedImageUrl).pathname,'/t/p/original/znvo8sEcGSHaZ9C59dqQLYf0YAC.jpg')
  assert.equal(new URL(sources['okay-for-now'].requestedImageUrl).hostname,'encrypted-tbn0.gstatic.com')
  assert.equal(new URL(sources['fate-grand-order'].requestedImageUrl).pathname,'/B/2KU/36/0001206836.JPG')
})

test('source details distinguish platform, work parties and unconfirmed cover rights', async () => {
  const { PosterSourceDetails, PosterCopyrightNotice, RIGHTS_CONTACT } = await server.ssrLoadModule('/src/components/ballTest/PosterCopyright.jsx')
  for (const source of Object.values(sources)) {
    const html = renderToStaticMarkup(createElement(PosterSourceDetails,{source}))
    for (const text of [source.workTitle,source.sourcePlatform,'指定海報／封面權利人','尚待確認']) assert.ok(html.includes(text),source.id)
    assert.ok(html.includes('原始指定圖片 ↗'))
    assert.ok(!html.includes('<img'))
    assert.ok(!html.includes('指定海報尚未上架'))
  }
  const html = renderToStaticMarkup(createElement(PosterCopyrightNotice))
  assert.ok(html.includes(`mailto:${RIGHTS_CONTACT}`))
  assert.ok(readFileSync(new URL('src/components/main/HomeAuthor.jsx',root),'utf8').includes(`mailto:${RIGHTS_CONTACT}`))
  assert.ok(html.includes('此聲明不替代素材使用授權'))
})

test('cards and details load every selected poster locally under the Vite base', async () => {
  const { Cover } = await server.ssrLoadModule('/src/components/ballTest/WorkSelector.jsx')
  const { default: WorkDialog } = await server.ssrLoadModule('/src/components/ballTest/WorkDialog.jsx')
  for (const id of Object.keys(sources)) {
    for (const mode of ['preview','hover','detail']) {
      const html = renderToStaticMarkup(createElement(Cover,{work:WORKS[id],mode}))
      assert.ok(!html.includes(sources[id].requestedImageUrl),id)
      assert.ok(html.includes(`src="/Lar-s-website${sources[id].localPath}"`),id)
      assert.ok(!html.includes('ball-cover-title'),id)
    }
    const html = renderToStaticMarkup(createElement(WorkDialog,{work:WORKS[id],onClose(){}}))
    assert.ok(html.includes('class="research-photo-info"'),id)
    assert.ok(!/<img[^>]+src="https:/.test(html),id)
    assert.ok(!html.includes('待補充'),id)
    assert.ok(html.includes(`src="/Lar-s-website${sources[id].localPath}"`),id)
  }
  const html = renderToStaticMarkup(createElement(Cover,{work:{name:'Local test',posterDetail:'/images/recommendations/movies/test.jpg'},mode:'detail'}))
  assert.ok(html.includes('src="/Lar-s-website/images/recommendations/movies/test.jpg"'))
})

test('all six shelves show original titles on closed covers and unobstructed artwork in details', async () => {
  const { Cover } = await server.ssrLoadModule('/src/components/ballTest/WorkSelector.jsx')
  assert.equal(WORKS['persona-3-reload'].originalTitle,'ペルソナ３ リロード')
  assert.equal(WORKS['raging-loop'].originalTitle,'レイジングループ')
  assert.equal(WORKS['witch-watch'].originalTitle,'ウィッチウォッチ')
  assert.equal(WORKS['monthly-girls-nozaki-kun'].originalTitle,'月刊少女野崎くん')
  for (const work of Object.values(WORKS)) {
    for (const mode of ['preview','hover']) {
      const html = renderToStaticMarkup(createElement(Cover,{work,mode}))
      assert.equal((html.match(/class="ball-cover-overlay"/g) || []).length,1,work.id)
      assert.ok(html.includes(`<strong>${work.originalTitle}</strong>`),work.id)
      assert.ok(!html.includes('ball-cover-song-copy'),work.id)
    }
    const detail = renderToStaticMarkup(createElement(Cover,{work,mode:'detail'}))
    assert.ok(!detail.includes('ball-cover-overlay'),work.id)
    if (work.posterDetail) assert.ok(detail.includes('ball-cover-image--detail'),work.id)
  }
})
