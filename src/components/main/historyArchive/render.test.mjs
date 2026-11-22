import test from 'node:test'
import assert from 'node:assert/strict'
import { createServer } from 'vite'
import { renderToStaticMarkup } from 'react-dom/server'
import { createElement } from 'react'
import { referenceKey } from './references.js'

test('all 18 detail views render variable sections, citations, illustrations and navigation', async () => {
  const server = await createServer({ cacheDir: '/tmp/genesis-history-render-cache', server: { middlewareMode: true, hmr: false, ws: false }, appType: 'custom' })
  try {
    const { default: Observation } = await server.ssrLoadModule('/src/components/main/historyArchive/HistoryObservation.jsx')
    const { HISTORY_RECORDS: records } = await server.ssrLoadModule('/src/components/main/historyArchive/data.js')
    for (const [index, record] of records.entries()) {
      const markup = renderToStaticMarkup(createElement(Observation, {
        selection: { index, origin: {} }, items: records.map((_, itemIndex) => ({ x: records.length - itemIndex, width: 1 })),
        size: { width: 1280, height: 800 }, closing: false,
        originFor: () => ({}), onChange() {}, onClose() {}, onClosed() {},
      }))
      assert.equal((markup.match(/class="hh-research-section(?: hh-note)?"/g) || []).length, record.sections.length)
      assert.ok(markup.includes(`<p class="hh-region">${record.region}</p>`))
      assert.ok(markup.includes(`<h3 id="hh-detail-title">${record.name}</h3>`))
      assert.ok(markup.includes(`<p class="hh-date">${record.date}</p>`))
      for (const paragraph of record.introduction) assert.ok(markup.includes(`<p class="hh-summary">${paragraph}</p>`))
      assert.equal((markup.match(/class="hh-summary"/g)||[]).length,record.introduction.length)
      for (const section of record.sections) {
        assert.ok(markup.includes(`<h4>${section.title}</h4>`))
        for (const paragraph of section.paragraphs) assert.ok(markup.includes(paragraph))
      }
      assert.equal((markup.match(/class="hh-explanation"/g)||[]).length,record.sections.flatMap(section=>section.paragraphs).length)
      assert.equal((markup.match(/class="hh-research-section hh-note"/g)||[]).length,record.sections.filter(section=>section.special).length)
      assert.ok(markup.includes('<summary>參考資料 · Wikipedia ↗\uFE0E</summary>'))
      assert.ok(markup.includes(record.sourceNote))
      const expectedLinks=[]
      const seen=new Set()
      for (const source of record.wikipediaReferences) {
        const key=referenceKey(source.href)
        if (!seen.has(key)) {
          seen.add(key)
          expectedLinks.push(source.href)
        }
      }
      for (const block of record.references) {
        for (const [url] of block.matchAll(/https?:\/\/[^\s]+/g)) {
          const href=url.replace(/[.,!?，。；！？]+$/,'')
          const key=referenceKey(href)
          if (!seen.has(key)) {
            seen.add(key)
            expectedLinks.push(href)
          }
        }
      }
      const actualLinks=[...markup.matchAll(/<a [^>]*href="([^"]+)"/g)].map(([,href])=>href.replace(/&amp;/g,'&'))
      assert.deepEqual(actualLinks,expectedLinks,`reference links for ${record.id}`)
      assert.ok(!markup.includes(`<h3 id="hh-detail-title">${index + 2}. ${record.name}</h3>`))
      assert.ok(markup.includes('時代意象插畫'))
      assert.ok(markup.includes('人物旁時代切換'))
      assert.ok(markup.includes('切換觀察時代'))
      assert.ok(markup.includes(`${index + 1} / 18`))
      assert.ok(markup.includes('參考資料 · Wikipedia ↗'))
    }
  } finally { await server.close() }
})
