export function createDialogueSession() {
  return {kind:'opening',workId:null,line:0,revision:0,done:false}
}
export function dialogueSessionReducer(state,event) {
  if(event.type==='work')return {kind:'work',workId:event.workId,line:0,revision:state.revision+1,done:false}
  if(event.type==='clear')return {kind:null,workId:null,line:0,revision:state.revision+1,done:true}
  if(event.type==='advance') {
    if(state.done)return state
    if(state.line+1<event.length)return {...state,line:state.line+1}
    return {...state,done:true,revision:state.revision+1}
  }
  throw new Error(`Unknown dialogue action: ${event.type}`)
}
export function sessionDialogue(session,opening,works) {
  if(session.kind==='opening')return opening
  if(session.kind==='work')return works[session.workId]?.dialogue??[]
  return []
}
