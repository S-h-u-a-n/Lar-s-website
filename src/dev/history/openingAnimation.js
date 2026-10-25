import { entranceProgress } from './interactionMath.js'

export function openingSettings(asset, entrance) {
  const group=asset.id.startsWith('layer')?'layer':asset.id.startsWith('map')?'map':'people'
  const base=entrance[group]
  return {...base,delay:base.delay+(group==='layer'?(Number(asset.id.split('-')[1])-1)*(base.stagger||0):0),group}
}
export function openingKeyframes(settings, distance) {
  return Array.from({length:61},(_,i)=>{
    const p=entranceProgress(settings.delay+settings.duration*i/60,settings)
    return {offset:i/60,opacity:settings.group==='layer'?p.progress*p.progress*(3-2*p.progress):p.opacity,
      ...(settings.group==='layer'?{}:{transform:`translateY(${p.offset*distance}px)`})}
  })
}
// Preparing one decoded actor per rendered frame avoids submitting all filter /
// raster surfaces on the first moving frame. This is real, nearly transparent
// painting at the final location, not a timeout or a resource retry.
export function warmOpeningActor(node, group) {
  node.style.visibility='visible'
  node.style.transform='none'
  node.style.opacity='0.001'
  node.style.willChange=group==='layer'?'opacity':'transform, opacity'
}
export function startOpeningActor(node, settings, distance, startTime, onFinish) {
  const animation=node.animate(openingKeyframes(settings,distance),{
    duration:settings.duration,delay:settings.delay,fill:'both',easing:'linear',
  })
  animation.startTime=startTime
  node.style.opacity='1';node.style.transform='none'
  animation.finished.then(()=>{
    // Keep the prepared surface while it is visible. Demoting a finished map
    // midway through the people's entrance forces expensive repaint/compositing.
    // The owner releases it offscreen or synchronously on unmount.
    onFinish()
  }).catch(()=>{})
  return animation
}
