import {VERSION,restore,isSolved,createPuzzle} from './engine.js'
export const keyFor=(art,target)=>`genesis:puzzle:v${VERSION}:${art.id}:${art.version}:${target}`
const completionKey=art=>`genesis:puzzle:unlocked:${art.id}:${art.version}`
const avatarCoverKey='genesis:puzzle:avatar-cover'
export function lastDifficulty(art){try{const n=Number(localStorage.getItem(`genesis:puzzle:last:${art.id}`));return [...art.difficulties,...(art.legacyDifficulties||[])].includes(n)?n:art.difficulties[0]}catch{return art.difficulties[0]}}
export function rememberDifficulty(art,target){try{localStorage.setItem(`genesis:puzzle:last:${art.id}`,String(target))}catch{}}
export function loadProgress(art,target) {
  const model=createPuzzle(art.width,art.height,target)
  try{restore(model,JSON.parse(localStorage.getItem(keyFor(art,target))))}catch{}
  return model
}
export function saveProgress(art,target,model) {
  try{localStorage.setItem(keyFor(art,target),JSON.stringify({version:VERSION,cols:model.cols,rows:model.rows,positions:model.positions,order:model.order,layout:model.layout}));if(isSolved(model))localStorage.setItem(completionKey(art),'1');rememberDifficulty(art,target);window.dispatchEvent(new Event('genesis-puzzle-progress'));return true}catch{return false}
}
export function selectedAvatarCover(avatars){try{const id=localStorage.getItem(avatarCoverKey);return avatars.find(item=>item.id===id&&unlocked(item))||null}catch{return null}}
export function setAvatarCover(avatars,item){if(!avatars.includes(item)||!unlocked(item))return false;try{localStorage.setItem(avatarCoverKey,item.id);window.dispatchEvent(new Event('genesis-puzzle-progress'));return true}catch{return false}}
export function unlocked(art){if(art.items)return art.items.length>0&&art.items.every(unlocked);try{if(localStorage.getItem(completionKey(art))==='1')return true}catch{}return [...art.difficulties,...(art.legacyDifficulties||[])].some(target=>isSolved(loadProgress(art,target)))}
