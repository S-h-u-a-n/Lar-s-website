import { useEffect } from 'react'
const sessions = new WeakMap()
export function acquireParallax(root, setup) {
  let session = sessions.get(root)
  if (!session) {
    session = { users: 0, dispose: setup() }
    sessions.set(root, session)
  }
  session.users++
  let released = false
  return () => {
    if (released) return
    released = true
    if (--session.users === 0) { session.dispose(); sessions.delete(root) }
  }
}
// One bounded pointer loop shared by the paper layers. No React work per frame.
export default function useParallax() {
  useEffect(() => acquireParallax(document.documentElement, () => {
    const root = document.documentElement, preference = matchMedia('(prefers-reduced-motion: reduce)')
    let frame = 0, x = 0, y = 0, tx = 0, ty = 0
    const paint = () => {
      x += (tx - x) * .09; y += (ty - y) * .09
      root.style.setProperty('--pointer-x', x.toFixed(3)); root.style.setProperty('--pointer-y', y.toFixed(3))
      if (Math.abs(x-tx)+Math.abs(y-ty)>.002) frame=requestAnimationFrame(paint); else frame=0
    }
    const update = event => {
      if (preference.matches || document.hidden) return
      tx = Math.max(-1,Math.min(1,event.clientX/window.innerWidth*2-1)); ty = Math.max(-1,Math.min(1,event.clientY/window.innerHeight*2-1))
      if (!frame) frame=requestAnimationFrame(paint)
    }
    const reset = () => { tx=ty=0; if (!frame) frame=requestAnimationFrame(paint) }
    window.addEventListener('pointermove',update,{passive:true}); document.addEventListener('pointerleave',reset); document.addEventListener('visibilitychange',reset); preference.addEventListener('change',reset)
    return ()=>{cancelAnimationFrame(frame); window.removeEventListener('pointermove',update);document.removeEventListener('pointerleave',reset);document.removeEventListener('visibilitychange',reset);preference.removeEventListener('change',reset);root.style.removeProperty('--pointer-x');root.style.removeProperty('--pointer-y')}
  }),[])
}
