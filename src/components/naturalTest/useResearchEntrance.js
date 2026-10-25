import { useCallback, useEffect, useRef, useState } from 'react'
import { CAMERA } from './data'

export const ENTRANCE = { overview: 1050, focus: 1500, wash: 1800 }

export default function useResearchEntrance(camera, category, ready) {
  const [phase, setPhase] = useState('overview')
  const running = useRef(true), started = useRef(false), timer = useRef(null)
  const cancel = useCallback(() => {
    if (!running.current) { setPhase(previous => previous === 'done' ? 'interrupted' : previous); return }
    running.current = false
    clearTimeout(timer.current)
    camera.interrupt()
    setPhase('interrupted')
  }, [camera.interrupt])

  useEffect(() => {
    if (!ready || !category || started.current || !running.current) return
    started.current = true
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    const focus = () => {
      if (!running.current) return
      const viewport = camera.viewportRef.current
      if (!viewport) return
      const region = [...viewport.querySelectorAll('[data-research-category]')].find(node => node.dataset.researchCategory === category.id)
      const origin = region?.getBoundingClientRect(), scale = camera.snapshot().scale
      // Frame actual rendered cards too: edition styles can extend beyond the
      // authored category bounds without changing the research layout itself.
      let width = category.width, height = category.height
      if (origin) for (const node of region.querySelectorAll('.nt-entry,.nt-category-title,.nt-category-intro,.ht-landmark')) {
        const rect = node.getBoundingClientRect()
        width = Math.max(width, (rect.right - origin.left) / scale)
        height = Math.max(height, (rect.bottom - origin.top) / scale)
      }
      region?.style.setProperty('--nt-entrance-height', `${height}px`)
      setPhase('focusing')
      camera.locate({ x: category.x + width / 2, y: category.y + height / 2 },
        Math.min(CAMERA.categoryScale, (viewport.clientWidth - 60) / width, (viewport.clientHeight - 40) / height), .5,
        { duration: ENTRANCE.focus, onComplete: () => {
          if (!running.current) return
          if (reduced) { running.current = false; setPhase('done'); return }
          setPhase('wash')
          timer.current = setTimeout(() => { running.current = false; setPhase('done') }, ENTRANCE.wash)
        } })
    }
    if (reduced) focus()
    else timer.current = setTimeout(focus, ENTRANCE.overview)
    return () => {
      clearTimeout(timer.current)
      camera.interrupt()
      started.current = false
      running.current = true // React StrictMode replays mount effects in development.
    }
  }, [ready, category, camera.locate, camera.interrupt, camera.viewportRef, camera.snapshot])

  useEffect(() => {
    window.addEventListener('resize', cancel)
    const media = window.matchMedia('(prefers-reduced-motion: reduce)')
    media.addEventListener('change', cancel)
    return () => { window.removeEventListener('resize', cancel); media.removeEventListener('change', cancel) }
  }, [cancel])
  return { phase, cancel, washCategory: phase === 'wash' ? category?.id : null, detailCategory: ['focusing','wash','done'].includes(phase) ? category?.id : null }
}
