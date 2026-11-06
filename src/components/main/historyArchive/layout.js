// Normalize visible heights and space opaque silhouettes, rather than PNG boxes.
export function makeStripLayout(placements, scale = .28) {
  const visibleHeight = 1060 * scale, baseline = visibleHeight + 47
  const gap=visibleHeight*.32, margin=visibleHeight*.22
  const items=placements.map(item=>{
    const [,top,,bottom]=item.bounds
    const height=visibleHeight*2984/(bottom-top),width=height*2109/2984
    return {id:item.id,x:0,y:baseline-bottom/2984*height,width,height}
  })
  let cursor=margin
  for(let index=items.length-1;index>=0;index--){
    const item=items[index],[left,,right]=placements[index].bounds
    item.x=cursor-left/2109*item.width
    cursor+=(right-left)/2109*item.width+gap
  }
  return {scale,visibleHeight,baseline,gap,
    width:Math.max(cursor-gap+margin,...items.map(item=>item.x+item.width+24)),
    height:baseline+70,items}
}
export { opaqueAt as maskHit } from '../../../dev/history/interactionMath.js'
export function nearestRecord(items, center) {
  let best = 0, distance = Infinity
  items.forEach((item, index) => { const next = Math.abs(item.x + item.width / 2 - center); if (next < distance) { best = index; distance = next } })
  return best
}
