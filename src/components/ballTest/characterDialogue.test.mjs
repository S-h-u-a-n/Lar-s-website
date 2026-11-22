import test from 'node:test'
import assert from 'node:assert/strict'
import { createServer } from 'vite'
import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'

test('both speaker bubbles remain interactive and retain one shared dialogue callback', async () => {
  const server = await createServer({cacheDir:'/tmp/ball-bubbles-test',server:{middlewareMode:true,hmr:false,ws:false},appType:'custom'})
  try {
    const { default: Bubble, latestCharacterLines } = await server.ssrLoadModule('/src/components/ballTest/CharacterDialogue.jsx')
    const lines = [
      {speaker:'lar',text:'「第一句」'},
      {speaker:'tivbo',text:'「回答\n第二行」'},
      {speaker:'lar',text:'「更新」'},
      {speaker:'lar',text:'「更新」'},
    ]
    assert.deepEqual(Object.keys(latestCharacterLines(lines,0)),['lar'])
    const previous = latestCharacterLines(lines,1), current = latestCharacterLines(lines,2)
    assert.equal(current.tivbo.text,previous.tivbo.text)
    assert.equal(current.tivbo.cueIndex,1)
    assert.equal(current.lar.cueIndex,2)
    assert.equal(latestCharacterLines(lines,3).lar.cueIndex,3)
    assert.deepEqual(latestCharacterLines([],0),{})
    const nextWork = latestCharacterLines([{speaker:'tivbo',text:'新作品'}],0)
    assert.equal(nextWork.lar,undefined)
    const advance = () => {}
    for(const [id,side] of [['lar','right'],['tivbo','left']]) {
      const html = renderToStaticMarkup(createElement(Bubble,{character:{id,side,name:id},entry:current[id],active:id==='lar',action:'繼續對話',onAdvance:advance}))
      assert.ok(html.includes(`ball-character-dialogue-slot-${side}`))
      assert.ok(html.includes(`data-active="${id==='lar'}"`))
      assert.ok(!html.includes('disabled=""'))
      assert.ok(html.includes(current[id].text))
      assert.equal(html.includes('CLICK TO CONTINUE'),id==='lar')
      assert.ok(html.includes('點擊推進對話'))
    }
  } finally {await server.close()}
})
