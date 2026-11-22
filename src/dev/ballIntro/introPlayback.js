import { characterImages } from '../../components/ballTest/decodedImages.js'

// One finite, cancellable timeline, independent of the production portrait
// transitions. Additive transforms preserve Framer layout and idle transforms.
export function createIntroPlayback({onComplete=()=>{}}={}) {
  let version=0,animations=[]
  const clear=()=>{animations.forEach(animation=>animation.cancel());animations=[]}
  return {
    start(tracks,{reduced=false}={}) {
      const token=++version
      clear()
      if(reduced || !tracks.length){onComplete();return}
      try {
        for(const track of tracks) {
          const options={duration:track.duration,delay:track.delay,fill:'both',easing:'cubic-bezier(.2,.7,.2,1)'}
          const opacity=track.transient
            ? [{opacity:0,offset:0},{opacity:track.opacity,offset:.38},{opacity:0,offset:1}]
            : [{opacity:0,offset:0},{opacity:track.opacity,offset:.22},{opacity:track.opacity,offset:1}]
          for(const [frames,extra] of [[track.frames,{composite:'add'}],[opacity,{}]]) {
            const animation=track.node.animate(frames,{...options,...extra})
            animation.finished.catch(()=>{})
            animation.pause();animation.currentTime=0
            animations.push(animation)
          }
        }
        const completion=Promise.all(animations.map(animation=>animation.finished))
        animations.forEach(animation=>animation.play())
        completion.then(()=>{if(token===version){clear();onComplete()}},()=>{})
      } catch(error) {
        if(token===version){clear();onComplete(error)}
      }
    },
    skip(){version++;clear();onComplete()},
    pause(){animations.forEach(animation=>animation.pause())},
    resume(){animations.forEach(animation=>animation.play())},
    dispose(){version++;clear()},
  }
}

export async function waitForIntroAssets(host,signal) {
  const portraits=[...host.querySelectorAll('.ball-portrait')]
  await new Promise((resolve,reject)=>{
    const finish=error=>{observer.disconnect();signal.removeEventListener('abort',abort);error?reject(error):resolve()}
    const check=()=>{
      if(portraits.some(node=>node.dataset.loadState==='error'))finish(new Error('角色素材未能載入，可使用原頁面的重試入口後重新播放。'))
      else if(portraits.every(node=>node.dataset.loadState==='ready'))finish()
    }
    const abort=()=>finish(new DOMException('Cancelled','AbortError'))
    const observer=new MutationObserver(check)
    observer.observe(host,{subtree:true,attributes:true,attributeFilter:['data-load-state']})
    signal.addEventListener('abort',abort,{once:true})
    if(signal.aborted)abort();else check()
  })
  let abort
  const abortPromise=new Promise((_,reject)=>{
    abort=()=>reject(new DOMException('Cancelled','AbortError'))
    signal.addEventListener('abort',abort,{once:true})
    if(signal.aborted)abort()
  })
  const images=[...host.querySelectorAll('.ball-cover-image')]
  images.forEach(image=>{image.loading='eager'})
  const svgUrls=[...new Set([...host.querySelectorAll('.ball-portrait-scene image')].map(image=>image.getAttribute('href')).filter(Boolean))]
  try {
    await Promise.race([Promise.all([document.fonts?.ready,...images.map(image=>image.decode()),...svgUrls.map(characterImages.load)]),abortPromise])
  } finally { signal.removeEventListener('abort',abort) }
  if(signal.aborted)throw new DOMException('Cancelled','AbortError')
}
