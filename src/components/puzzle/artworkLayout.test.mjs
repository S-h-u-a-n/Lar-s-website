import {test} from 'node:test'
import assert from 'node:assert/strict'
import {artworkLayout} from './artworkLayout.js'

test('artwork dimensions select compact, landscape, wide, and panoramic layouts',()=>{
  assert.equal(artworkLayout(2048,2048),'square')
  assert.equal(artworkLayout(5783,4088),'landscape')
  assert.equal(artworkLayout(8994,4048),'wide')
  assert.equal(artworkLayout(12524,2620),'panoramic')
})
