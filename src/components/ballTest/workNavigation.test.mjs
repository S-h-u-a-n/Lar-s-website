import test from 'node:test'
import assert from 'node:assert/strict'
import { createWorkNavigation, workNavigationReducer, visibleWorkEntries } from './workNavigation.js'
import { createDialogueSession, dialogueSessionReducer } from './dialogueSession.js'

const works = 'ABCDEF'.split('').map(id => ({id}))
const visible = state => visibleWorkEntries(works,state.start,3)
const names = state => visible(state).map(entry => entry.work.id).join('')
const step = (state,direction,length=works.length) => workNavigationReducer(state,{type:'step',direction,length})

test('each step preserves two occurrences and brings one new work from the correct end', () => {
  const first = createWorkNavigation(), second = step(first,1), third = step(second,1)
  assert.equal(names(first),'ABC')
  assert.equal(names(second),'BCD')
  assert.equal(names(third),'CDE')
  assert.deepEqual(visible(first).slice(1),visible(second).slice(0,2))
  assert.equal(names(step(second,-1)),'ABC')
  assert.equal(second.selectedIndex,1)
  assert.equal(second.direction,1)
  assert.equal(step(second,-1).direction,-1)
})

test('the existing circular boundary and occurrence identity work for three-item shelves too', () => {
  const initial = createWorkNavigation(), previous = step(initial,-1)
  assert.equal(names(previous),'FAB')
  assert.equal(previous.selectedIndex,5)
  const small = works.slice(0,3)
  const before = visibleWorkEntries(small,0,3), after = visibleWorkEntries(small,1,3)
  assert.equal(after.map(e => e.work.id).join(''),'BCA')
  assert.deepEqual(before.slice(1),after.slice(0,2))
  assert.notEqual(before[0].position,after[2].position)
  assert.deepEqual(visibleWorkEntries([],0,3),[])
  assert.equal(visibleWorkEntries(small.slice(0,1),-20,3).length,1)
})

test('rapid forward/reverse steps keep the selected work visible and reset only its dialogue', () => {
  let navigation = workNavigationReducer(createWorkNavigation(),{type:'select',index:2})
  let session = createDialogueSession()
  for(const direction of [1,1,1,-1,-1,1,-1,...Array(50).fill(1),...Array(50).fill(-1)]) {
    navigation = step(navigation,direction)
    const id = works[navigation.selectedIndex].id
    assert.ok(visible(navigation).some(e => e.work.id === id))
    const revision = session.revision
    session = dialogueSessionReducer(session,{type:'work',workId:id})
    assert.equal(session.workId,id)
    assert.equal(session.line,0)
    assert.equal(session.revision,revision+1)
  }
  navigation = workNavigationReducer(navigation,{type:'seek',index:5})
  assert.equal(names(navigation),'FAB')
  assert.equal(navigation.selectedIndex,5)
  assert.deepEqual(workNavigationReducer(navigation,{type:'reset'}),createWorkNavigation())
})
