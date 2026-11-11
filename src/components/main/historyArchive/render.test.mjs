import test from 'node:test'
import assert from 'node:assert/strict'
import { createServer } from 'vite'
import { renderToStaticMarkup } from 'react-dom/server'
import { createElement } from 'react'

test('all 18 detail views render variable sections, citations, illustrations and navigation', async () => {
  const server = await createServer({ cacheDir: '/tmp/genesis-history-render-cache', server: { middlewareMode: true, hmr: false, ws: false }, appType: 'custom' })
  try {
    const { default: Observation } = await server.ssrLoadModule('/src/components/main/historyArchive/HistoryObservation.jsx')
    const { HISTORY_RECORDS: records, HISTORY_SOURCES: sources } = await server.ssrLoadModule('/src/components/main/historyArchive/data.js')
    for (const [index, record] of records.entries()) {
      const markup = renderToStaticMarkup(createElement(Observation, {
        selection: { index, origin: {} }, items: records.map((_, itemIndex) => ({ x: records.length - itemIndex, width: 1 })),
        size: { width: 1280, height: 800 }, closing: false,
        originFor: () => ({}), onChange() {}, onClose() {}, onClosed() {},
      }))
      assert.equal((markup.match(/class="hh-research-section"/g) || []).length, record.sections.length)
      for (const section of record.sections) {
        assert.ok(markup.includes(section.title))
        for (const paragraph of section.paragraphs) assert.ok(markup.includes(paragraph))
        for (const id of section.sources) assert.ok(markup.includes(sources[id][1]))
      }
      assert.equal((markup.match(/class="hh-explanation"/g)||[]).length,record.sections.flatMap(section=>section.paragraphs).length)
      assert.ok(!markup.includes('hh-section-sources'))
      const referencesStart = markup.indexOf('<details class="hh-sources"')
      assert.ok(referencesStart > markup.lastIndexOf('</section>'))
      assert.equal((markup.slice(0,referencesStart).match(/<a /g)||[]).length,0)
      assert.equal((markup.slice(referencesStart).match(/<a /g)||[]).length,record.references.length)
      assert.equal(new Set(record.references.map(source=>source.href)).size,record.references.length)
      for (const source of record.references) {
        assert.equal(markup.split(`href="${source.href}"`).length-1,1)
      }
      assert.ok(markup.includes('時代意象插畫'))
      assert.ok(markup.includes('人物旁時代切換'))
      assert.ok(markup.includes('切換觀察時代'))
      assert.ok(markup.includes(`${index + 1} / 18`))
      assert.ok(markup.includes('參考資料 · Wikipedia'))
    }
  } finally { await server.close() }
})
