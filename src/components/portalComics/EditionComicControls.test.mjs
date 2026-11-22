import test from 'node:test'
import assert from 'node:assert/strict'
import { createServer } from 'vite'
import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'

test('shared comic controls preserve the telescope order and accept page-specific start labels', async () => {
  const server = await createServer({
    cacheDir: '/tmp/genesis-edition-comic-controls-test',
    server: { middlewareMode: true, hmr: false, ws: false },
    appType: 'custom',
  })
  try {
    const { default: Controls } = await server.ssrLoadModule('/src/components/portalComics/EditionComicControls.jsx')
    for (const [startLabel, title] of [['開始觀測', '望遠鏡的故事'], ['開始探索', 'OUR FAVORITES!']]) {
      const html = renderToStaticMarkup(createElement(Controls, {
        onBack() {},
        onStart() {},
        startLabel,
        title: createElement('h1', null, title),
      }))
      assert.ok(html.indexOf('回研究室') < html.indexOf(title))
      assert.ok(html.indexOf(title) < html.indexOf(startLabel))
      assert.match(html, /class="edition-comic-controls"/)
    }
  } finally {
    await server.close()
  }
})
