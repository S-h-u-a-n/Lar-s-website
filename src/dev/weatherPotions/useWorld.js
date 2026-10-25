import { useCallback, useEffect, useRef, useState } from 'react'
import { paintStroke } from './fallingSand/brush.js'
import { RULES } from './fallingSand/config.js'
import { createWorld, setInput, snapshotWorld, stepWorld, stopInput, WORLD_VERSION } from './fallingSand/simulation.js'

export default function useWorld() {
  const model = useRef(null)
  if (!model.current || model.current.version !== WORLD_VERSION) model.current = createWorld()
  const [snapshot, setSnapshot] = useState(() => snapshotWorld(model.current))
  const renderer = useRef(null), frame = useRef(null), live = useRef(false), last = useRef(0), debt = useRef(0), uiTime = useRef(0), loop = useRef(null)
  const run = useCallback(() => {
    if (!live.current || document.hidden || model.current.ending || frame.current !== null) return
    last.current = performance.now()
    frame.current = requestAnimationFrame(time => loop.current(time))
  }, [])
  loop.current = now => {
    frame.current = null
    if (!live.current || document.hidden) return
    debt.current += Math.min((now - last.current) / 1000, RULES.maxCatchUp / RULES.fps)
    last.current = now
    let steps = 0
    while (debt.current >= 1 / RULES.fps && steps < RULES.maxCatchUp && !model.current.ending) {
      stepWorld(model.current)
      debt.current -= 1 / RULES.fps
      uiTime.current += 1 / RULES.fps
      steps++
    }
    if (steps) renderer.current?.()
    if (uiTime.current >= RULES.uiEvery || model.current.ending) {
      setSnapshot(snapshotWorld(model.current))
      uiTime.current = 0
    }
    if (!model.current.ending) frame.current = requestAnimationFrame(time => loop.current(time))
  }
  useEffect(() => {
    live.current = true
    const visibility = () => {
      stopInput(model.current)
      setSnapshot(snapshotWorld(model.current))
      if (document.hidden) { cancelAnimationFrame(frame.current); frame.current = null; debt.current = 0 }
      else run()
    }
    document.addEventListener('visibilitychange', visibility)
    run()
    return () => { live.current = false; cancelAnimationFrame(frame.current); frame.current = null; document.removeEventListener('visibilitychange', visibility) }
  }, [run])
  const start = useCallback((type, location, strength) => {
    const previous = model.current.input?.type
    setInput(model.current, type, location, strength)
    if (previous !== model.current.input?.type) setSnapshot(snapshotWorld(model.current))
    run()
  }, [run])
  const paint = useCallback((type,from,to,strength,tap=false,size=RULES.defaultBrush) => { paintStroke(model.current,type,from,to,strength,tap,size);run() }, [run])
  const stop = useCallback(() => { stopInput(model.current); setSnapshot(snapshotWorld(model.current)) }, [])
  const reset = useCallback(() => {
    stopInput(model.current)
    model.current = createWorld()
    debt.current = 0; uiTime.current = 0
    setSnapshot(snapshotWorld(model.current))
    renderer.current?.()
    run()
  }, [run])
  return { model, snapshot, renderer, start, paint, stop, reset }
}
