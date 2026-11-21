import React, { useEffect, useLayoutEffect, useRef } from 'react'
import { ASSETS, HISTORY as C } from './config'
import { createImageLoader } from './imageLoader'
import { stepParallax } from './inertiaParallax'
import { entranceProgress, spring, localPoint, opaqueAt } from './interactionMath'
import { createEntryGesture } from './entryGesture'
import { openingSettings, warmOpeningActor, startOpeningActor } from './openingAnimation'
import { createDiagnostics } from './diagnostics'
import HistoryTitle from './HistoryTitle'
import InitialHistoryTitle from './InitialHistoryTitle'
import { initialHintPeople, createInitialPeopleHint } from './initialPeopleHint'
import HistorySquares from './HistorySquares'
import HistoryLabel from './HistoryLabel'
import ExtraSquares from './ui/ExtraSquares'
import HistoryProgress from './ui/HistoryProgress'
import { personAnchor, personContour } from './labelPosition'
import './history.css'
import './ui/entry-detail.css'
import './ui/reading-progress.css'
import './ui/title-detail.css'
import './ui/direction-detail.css'

export default function HistoryTest({ onEnter, disabled = false, leaving = false } = {}) {
  const initialTitle = useRef(null)
  const viewport = useRef(null), world = useRef(null), images = useRef([]), title = useRef(null), items = useRef([]), motionItems = useRef([]), arrow = useRef(null), entryHint = useRef(null), titlePlayback = useRef(null), squares = useRef(null), historyLabel = useRef(null)
  const disabledRef = useRef(disabled)
  disabledRef.current = disabled
  useEffect(() => {
    const previousOverflow = document.body.style.overflow, previousOverscroll = document.body.style.overscrollBehavior
    document.body.style.overflow = 'hidden'
    document.body.style.overscrollBehavior = 'none'
    return () => { document.body.style.overflow = previousOverflow; document.body.style.overscrollBehavior = previousOverscroll }
  }, [])
  // Cancel RAF synchronously before React detaches image refs during handoff.
  useLayoutEffect(() => {
    const host = viewport.current, nodes = images.current
    let alive = true, frame = 0, previous = 0, ready = false, disposed = false, layoutDirty = true
    let camera = 1, target = 1, scale = 1, max = 0, width = 0, height = 0, inputX = 0, inputY = 0
    let titleGeometry = null
    let lastCamera = NaN, lastScale = NaN, priorityKey = '', lastPointer = null
    const reduced = matchMedia('(prefers-reduced-motion: reduce)')
    const profile = createDiagnostics(host)
    const traceOpening = new URLSearchParams(location.search).get('profile') === '1'
    const openingTrace = []
    let tracePublished = false
    const springs = ASSETS.map(() => ({ angle: 0, velocity: 0, tilt: 0, tiltVelocity: 0 }))
    const local = ASSETS.map(() => ({ scale: { value: 1, velocity: 0 }, angle: { value: 0, velocity: 0 }, tilt: { value: 0, velocity: 0 }, lastTrigger: -Infinity }))
    const masks = ASSETS.map(a => a.interaction ? Uint8Array.from(atob(a.interaction.bits), char => char.charCodeAt(0)) : null)
    const labelContours = ASSETS.map((a,i) => a.interaction ? personContour(a.interaction, masks[i]) : null)
    const poses = ASSETS.map(() => null)
    const gesture = createEntryGesture(C.entryGesture)
    let openingStart = null, openingSet = new Set(), warming = null, warmCamera = null
    const openingAnimations = new Set(), openingActors = new Map()
    let hovered = -1, pointerIntent = false
    let mouse = null, pointerDX = 0, pointerDY = 0, lastHoverHit = 0, lastWheel = -Infinity, hoverTimer = 0
    let arrowDismissed = false, entryRequested = false
    let initialHint = null
    const openingDuration = Math.max(...ASSETS.map(a => { const g=openingSettings(a,C.entrance);return g.delay+g.duration }))
    const parallax = { position: 0, velocity: 0, scrollVelocity: 0 }
    const rendered = ASSETS.map(() => false)
    const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v))
    const setStyle = (node, key, value) => { if (node.style[key] !== value) node.style[key] = value }
    // Use actual alpha extents only for visibility/priority, never to crop the art.
    const bounds = ASSETS.map(a => {
      const naturalWidth = a.id.startsWith('layer') ? 11166 : a.id.startsWith('map') ? 3255 : 2109
      return [a.x + a.bounds[0] / naturalWidth * a.width, a.x + a.bounds[2] / naturalWidth * a.width]
    })
    // Only attenuate inside the final 60 CSS px at either edge to avoid
    // revealing a texture edge during a fast reversal. Interior motion is driven
    // exclusively by velocity, never by accumulated panorama progress.
    function layerOffset(id, at) {
      const distance = Math.min(at * max, (1 - at) * max)
      const t = clamp(distance / C.parallaxDynamics.edgeFade, 0, 1)
      const edge = t * t * (3 - 2 * t)
      return C.parallax[id] * parallax.position * edge
    }
    function required(at, margin = 0) {
      const left = at * max / scale - margin / scale, right = (at * max + width + margin) / scale
      return bounds.flatMap(([l, r], i) => {
        const offset = ASSETS[i].id.startsWith('layer') ? layerOffset(ASSETS[i].id, at) / scale : 0
        return r + offset >= left && l + offset <= right ? [i] : []
      })
    }
    const loader = createImageLoader(ASSETS, nodes, () => { if (alive) request() })
    loader.setBackgroundPaused(!reduced.matches)
    function prioritize() {
      const staging = !reduced.matches && (openingStart === null || performance.now() - openingStart < openingDuration)
      const indices = required(target, staging ? 40 : Math.max(240, width * .5))
      const key = indices.join(',')
      if (key !== priorityKey) {
        priorityKey = key
        loader.prioritize(indices, (target * max + width / 2) / scale)
      }
    }
    function pickHover(time) {
      if (!mouse || !pointerIntent || time - lastWheel < C.hover.scrollQuietMs) { hovered = -1; return }
      const candidates = ASSETS.map((a, i) => ({ a, i }))
        .filter(({ a, i }) => a.interaction && rendered[i] && poses[i]?.entered)
        .sort((a, b) => (b.i === hovered ? 81 : local[b.i].scale.value > 1.001 ? 80 : b.a.z) - (a.i === hovered ? 81 : local[a.i].scale.value > 1.001 ? 80 : a.a.z) || b.i - a.i)
      const hit = candidates.find(({ a, i }) => {
        const [u, v] = localPoint(poses[i], mouse[0], mouse[1])
        return opaqueAt(a.interaction, masks[i], u, v, poses[i].width, poses[i].height)
      })?.i ?? -1
      if (hit >= 0) lastHoverHit = time
      if (hit === -1 && hovered >= 0 && time - lastHoverHit < 90) return
      if (hit !== hovered && hit >= 0 && !reduced.matches && time - local[hit].lastTrigger >= C.hover.cooldownMs) {
        const dx = Math.abs(pointerDX) > .5 ? Math.sign(pointerDX) : (mouse[0] < poses[hit].x + poses[hit].width / 2 ? 1 : -1)
        local[hit].angle.velocity += dx * C.hover.push
        local[hit].tilt.velocity += Math.sign(pointerDY) * C.hover.push * .45
        local[hit].lastTrigger = time
        const node = nodes[hit]
        node.dataset.touchCount = String((Number(node.dataset.touchCount) || 0) + 1)
      }
      hovered = hit
    }
    function requestEntry() {
      if (entryRequested || disabledRef.current || !ready || camera !== 0 ||
        (!reduced.matches && performance.now()-openingStart < openingDuration)) return
      entryRequested = true
      entryHint.current.disabled = true
      host.dataset.entryState = 'requested'
      host.dataset.entryRequests = String((Number(host.dataset.entryRequests) || 0) + 1)
      const event = new CustomEvent('genesis:history-enter', { bubbles: true, detail: { next: 'comic', source: 'history-test' } })
      host.dispatchEvent(event)
      onEnter?.()
      // Standalone has no App-owned navigation callback: deliberately no redirect.
    }
    function render(time) {
      frame = 0
      if (!alive) return
      if (layoutDirty) { resize(); layoutDirty = false }
      const start = performance.now(), continuing = previous !== 0
      const dt = Math.min((time - (previous || time - 16)) / 1000, .032)
      previous = time
      prioritize()
      // Never move into a cold, undecoded viewport. Loads trigger another frame;
      // there is no retry loop or continuous RAF while waiting for I/O.
      const canPresent = required(target, 40).every(i => ['ready', 'failed'].includes(loader.state[i]))
      if (canPresent) {
        camera = target
        if (!ready) {
          if (warmCamera !== camera) {
            if (warming) for (const i of openingSet) { items.current[i].style.visibility='hidden';items.current[i].style.willChange='auto' }
            openingSet = new Set(required(camera).filter(i => loader.state[i] === 'ready'))
            warmCamera = camera
            warming = reduced.matches ? [] : [...openingSet]
          }
          host.dataset.ready='true'
          host.dataset.opening='preparing'
          world.current.style.transform=`translateX(${-camera*max}px)`
          if (warming.length) {
            const i=warming.shift(),g=openingSettings(ASSETS[i],C.entrance)
            warmOpeningActor(items.current[i],g.group)
            request();previous=0;return
          }
          openingStart=time
          if (camera === 1 && target === 1 && !reduced.matches) {
            const indices = initialHintPeople(ASSETS, { width, height, scale, cameraPx: camera * max, ready: i => loader.state[i] === 'ready' })
            initialHint = createInitialPeopleHint(indices, time + 1050)
            host.dataset.initialHintPeople = indices.map(i => ASSETS[i].id).join(',')
            host.dataset.initialHintPeakOverlap = '0'
          }
          if (traceOpening) host.dataset.openingStart=String(time)
          if (!reduced.matches) for (const i of openingSet) {
            const a=ASSETS[i],g=openingSettings(a,C.entrance)
            const naturalHeight=g.group==='people'?2984:g.group==='map'?3255:2620
            const silhouetteTop=(a.y+a.bounds[1]/naturalHeight*a.height)*scale
            const distance=Math.max(g.fromY||0,height-silhouetteTop+24)
            const animation=startOpeningActor(items.current[i],g,distance,time,()=>{request()})
            openingAnimations.add(animation);openingActors.set(i,animation)
          }
          host.dataset.opening='playing'
        }
        ready = true; host.dataset.ready = 'true'
      }
      if (!ready) { previous = 0; return }
      initialTitle.current?.update({ ready: true, camera })
      if (camera !== 1 || target !== 1 || disabledRef.current || reduced.matches) initialHint?.cancel(time)
      const cameraChanged = camera !== lastCamera || scale !== lastScale
      if (cameraChanged) world.current.style.transform = `translateX(${-camera * max}px)`
      if (titleGeometry) titlePlayback.current?.check({ rect: { ...titleGeometry, x: titleGeometry.x - camera * max }, viewport: { width, height } })
      if (cameraChanged) squares.current?.update({ scale, cameraPx: camera * max, viewportWidth: width })
      const near = new Set(required(camera, Math.max(160, width * .25)))
      const travel = Number.isNaN(lastCamera) || scale !== lastScale ? 0 : (lastCamera - camera) * max
      let moving = stepParallax(parallax, travel, dt, C.parallaxDynamics, reduced.matches)
      const elapsed = time - openingStart
      const opening = !reduced.matches && elapsed < openingDuration
      moving ||= opening
      host.dataset.opening = opening ? 'playing' : 'complete'
      loader.setBackgroundPaused(opening)
      if (travel !== 0 && !arrowDismissed) { arrowDismissed = true; arrow.current.dataset.dismissed = 'true' }
      const atEnd = camera === 0 && !opening && ready
      entryHint.current.dataset.visible = String(atEnd)
      entryHint.current.disabled = !atEnd || disabledRef.current || entryRequested
      if (atEnd) gesture.arrive(time)
      else gesture.leave()
      pickHover(time)
      const hintWeights = initialHint?.update(time)
      if (initialHint) {
        host.dataset.initialHintState = initialHint.phase
        host.dataset.initialHintAsset = [...hintWeights.keys()].map(i => ASSETS[i].id).join(',')
        host.dataset.initialHintPeakOverlap = String(Math.max(Number(host.dataset.initialHintPeakOverlap), hintWeights.size))
        moving ||= initialHint.running
      }
      ASSETS.forEach((asset, i) => {
        const img = nodes[i], item = items.current[i], visible = near.has(i) && loader.state[i] === 'ready'
        if (rendered[i] !== visible) {
          item.style.visibility = visible ? 'visible' : 'hidden'
          img.dataset.rendered = String(visible)
          rendered[i] = visible
        }
        if (!visible && time-openingStart >= openingDuration && openingActors.has(i)) {
          const animation=openingActors.get(i)
          animation.cancel();openingActors.delete(i);openingAnimations.delete(animation)
          item.style.willChange='auto'
        }
        const group = asset.id.startsWith('layer') ? 'layer' : asset.id.startsWith('map') ? 'map' : 'people'
        const entrance = openingSet.has(i) ? entranceProgress(elapsed, openingSettings(asset,C.entrance), reduced.matches) : { progress: 1, offset: 0, opacity: 1 }
        const naturalHeight = group === 'people' ? 2984 : group === 'map' ? 3255 : 2620
        const silhouetteTop = (asset.y + asset.bounds[1] / naturalHeight * asset.height) * scale
        const entryY = group === 'layer' ? 0 : entrance.offset * Math.max(C.entrance[group].fromY, height - silhouetteTop + 24)
        // Opening opacity/translation belongs exclusively to the compositor.
        if (!openingSet.has(i) || reduced.matches) setStyle(item,'opacity','1')
        if (group === 'map') return
        if (asset.id.startsWith('layer')) {
          if (visible) {
            const offset = layerOffset(asset.id, camera)
            setStyle(item, 'transform', Math.abs(offset) < .00001 ? 'none' : `translateX(${offset}px)`)
          }
          return
        }
        if (!asset.id.startsWith('people')) return
        const s = springs[i], m = C.motion
        if (reduced.matches) {
          s.angle = s.velocity = s.tilt = s.tiltVelocity = 0
          // Reduced motion still permits a gentle, non-rotating hover scale.
        }
        if (!reduced.matches) {
        const variation = .85 + (i % 5) * .065
        s.velocity += inputX * m.impulse * variation
        s.tiltVelocity += inputY * m.impulse * variation
        s.velocity += (-m.stiffness * s.angle - m.damping * s.velocity) * dt
        s.tiltVelocity += (-m.stiffness * s.tilt - m.damping * s.tiltVelocity) * dt
        s.angle = clamp(s.angle + s.velocity * dt, -m.maxAngle, m.maxAngle)
        s.tilt = clamp(s.tilt + s.tiltVelocity * dt, -m.maxAngle, m.maxAngle)
        }
        const active = Math.abs(s.angle) + Math.abs(s.velocity) + Math.abs(s.tilt) + Math.abs(s.tiltVelocity) > .003
        if (!active) s.angle = s.velocity = s.tilt = s.tiltVelocity = 0
        const interaction = local[i], selected = hovered === i && entrance.progress === 1
        const scaleMoving = reduced.matches ? false : spring(interaction.scale, selected ? C.hover.scale : 1, dt, C.hover.scaleStiffness, C.hover.scaleDamping)
        if (reduced.matches) { interaction.scale.value = selected ? C.hover.scale : 1; interaction.scale.velocity = 0 }
        const pushMoving = spring(interaction.angle, 0, dt, C.hover.stiffness, C.hover.damping)
        const tiltMoving = spring(interaction.tilt, 0, dt, C.hover.stiffness, C.hover.damping)
        if (reduced.matches) interaction.angle.value = interaction.angle.velocity = interaction.tilt.value = interaction.tilt.velocity = 0
        const rotateX = clamp(s.tilt * m.verticalAngle * entrance.progress + interaction.tilt.value, -C.hover.maxTilt, C.hover.maxTilt)
        const rotateZ = clamp(s.angle * entrance.progress + interaction.angle.value, -C.hover.maxAngle, C.hover.maxAngle)
        // Cues never write to real hover state. The larger scale wins, so ending
        // a cue cannot shrink a hovered person or disturb its hover spring.
        const hintScale = reduced.matches ? 1 : 1 + (C.hover.scale - 1) * (hintWeights?.get(i) ?? 0)
        const hoverScale = Math.max(interaction.scale.value, hintScale)
        setStyle(item, 'zIndex', String(selected ? 81 : hoverScale > 1.001 ? 80 : asset.z))
        nodes[i].dataset.hovered = String(selected)
        nodes[i].dataset.hoverScale = hoverScale.toFixed(4)
        const transformed = rotateX || rotateZ || hoverScale !== 1
        setStyle(motionItems.current[i], 'transform', visible && transformed ? `perspective(${2600 * scale}px) rotateX(${rotateX}deg) rotateZ(${rotateZ}deg) scale(${hoverScale})` : 'none')
        poses[i] = { x: asset.x * scale - camera * max, y: (height - C.height * scale) / 2 + asset.y * scale, width: asset.width * scale, height: asset.height * scale, origin: asset.origin, entryY, rotateX, rotateZ, scale: hoverScale, perspective: 2600 * scale, entered: entrance.progress === 1 }
        moving ||= scaleMoving || pushMoving || tiltMoving

        moving ||= active
      })
      const labelIndex = disabledRef.current ? -1 : hovered
      if (labelIndex >= 0 && poses[labelIndex]?.entered) {
        historyLabel.current?.update({ id: ASSETS[labelIndex].id,
          anchor: personAnchor(labelContours[labelIndex], poses[labelIndex], C.hover.scale),
          viewport: { width, height }, reduced: reduced.matches })
      } else historyLabel.current?.update({ id: '', reduced: reduced.matches })
      if (traceOpening && !tracePublished) {
        if (opening && openingTrace.length < 180) {
          const sample = { ms: Math.round(elapsed), layers: Object.fromEntries(ASSETS.flatMap((a,i) => a.id.startsWith('layer') ? [[a.id,getComputedStyle(items.current[i]).opacity]] : [])) }
          for (const group of ['map', 'people', 'layer']) {
            const index = ASSETS.findIndex((a, i) => a.id.startsWith(group) && openingSet.has(i))
            if (index >= 0) sample[group] = { transform: getComputedStyle(items.current[index]).transform, opacity: getComputedStyle(items.current[index]).opacity }
          }
          openingTrace.push(sample)
        } else if (!opening) { host.dataset.openingTrace = JSON.stringify(openingTrace); tracePublished = true }
      }
      inputX = inputY = 0
      lastCamera = camera; lastScale = scale
      host.dataset.camera = String(camera)
      profile.frame(time, performance.now() - start, continuing)
      host.dataset.hoverAsset = hovered < 0 ? '' : ASSETS[hovered].id
      if (moving) request()
      else previous = 0
    }
    function request() { if (!frame && alive) frame = requestAnimationFrame(render) }
    function resize() {
      pointerIntent = false; hovered = -1
      width = host.clientWidth; height = host.clientHeight
      scale = Math.max(height / C.height, width / C.width)
      max = Math.max(0, C.width * scale - width)
      // Size in final CSS pixels. Do not rasterize a 12524px reference scene and
      // nested filtered 3D surfaces only to shrink the result with an ancestor.
      world.current.style.width = `${C.width * scale}px`
      world.current.style.height = `${C.height * scale}px`
      world.current.style.top = `${(height - C.height * scale) / 2}px`
      const titleScale = Math.min(1, Math.max(.05, (width / scale - C.title.x - 100) / C.title.width))
      Object.assign(title.current.style, { left: `${C.title.x * scale}px`, top: `${C.title.y * scale}px`, width: `${C.title.width * scale}px`, fontSize: `${C.title.fontSize * scale}px`, transform: `scale(${titleScale})` })
      title.current.style.setProperty('--history-title-scale', String(titleScale))
      title.current.style.setProperty('--history-pre-ratio', `${C.titlePlayback.preRatio}em`)
      title.current.style.setProperty('--history-line-gap', `${C.titlePlayback.lineGapEm}em`)
      title.current.style.setProperty('--history-heading-em', `${C.titlePlayback.headingEm}em`)
      titleGeometry = { x: C.title.x * scale, y: (height-C.height*scale)/2+C.title.y*scale, width:C.title.width*scale*titleScale, height:C.title.fontSize*scale*C.titlePlayback.headingEm*titleScale }
      entryHint.current.style.fontSize = `${C.entryHint.fontSize * scale}px`
      entryHint.current.style.marginTop = `${C.entryHint.gap * scale}px`
      const sh = C.shadow
      host.style.setProperty('--history-shadow', `${sh.x * scale}px ${sh.y * scale}px ${sh.blur * scale}px ${sh.color}`)
      ASSETS.forEach((a, i) => Object.assign(items.current[i].style, { left: `${a.x * scale}px`, top: `${a.y * scale}px`, width: `${a.width * scale}px`, height: `${a.height * scale}px` }))
      priorityKey = ''; lastScale = NaN
    }
    function wheel(e) {
      e.preventDefault()
      if (disabledRef.current) return
      const unit = e.deltaMode === 1 ? C.scroll.linePixels : e.deltaMode === 2 ? height : 1
      const dx = e.deltaX * unit, dy = e.deltaY * unit
      const travel = Math.abs(dx) > Math.abs(dy) ? dx : -dy
      const now = performance.now()
      lastWheel = now; hovered = -1; pointerIntent = false
      if (gesture.wheel(now, travel < 0, travel)) requestEntry()
      const previousTarget = target
      target = max ? clamp(target + travel * C.scroll.gain / max, 0, 1) : 0
      if (target !== previousTarget && !arrowDismissed) { arrowDismissed = true; arrow.current.dataset.dismissed = 'true' }
      inputX += clamp(dx || -dy, -120, 120)
      inputY += clamp(dy, -120, 120)
      request()
    }
    function pointer(e) {
      if (e.pointerType === 'mouse') {
        mouse = [e.clientX, e.clientY]; pointerIntent = true
        pointerDX = lastPointer ? e.clientX - lastPointer[0] : 0
        pointerDY = lastPointer ? e.clientY - lastPointer[1] : 0
        clearTimeout(hoverTimer)
        if (performance.now() - lastWheel < C.hover.scrollQuietMs) hoverTimer = setTimeout(request, C.hover.scrollQuietMs)
      }
      if (lastPointer) {
        inputX += clamp(e.clientX - lastPointer[0], -80, 80) * C.motion.pointerGain
        inputY += clamp(e.clientY - lastPointer[1], -80, 80) * C.motion.pointerGain
        request()
      }
      lastPointer = [e.clientX, e.clientY]
      request()
    }
    function leave() { lastPointer = null; mouse = null; pointerIntent = false; hovered = -1; request() }
    function preference() {
      if (reduced.matches) {
        warming=[]
        openingAnimations.forEach(a=>a.cancel());openingAnimations.clear();openingActors.clear()
        for (const i of openingSet) { items.current[i].style.opacity='1';items.current[i].style.transform='none';items.current[i].style.willChange='auto' }
      }
      lastScale = NaN; request()
    }
    const observer = new ResizeObserver(() => { layoutDirty = true; request() })
    observer.observe(host)
    entryHint.current.addEventListener('click', requestEntry)
    host.addEventListener('wheel', wheel, { passive: false })
    host.addEventListener('pointermove', pointer)
    host.addEventListener('pointerleave', leave)
    reduced.addEventListener('change', preference)
    request()
    return () => {
      if (disposed) return
      disposed = true; alive = false; openingAnimations.forEach(a=>a.cancel());openingAnimations.clear();openingActors.clear(); clearTimeout(hoverTimer); cancelAnimationFrame(frame); observer.disconnect(); loader.dispose(); profile.dispose()
      entryHint.current?.removeEventListener('click', requestEntry)
      host.removeEventListener('wheel', wheel)
      host.removeEventListener('pointermove', pointer)
      host.removeEventListener('pointerleave', leave)
      reduced.removeEventListener('change', preference)
    }
  }, [])
  return <main ref={viewport} data-leaving={String(leaving)} aria-busy={disabled} data-entry-state="idle" className="history-viewport" aria-label="人類發展史橫向長圖" style={{ background: C.background, '--arrow-left': `${C.arrow.left}px`, '--arrow-top': C.arrow.top, '--arrow-size': `${C.arrow.size}px`, '--arrow-travel': `${C.arrow.travel}px`, '--arrow-cycle': `${C.arrow.cycleMs}ms`, '--arrow-fade': `${C.arrow.fadeMs}ms`, '--hint-fade': `${C.entryHint.fadeMs}ms` }}>
    <HistoryLabel ref={historyLabel}/>
    <span ref={arrow} className="history-direction" aria-hidden="true">←</span>
    <div ref={world} className="history-world">
      <HistorySquares ref={squares}/>
      <div ref={title} className="history-title" style={{ color: C.title.color }}><HistoryTitle ref={titlePlayback}/><button ref={entryHint} type="button" disabled className="history-entry-hint">Into the World ←</button></div>
      {ASSETS.map((asset, i) => <div key={asset.id} ref={node => { items.current[i] = node }} className="history-item" style={{ zIndex: asset.z, transformOrigin: `${asset.origin[0]}% ${asset.origin[1]}%` }}>
        <div className="history-motion" ref={node => { motionItems.current[i] = node }}><img ref={node => { images.current[i] = node }} alt="" decoding="async" draggable="false" data-asset={asset.id} className={asset.id.startsWith('map') ? 'history-map' : 'history-person'}/></div>
      </div>)}
      <ExtraSquares />
    </div>
    <HistoryProgress />
    <InitialHistoryTitle ref={initialTitle}/>
  </main>
}
