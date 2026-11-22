import { parseDialogueScript } from './dialogueCues.js'

export const CATEGORY_DIALOGUE_FILES = Object.freeze({
  movies:'movies.md',games:'games.md',anime:'anime.md',novels:'literature.md',
  'performing-arts':'performing-arts.md',music:'music.md',
})
const uncomment = source => source.replace(/<!--[\s\S]*?-->/g,'')
export function parseOpeningMarkdown(source) {
  const body=uncomment(source.replace(/\r\n?/g,'\n')).trim().replace(/^#\s+[^\n]*(?:\n|$)/,'').trim()
  return parseDialogueScript(body,{allowEmpty:true})
}
export function parseWorkDialogueMarkdown(source) {
  const sections=source.replace(/\r\n?/g,'\n').replace(/<!--(?!\s*workId:)[\s\S]*?-->/g,'').split(/(?=^##[ \t]+.+$)/m)
  return sections.flatMap(section=>{
    const heading=section.match(/^##[ \t]+(.+)$/m)
    if(!heading)return []
    const markers=[...section.matchAll(/<!--\s*workId:\s*([^\s<>]+)\s*-->/g)]
    const title=heading[1].trim()
    if(markers.length!==1)return [{title,workId:null,error:'Each work section needs exactly one workId comment'}]
    const workId=markers[0][1]
    const body=uncomment(section.replace(/^##[ \t]+[^\n]*(?:\n|$)/,'')).trim()
    try {return [{title,workId,dialogue:parseDialogueScript(body,{allowEmpty:true})}]}
    catch(error){return [{title,workId,error:error.message}]}
  })
}

// Authoring mistakes are isolated to their own section. Never use another
// work's dialogue (or the opening) as a fallback for an empty/invalid section.
export function buildDialogueCatalog(files,categories,works,poseLimits={}) {
  const byWorkId=Object.fromEntries(Object.keys(works).map(id=>[id,[]]))
  const diagnostics=[],blocks={}
  const report=(file,workId,message)=>diagnostics.push({file,workId,message})
  const validate=lines=>{
    for(const line of lines) {
      const spec=poseLimits[line.speaker]
      if(spec && (line.body>spec.body.poses.length || line.face>spec.face.count))throw new Error(`Invalid ${line.speaker} body/face: ${line.body}/${line.face}`)
    }
    return lines
  }
  let opening=[]
  if(files['opening.md']===undefined)report('opening.md',null,'Missing opening file')
  else try {opening=validate(parseOpeningMarkdown(files['opening.md']))}catch(error){report('opening.md',null,error.message)}
  for(const category of categories) {
    const file=CATEGORY_DIALOGUE_FILES[category.id],source=files[file]
    if(source===undefined){report(file,null,'Missing category file');blocks[category.id]=[];continue}
    const sections=parseWorkDialogueMarkdown(source),seen=new Set()
    blocks[category.id]=sections
    for(const section of sections) {
      const id=section.workId
      if(!id){report(file,null,section.error);continue}
      if(!category.works.includes(id) || !works[id]){report(file,id,'workId is not in this category');continue}
      if(seen.has(id)) {byWorkId[id]=[];report(file,id,'Duplicate workId');continue}
      seen.add(id)
      if(section.error){report(file,id,section.error);continue}
      try {byWorkId[id]=validate(section.dialogue)}catch(error){report(file,id,error.message)}
    }
    for(const id of category.works)if(!seen.has(id))report(file,id,'Missing work section')
  }
  return {opening,byWorkId,blocks,diagnostics}
}
