import { forwardRef, useEffect, useId, useImperativeHandle, useRef, useState } from 'react'
import { createYuta } from './yutaRuntime'
import { createSegmentMotionDispatcher } from './dialogue/motionDispatch'

export default forwardRef(function YutaLive2D({ onTalk, dialogueMotion = null, dialogueKey = 0, dialogueActive = false, interactionKey = 0 }, ref) {
  const canvas = useRef(null), runtime = useRef(null)
  const request = { motion: dialogueMotion, key: dialogueKey, active: dialogueActive, interaction: interactionKey }
  const requested = useRef(request), dispatchMotion = useRef(createSegmentMotionDispatcher()), appliedInteraction = useRef(null)
  requested.current = request
  const [error, setError] = useState('')
  const [ready, setReady] = useState(false)
  const filterId = `yuta-outline-${useId().replaceAll(':', '')}`
  useImperativeHandle(ref, () => ({
    play: name => runtime.current?.play(name),
    startDialogue: name => runtime.current?.startDialogue(name),
    endDialogue: () => runtime.current?.endDialogue(),
  }), [])
  useEffect(() => {
    const controller = new AbortController()
    let instance
    createYuta(canvas.current, controller.signal, undefined, { autoOpening: false }).then(value => {
      instance = value
      if (controller.signal.aborted) value.dispose()
      else {
        runtime.current = value
        const current = requested.current
        dispatchMotion.current(value, current.key, current.motion)
        value.setActivity({ active: current.active, resetIdle: true })
        appliedInteraction.current = current.interaction
        setReady(true)
      }
    }).catch(error => {
      if (!controller.signal.aborted) { console.error('Yuta Live2D:', error); setError(error.message) }
    })
    return () => { controller.abort(); instance?.dispose(); runtime.current = null }
  }, [])
  useEffect(() => {
    if (!runtime.current) return
    dispatchMotion.current(runtime.current, dialogueKey, dialogueMotion)
    runtime.current.setActivity({ active: dialogueActive, resetIdle: appliedInteraction.current !== interactionKey })
    appliedInteraction.current = interactionKey
  }, [dialogueMotion, dialogueKey, dialogueActive, interactionKey, ready])
  return <button className="tt-character tt-yuta" onClick={onTalk} aria-label="Talk to the student guide" data-yuta-status={error ? 'error' : ready ? 'ready' : 'loading'}>
    <svg className="tt-yuta-filters" aria-hidden="true"><defs><filter id={filterId} x="-15%" y="-15%" width="130%" height="130%" colorInterpolationFilters="sRGB"><feMorphology in="SourceAlpha" operator="dilate" radius="4" result="outline"/><feFlood floodColor="white"/><feComposite in2="outline" operator="in"/><feMerge><feMergeNode/><feMergeNode in="SourceGraphic"/></feMerge></filter></defs></svg>
    <canvas ref={canvas} width="768" height="768" className="tt-yuta-canvas" style={{ filter: `url(#${filterId})` }} aria-label="尤塔 Live2D"/>
    {!ready && <span className="tt-yuta-status" role="status">{error ? `尤塔模型載入失敗：${error}` : 'Live2D…'}</span>}
  </button>
})
