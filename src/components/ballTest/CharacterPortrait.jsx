import { useEffect, useId, useMemo, useRef, useState, useSyncExternalStore } from 'react'
import { CHARACTER_ASSETS, characterAssetState, characterDecoration } from './characterAssets'
import { characterImages } from './decodedImages'
import { flushSync } from 'react-dom'
import { createPortraitTransitions } from './portraitTransitions'

const reducedMotionQuery = '(prefers-reduced-motion: reduce)'
const subscribeMotion = listener => {
  const preference = window.matchMedia(reducedMotionQuery)
  preference.addEventListener('change', listener)
  return () => preference.removeEventListener('change', listener)
}
const getReducedMotion = () => window.matchMedia(reducedMotionQuery).matches

// Reusable sprite composition. Body and optimized face always share body-space coordinates.
export default function CharacterPortrait({ character, body = character.defaultBody, face = character.defaultFace, talking = false, transition = 0, cueKey = 0 }) {
  const requested = useMemo(() => characterAssetState(character.id, body, face), [character.id, body, face])
  const currentLayer = useRef(null), previousLayer = useRef(null)
  const componentLayer = useRef(null), flashLayer = useRef(null)
  const [presentation, setPresentation] = useState({ current: null, previous: null })
  const [status, setStatus] = useState('loading'), [retry, setRetry] = useState(0)
  const displayed = presentation.current
  const transitions = useMemo(() => createPortraitTransitions({
    load: characterImages.load,
    paint: (current, previous) => flushSync(() => setPresentation({ current, previous })),
    animate: (layer, frames, options) => ({ current: currentLayer, previous: previousLayer, component: componentLayer, flash: flashLayer })[layer].current.animate(frames, options),
    onStatus: setStatus,
    // Whole-component transforms use CSS pixels, not the source image's units.
    distance: 5,
  }), [character.id])
  useEffect(() => {
    let active = true
    // React commits the SVG synchronously for each animation; leave the effect
    // lifecycle before doing so, and ignore StrictMode's discarded mount.
    queueMicrotask(() => { if (active) transitions.request(requested, transition) })
    return () => { active = false; transitions.cancel(false) }
  }, [transitions, requested, transition, cueKey, retry])
  return <div className={`ball-portrait ball-portrait-${character.side}`} data-character={character.id} data-load-state={status} data-body={displayed?.body} data-face={displayed?.face} data-talking={talking} data-transition={transition}>
    <div className="ball-portrait-float"><CharacterScene character={character} displayed={displayed} previous={presentation.previous} currentRef={currentLayer} previousRef={previousLayer} componentRef={componentLayer} flashRef={flashLayer}/></div>
    {!displayed && status === 'loading' && <span className="ball-portrait-status" role="status">載入{character.name}立繪…</span>}
    {status === 'error' && <button className="ball-portrait-retry" type="button" onClick={() => setRetry(value => value + 1)}>重新載入{character.name}立繪</button>}
  </div>
}

export function CharacterScene({ character, displayed, previous = null, currentRef, previousRef, componentRef, flashRef }) {
  const reducedMotion = useSyncExternalStore(subscribeMotion, getReducedMotion, () => true)
  const spec = CHARACTER_ASSETS[character.id], decoration = characterDecoration(character.id)
  const uid = useId().replace(/:/g, ''), mask = `ball-mask-${uid}`, outline = `ball-outline-${uid}`, shadow = `ball-shadow-${uid}`
  const { width, height, transform, outlineRadius } = character.framing
  return <div className="ball-portrait-component" ref={componentRef}><svg className="ball-portrait-scene" viewBox={`0 0 ${width} ${height}`} role="img" aria-label={`${character.name}角色立繪`} preserveAspectRatio="xMidYMid meet">
      <defs>
        <filter id={shadow} filterUnits="userSpaceOnUse" x="-160" y="-160" width={width + 320} height={height + 380} colorInterpolationFilters="sRGB">
          <feGaussianBlur in="SourceAlpha" stdDeviation="24" result="softAlpha"/>
          <feOffset in="softAlpha" dx="10" dy="30" result="loweredAlpha"/>
          <feFlood floodColor="#34465a" floodOpacity="0.18" result="shadowInk"/>
          <feComposite in="shadowInk" in2="loweredAlpha" operator="in"/>
        </filter>
        <mask id={mask} x="0" y="0" width={width} height={height} maskUnits="userSpaceOnUse" style={{ maskType: 'alpha' }}>
          <image href={decoration.background} width={width} height={height}/>
        </mask>
        <filter id={outline} filterUnits="userSpaceOnUse" x="-80" y="-80" width={spec.body.width + 160} height={spec.body.height + 160} colorInterpolationFilters="sRGB">
          <feMorphology in="SourceAlpha" operator="dilate" radius={outlineRadius} result="expanded"/>
          <feFlood floodColor="#fff" result="white"/>
          <feComposite in="white" in2="expanded" operator="in" result="sticker"/>
          <feMerge><feMergeNode in="sticker"/><feMergeNode in="SourceGraphic"/></feMerge>
        </filter>

      </defs>
      {/* Only the backing alpha casts the floating shadow, behind every visible layer. */}
      <image className="ball-portrait-shadow" href={decoration.background} width={width} height={height} filter={`url(#${shadow})`} aria-hidden="true"/>
      <g className="ball-portrait-content" mask={`url(#${mask})`}>
        <image className="ball-portrait-backing" href={decoration.background} width={width} height={height}/>
        {/* Move actual geometry, rather than a cached pattern paint server inside the mask. */}
        <g className={`ball-portrait-pattern ball-portrait-pattern-${character.id}`} fill="#fff">
          {!reducedMotion && <animateTransform attributeName="transform" type="translate" from="0 0" to={character.id === 'lar' ? '160 160' : '103.24376 147.44737'} dur={character.id === 'lar' ? '27s' : '22s'} repeatCount="indefinite"/>}
          {character.id === 'lar'
            ? Array.from({ length: Math.ceil(height / 160) + 3 }, (_, row) =>
                Array.from({ length: Math.ceil(width / 160) + 3 }, (_, column) =>
                  <g key={`${row}-${column}`}><circle cx={(column - 2) * 160 + 40} cy={(row - 2) * 160 + 40} r="20"/><circle cx={(column - 2) * 160 + 120} cy={(row - 2) * 160 + 120} r="20"/></g>))
            : <g transform="rotate(55)">{Array.from({ length: Math.ceil((width + height) / 180) + 4 }, (_, index) => <rect key={index} x={(index - 2) * 180} y={-width - 360} width="60" height={width + height + 720}/>)}</g>}
        </g>
        {displayed && <g className="ball-portrait-person" transform={transform}>
          {previous && <g className="ball-portrait-transition" ref={previousRef} aria-hidden="true">
            <g filter={`url(#${outline})`}>
              <image data-layer="body" href={previous.bodyUrl} width={spec.body.width} height={spec.body.height}/>
              <image data-layer="face" href={previous.faceUrl} x={spec.face.bodyPosition.x} y={spec.face.bodyPosition.y} width={spec.face.width} height={spec.face.height}/>
            </g>
          </g>}
          <g className="ball-portrait-transition" ref={currentRef}>
            <g filter={`url(#${outline})`}>
              <image data-layer="body" href={displayed.bodyUrl} width={spec.body.width} height={spec.body.height}/>
              <image data-layer="face" href={displayed.faceUrl} x={spec.face.bodyPosition.x} y={spec.face.bodyPosition.y} width={spec.face.width} height={spec.face.height}/>
            </g>
          </g>
        </g>}
        <rect ref={flashRef} className="ball-portrait-flash" width={width} height={height} fill="#fffdf9" opacity="0" aria-hidden="true"/>
      </g>
      <image className="ball-portrait-frame" href={decoration.frame} width={width} height={height}/>
    </svg></div>
}
