export const PORTRAIT_TRANSITIONS = Object.freeze([
  { id: 0, name: '直接切換 Cut', duration: 0 },
  { id: 1, name: '閃白 Flash', duration: 200 },
  { id: 2, name: '淡入淡出 Crossfade', duration: 200 },
  { id: 3, name: '彈動 Pop', duration: 420 },
  { id: 4, name: '震動 Shake', duration: 220 },
])
export function portraitTransition(id = 0) {
  if (!Number.isInteger(id) || !PORTRAIT_TRANSITIONS[id]) throw new Error(`Unknown portrait transition: ${id}`)
  return PORTRAIT_TRANSITIONS[id]
}

// Own both decoding and animation, so stale completions cannot replace a later
// line. paint() commits synchronously before animate() reads the layer refs.
export function createPortraitTransitions({ load, paint, animate, onStatus = () => {}, distance = 18 }) {
  let version = 0, current = null, animations = []
  const stop = () => { for (const animation of animations) animation.cancel(); animations = [] }
  const run = (layer, frames, duration, easing = 'ease-out') => {
    const animation = animate(layer, frames, { duration, easing, fill: 'both' })
    // Cancellation can precede the await/Promise.all that consumes this result.
    animation.finished.catch(() => {})
    animations.push(animation)
    return animation
  }
  function cancel(settle = true) {
    version++
    stop()
    if (settle && current) paint(current, null)
  }
  return {
    cancel,
    async request(next, mode = 0) {
      const spec = portraitTransition(mode)
      const token = ++version
      stop()
      if (current) paint(current, null)
      onStatus('loading')
      try {
        await Promise.all([load(next.bodyUrl), load(next.faceUrl)])
        if (token !== version) return
        const previous = current
        if (!current) { current = next; paint(next, null) }
        const commit = old => { current = next; paint(next, old) }
        if (mode === 0) {
          commit(null)
        } else if (mode === 1) {
          // This layer is inside the existing content alpha mask and below
          // the separate frame. Its fully opaque fill spans the sprite swap.
          const whitening = spec.duration * .3
          const flashOut = run('flash', [{ opacity: 0 }, { opacity: 1 }], whitening)
          await flashOut.finished
          if (token !== version) return
          commit(null)
          const flashIn = run('flash', [{ opacity: 1 }, { opacity: 0 }], spec.duration - whitening)
          flashOut.cancel()
          await flashIn.finished
        } else if (mode === 2) {
          commit(previous)
          const incoming = run('current', [{ opacity: 0 }, { opacity: 1 }], spec.duration, 'linear')
          const outgoing = previous && run('previous', [{ opacity: 1 }, { opacity: 0 }], spec.duration, 'linear')
          await Promise.all([incoming.finished, outgoing?.finished])
        } else {
          commit(null)
          const frames = mode === 3 ? [
            { transform: 'translateY(0px) scale(1)', offset: 0, easing: 'cubic-bezier(.16,1,.3,1)' },
            { transform: `translateY(${-distance}px) scale(1.025)`, offset: .16, easing: 'cubic-bezier(.55,0,1,.45)' },
            { transform: 'translateY(0px) scale(1)', offset: .38, easing: 'cubic-bezier(.16,1,.3,1)' },
            { transform: `translateY(${-distance * .55}px) scale(1.014)`, offset: .52, easing: 'cubic-bezier(.55,0,1,.45)' },
            { transform: 'translateY(0px) scale(1)', offset: .72, easing: 'cubic-bezier(.16,1,.3,1)' },
            { transform: `translateY(${-distance * .22}px) scale(1.006)`, offset: .82, easing: 'cubic-bezier(.55,0,1,.45)' },
            { transform: 'translateY(0px) scale(1)', offset: 1 },
          ] : [0, -1, .8, -.6, .3, 0].map((value, index) => ({
            transform: `translateX(${value * distance}px)`, offset: index / 5,
          }))
          await run('component', frames, spec.duration, 'linear').finished
        }
        if (token !== version) return
        stop()
        paint(current, null)
        onStatus('ready')
      } catch (error) {
        if (token !== version) return
        stop()
        if (current) paint(current, null)
        onStatus('error', error)
      }
    },
  }
}
