import test from 'node:test'
import assert from 'node:assert/strict'
import { buildDialogueCatalog, parseOpeningMarkdown, parseWorkDialogueMarkdown } from './dialogueMarkdown.js'
import { createDialogueSession, dialogueSessionReducer, sessionDialogue } from './dialogueSession.js'
import { dialoguePortraits } from './dialogueCues.js'

test('quotes, multiline text, repeated speakers and optional transition numbers', () => {
  const lines = parseOpeningMarkdown('# 開場\r\n<!-- 說明 -->\r\n拉爾（6/52）\r\n「第一行\r\n第二行」\r\n拉爾（6/52/4）\r\n「下一句」\r\n拉爾（6/52/4）\r\n「再一句」')
  assert.equal(lines[0].text,'「第一行\n第二行」')
  assert.deepEqual(lines.map(l => l.transition),[0,4,4])
  assert.equal(dialoguePortraits(lines,1).lar.cueIndex,1)
  assert.equal(dialoguePortraits(lines,2).lar.cueIndex,2)
})
const categories = [{id:'movies',works:['a','b']}]
const works = {a:{dialogue:[]},b:{dialogue:[]}}
const section = (id,text='') => `## 可修改的名稱\n<!-- workId: ${id} -->\n${text}\n`
const cue = '拉爾（1/1/3）\n「測試」'
const catalog = source => buildDialogueCatalog({'opening.md':'# 開場','movies.md':source},categories,works)

test('stable ID mapping, empty placeholders and comments never become dialogue', () => {
  const result = catalog(`<!--\n## 範例\n-->\n${section('a',cue)}${section('b','<!-- 待填 -->\n緹芙波（3/34）\n「」')}`)
  assert.deepEqual(result.diagnostics,[])
  assert.equal(result.byWorkId.a[0].transition,3)
  assert.deepEqual(result.byWorkId.b,[])
  assert.deepEqual(parseOpeningMarkdown('# 開場\n<!-- 待填 -->'),[])
  assert.deepEqual(parseWorkDialogueMarkdown(section('a','拉爾（1/1）'))[0].dialogue,[])
})

test('invalid, duplicate, missing and wrong-category sections cannot mix works', () => {
  for(const source of [section('a','拉爾（1/1/9）\n「錯誤」'),section('a',cue)+section('a',cue),section('foreign',cue)]) {
    const result = catalog(source+section('b',cue))
    assert.deepEqual(result.byWorkId.a,[])
    assert.equal(result.byWorkId.b.length,1)
    assert.ok(result.diagnostics.length)
  }
  const result = buildDialogueCatalog({'opening.md':cue,'movies.md':section('a','拉爾（99/1）\n「錯誤」')+section('b',cue)},categories,works,{lar:{body:{poses:[1]},face:{count:1}}})
  assert.deepEqual(result.byWorkId.a,[])
  assert.equal(result.byWorkId.b.length,1)
  assert.match(result.diagnostics[0].message,/Invalid/)
})

test('switches cancel old sessions and empty works never fall back to opening', () => {
  const opening = parseOpeningMarkdown('# 開場\n'+cue)
  const data = {a:{dialogue:opening},b:{dialogue:[]}}
  let state = createDialogueSession()
  assert.equal(sessionDialogue(state,opening,data),opening)
  state = dialogueSessionReducer(state,{type:'work',workId:'a'})
  const revision = state.revision
  state = dialogueSessionReducer(state,{type:'work',workId:'a'})
  assert.ok(state.revision>revision)
  assert.equal(state.line,0)
  state = dialogueSessionReducer(state,{type:'work',workId:'b'})
  assert.deepEqual(sessionDialogue(state,opening,data),[])
  state = dialogueSessionReducer(state,{type:'clear'})
  assert.deepEqual(sessionDialogue(state,opening,data),[])
  state = dialogueSessionReducer(state,{type:'work',workId:'a'})
  state = dialogueSessionReducer(state,{type:'advance',length:2})
  assert.equal(state.line,1)
  assert.equal(state.done,false)
  state = dialogueSessionReducer(state,{type:'advance',length:2})
  assert.equal(state.done,true)
})
