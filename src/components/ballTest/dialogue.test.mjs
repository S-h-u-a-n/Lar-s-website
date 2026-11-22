import test from 'node:test'
import assert from 'node:assert/strict'
import { createServer } from 'vite'
import { parseOpeningMarkdown } from './dialogueMarkdown.js'

test('all category Markdown files match the complete catalogue in order', async () => {
  const server = await createServer({
    cacheDir: '/tmp/genesis-ball-dialogue-test-cache',
    server: { middlewareMode: true, hmr: false, ws: false },
    appType: 'custom',
  })

  try {
    const { CATEGORIES, DIALOGUE_MARKDOWN, DIALOGUE_CATALOG, OPENING_DIALOGUE, WORKS } = await server.ssrLoadModule('/src/components/ballTest/data.js')
    assert.equal(Object.keys(DIALOGUE_MARKDOWN).length, 7)
    assert.deepEqual(DIALOGUE_CATALOG.diagnostics, [])
    assert.deepEqual(CATEGORIES.map(c => c.works.length), [3,3,3,3,3,6])
    assert.equal(Object.keys(WORKS).length, 21)
    for (const category of CATEGORIES) {
      const blocks = DIALOGUE_CATALOG.blocks[category.id]
      assert.deepEqual(blocks.map(b => b.workId), category.works)
      assert.deepEqual(blocks.map(b => b.title), category.works.map(id => WORKS[id].name))
      for (const id of category.works) assert.deepEqual(WORKS[id].dialogue, [])
    }
    assert.deepEqual(OPENING_DIALOGUE, parseOpeningMarkdown(DIALOGUE_MARKDOWN['opening.md']))
  } finally {
    await server.close()
  }
})
