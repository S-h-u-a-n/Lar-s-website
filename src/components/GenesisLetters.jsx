import { useEffect, useRef } from 'react'

// Interaction adapted from boknowsworld/boknows-text-image-template (MIT).
// See public/licenses/boknows-text-image-MIT.txt. Artwork belongs to the site owner.
const files = import.meta.glob('../../Art/IntroScreen/text-image/*.PNG', {
  eager: true, query: '?url', import: 'default',
})
const letters = [
  ['01-g', 'G', 109, 101, 738, 847],
  ['02-e', 'E', 220, 62, 504, 899],
  ['03-n', 'N', 91, 139, 881, 746],
  ['04-e', 'E', 108, 55, 817, 889],
  ['05-s', 'S', 133, 49, 731, 915],
  ['06-i', 'I', 265, 71, 497, 886],
  ['07-s', 'S', 196, 66, 683, 899],
].map(([id, char, x, y, width, height]) => ({
  id, char, x, y, width, height,
  src: files[`../../Art/IntroScreen/text-image/${id}.PNG`],
}))

export default function GenesisLetters({ leaving, replayKey }) {
  const root = useRef(null)
  useEffect(() => {
    const el = root.current
    const reduced = matchMedia('(prefers-reduced-motion: reduce)')
    const slots = [...el.querySelectorAll('.genesis-letter')]
    const timers = new Set()
    const animations = new Set()
    const active = new Set()
    let disposed = false
    let opening = true
    const later = (fn, ms) => {
      const id = setTimeout(() => { timers.delete(id); if (!disposed) fn() }, ms)
      timers.add(id)
    }
    const animate = (node, frames, options) => {
      node.getAnimations().forEach(a => { a.cancel(); animations.delete(a) })
      const a = node.animate(frames, options)
      animations.add(a)
      a.onfinish = () => animations.delete(a)
      return a
    }
    const space = () => slots.forEach((slot, i) => {
      let shift = 0
      for (const j of active) if (j !== i) shift += (j < i ? 1 : -1) * (Math.abs(j - i) === 1 ? .055 : .018)
      slot.querySelector('.genesis-visual').style.translate = `${shift}em 0`
    })
    const hide = i => {
      const slot = slots[i]
      if (!active.delete(i)) return
      const sticker = slot.querySelector('.genesis-sticker')
      const pose = getComputedStyle(sticker).transform
      slot.classList.remove('is-active')
      animate(sticker, [{ transform: pose, opacity: 1 }, { transform: 'scale(1.045)', opacity: 1, offset: .2 }, { transform: 'scale(.35)', opacity: 0 }], { duration: 620, easing: 'cubic-bezier(.22,1,.36,1)', fill: 'forwards' })
      space()
    }
    const show = i => {
      const slot = slots[i]
      if (disposed || leaving || reduced.matches || document.hidden || slot.dataset.ready !== 'true' || active.has(i)) return
      active.add(i)
      slot.classList.add('is-active')
      const angle = [-5, 4, -3, 4, -4, 3, -3][i]
      const frames = Array.from({ length: 41 }, (_, k) => {
        const t = k / 40
        const v = k === 40 ? 1 : 1 - Math.exp(-7.2 * t) * (Math.cos(10.5 * t) + .24 * Math.sin(10.5 * t))
        return { offset: t, transform: `translateY(${8 * (1 - v)}px) rotate(${angle * (1 - v)}deg) scale(${.35 + .65 * v})`, opacity: Math.min(1, t * 6) }
      })
      animate(slot.querySelector('.genesis-sticker'), frames, { duration: 340, fill: 'forwards' })
      space()
    }
    const stopOpening = () => {
      if (!opening) return
      opening = false
      timers.forEach(clearTimeout); timers.clear()
      slots.forEach((_, i) => hide(i))
    }
    const listeners = []
    const listen = (target, event, fn) => {
      target.addEventListener(event, fn)
      listeners.push(() => target.removeEventListener(event, fn))
    }
    slots.forEach((slot, i) => {
      listen(slot, 'pointerenter', e => { if (e.pointerType === 'mouse') { stopOpening(); show(i) } })
      listen(slot, 'pointerdown', () => { stopOpening(); show(i) })
      listen(slot, 'pointerleave', e => { if (e.pointerType === 'mouse') hide(i) })
      listen(slot, 'pointercancel', () => hide(i))
      listen(slot, 'pointerup', e => { if (e.pointerType !== 'mouse') later(() => hide(i), 420) })
    })
    const reset = () => {
      stopOpening()
      slots.forEach((_, i) => hide(i))
      if (reduced.matches) animations.forEach(a => a.cancel())
    }
    listen(reduced, 'change', reset)
    listen(document, 'visibilitychange', () => { if (document.hidden) reset() })
    Promise.all(slots.map(async slot => {
      try {
        await slot.querySelector('img').decode()
        if (!disposed) slot.dataset.ready = 'true'
      } catch { /* A failed image leaves the original letter visible. */ }
    })).then(() => {
      if (disposed || !opening || reduced.matches || leaving) return
      slots.forEach((_, i) => {
        later(() => show(i), 450 + i * 85)
        later(() => hide(i), 1400 + i * 85)
      })
      later(() => { opening = false }, 2550)
    })
    return () => {
      disposed = true
      timers.forEach(clearTimeout)
      listeners.forEach(remove => remove())
      animations.forEach(a => a.cancel())
      slots.forEach(slot => {
        slot.querySelector('.genesis-sticker').getAnimations().forEach(a => a.cancel())
        slot.classList.remove('is-active')
        slot.querySelector('.genesis-visual').style.translate = ''
      })
    }
  }, [leaving, replayKey])

  return (
    <span ref={root} className="intro-title-main genesis-letters" aria-label="GENESIS" translate="no">
      {letters.map(({ id, char, src, x, y, width, height }) => (
        <span key={id} className="genesis-letter" data-position={id} aria-hidden="true" style={{ '--art-width': `${width / height * .8}em`, '--art-size': `${1024 / height * .8}em`, '--art-x': `${-x / height * .8}em`, '--art-y': `${-y / height * .8}em` }}>
          <span className="genesis-visual">
            <span className="genesis-char">{char}</span>
            <span className="genesis-sticker"><img src={src} alt="" width="1024" height="1024" draggable="false" /></span>
          </span>
        </span>
      ))}
    </span>
  )
}
