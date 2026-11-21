import { useCallback, useEffect, useRef, useState } from 'react'
import { waitForVisibleOverview } from '../../lib/asyncReadiness'

export default function useResearchEntrance(camera, category, ready, selectCategory) {
  const [phase, setPhase] = useState('overview')
  const running = useRef(false), cancelled = useRef(false), cancelWait = useRef(null)
  const cancel = useCallback(() => {
    cancelled.current = true
    cancelWait.current?.()
    if (running.current) camera.interrupt()
    running.current = false
    setPhase('interrupted')
  }, [camera.interrupt])

  useEffect(() => {
    if (!ready || !category) return
    let disposeWait, frame = requestAnimationFrame(() => {
      if (cancelled.current) return
      disposeWait = waitForVisibleOverview(() => {
        if (cancelled.current) return
        running.current = true; setPhase('focusing')
        selectCategory(category, { duration: 1400, onComplete: () => {
          if (!running.current) return
          running.current = false; setPhase('done')
        } })
      })
      cancelWait.current = disposeWait
    })
    const events = ['pointerdown', 'wheel', 'keydown']
    events.forEach(type => window.addEventListener(type, cancel, true))
    return () => {
      cancelAnimationFrame(frame); disposeWait?.(); cancelWait.current = null
      events.forEach(type => window.removeEventListener(type, cancel, true))
      if (running.current) camera.interrupt()
      running.current = false; cancelled.current = false
    }
  }, [ready, category, selectCategory, camera.interrupt, cancel])

  useEffect(() => {
    window.addEventListener('resize', cancel)
    return () => window.removeEventListener('resize', cancel)
  }, [cancel])
  return { phase, cancel }
}
