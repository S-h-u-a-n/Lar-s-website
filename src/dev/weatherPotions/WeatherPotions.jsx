import { useEffect, useRef, useState } from 'react'
import { AnimatePresence } from 'framer-motion'
import WeatherLetter from '../../components/weather/WeatherLetter'
import { hasSeenWeatherLetter } from '../../components/weather/letterSession'
import useParallax from '../../edition/useParallax'
import { BRUSH_SIZES, POTIONS, RULES, WORLD } from './fallingSand/config'
import { ENDINGS } from './fallingSand/endings'
import { pickWorld } from './fallingSand/terrain'
import { Bottle, WeatherIllustration } from './LineArt'
import EndingCard from './EndingCard'
import useWorld from './useWorld'
import WorldCanvas from './WorldCanvas'

export default function WeatherPotions({ onBack, onHome, onReady } = {}) {
  useParallax()
  const { model, snapshot: world, renderer, start, paint, stop, reset } = useWorld()
  const [selected, setSelected] = useState('rain')
  const [letterOpen, setLetterOpen] = useState(() => !hasSeenWeatherLetter())
  const letterButton = useRef(null)
  const strength = RULES.defaultStrength
  const [brushSize, setBrushSize] = useState(RULES.defaultBrush)
  const [drag, setDrag] = useState(null), pointer = useRef(null), keyboard = useRef(false)
  const [hints, setHints] = useState(false), [rewinding, setRewinding] = useState(false)
  const canvas = useRef(null), replayButton = useRef(null), rewindTimer = useRef(null), endingKeyHeld = useRef(false)
  const worldPlate = useRef(null), worldFrame = useRef(null)
  const debugPanel = useRef(null)
  const potion = POTIONS.find(p => p.id === selected)
  const ending = ENDINGS.find(e => e.id === world.ending)

  useEffect(() => {
    const plate = worldPlate.current
    const frame = worldFrame.current
    if (!plate || !frame) return undefined

    const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)')
    let targetX = 0, targetY = 0, currentX = 0, currentY = 0
    let animationFrame = 0, previousTime = 0, pressed = false

    const setTilt = (x, y) => {
      if (reducedMotion.matches) return
      const bounds = plate.getBoundingClientRect()
      if (x < bounds.left || x > bounds.right || y < bounds.top || y > bounds.bottom) {
        targetX = 0
        targetY = 0
        schedule()
        return
      }
      const normalizedX = (x - bounds.left) / bounds.width * 2 - 1
      const normalizedY = (y - bounds.top) / bounds.height * 2 - 1
      const magnitude = Math.hypot(normalizedX, normalizedY) || 1
      const strength = Math.min(1, 1 / magnitude) * 1.5
      targetX = -normalizedY * strength
      targetY = normalizedX * strength
      schedule()
    }

    const animate = time => {
      const elapsed = previousTime ? Math.min(time - previousTime, 64) : 16
      previousTime = time
      const returning = targetX === 0 && targetY === 0
      const follow = 1 - Math.exp(-elapsed / (returning ? 520 : 180))
      currentX += (targetX - currentX) * follow
      currentY += (targetY - currentY) * follow
      frame.style.setProperty('--tilt-x', `${currentX.toFixed(3)}deg`)
      frame.style.setProperty('--tilt-y', `${currentY.toFixed(3)}deg`)

      if (Math.abs(targetX - currentX) + Math.abs(targetY - currentY) > 0.002) {
        animationFrame = requestAnimationFrame(animate)
      } else {
        currentX = targetX
        currentY = targetY
        frame.style.setProperty('--tilt-x', `${currentX.toFixed(3)}deg`)
        frame.style.setProperty('--tilt-y', `${currentY.toFixed(3)}deg`)
        animationFrame = 0
        previousTime = 0
      }
    }

    function schedule() {
      if (!animationFrame && !reducedMotion.matches) animationFrame = requestAnimationFrame(animate)
    }

    const handlePointerMove = event => {
      if (event.pointerType === 'touch') return
      setTilt(event.clientX, event.clientY)
    }
    const handlePointerLeave = () => {
      targetX = 0
      targetY = 0
      if (pressed) {
        pressed = false
        frame.style.setProperty('--press-scale', '1')
      }
      schedule()
    }
    const handlePointerDown = event => {
      if (event.target !== canvas.current || event.button !== 0 || !event.isPrimary) return
      pressed = true
      frame.style.setProperty('--press-scale', '0.997')
    }
    const handlePointerUp = () => {
      if (!pressed) return
      pressed = false
      frame.style.setProperty('--press-scale', '1')
    }
    const handleMotionPreference = () => {
      if (reducedMotion.matches) {
        targetX = currentX = 0
        targetY = currentY = 0
        if (animationFrame) cancelAnimationFrame(animationFrame)
        animationFrame = 0
        frame.style.setProperty('--tilt-x', '0deg')
        frame.style.setProperty('--tilt-y', '0deg')
      }
    }

    plate.addEventListener('pointermove', handlePointerMove, { passive: true })
    plate.addEventListener('pointerleave', handlePointerLeave)
    plate.addEventListener('pointerdown', handlePointerDown)
    plate.addEventListener('pointerup', handlePointerUp)
    plate.addEventListener('pointercancel', handlePointerUp)
    plate.addEventListener('lostpointercapture', handlePointerUp)
    window.addEventListener('blur', handlePointerLeave)
    reducedMotion.addEventListener('change', handleMotionPreference)

    return () => {
      if (animationFrame) cancelAnimationFrame(animationFrame)
      plate.removeEventListener('pointermove', handlePointerMove)
      plate.removeEventListener('pointerleave', handlePointerLeave)
      plate.removeEventListener('pointerdown', handlePointerDown)
      plate.removeEventListener('pointerup', handlePointerUp)
      plate.removeEventListener('pointercancel', handlePointerUp)
      plate.removeEventListener('lostpointercapture', handlePointerUp)
      window.removeEventListener('blur', handlePointerLeave)
      reducedMotion.removeEventListener('change', handleMotionPreference)
    }
  }, [])

  function location(event) {
    const rect = canvas.current?.getBoundingClientRect()
    if (!rect || event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom) return null
    return pickWorld(model.current, { x: (event.clientX - rect.left) / rect.width * WORLD.width, y: (event.clientY - rect.top) / rect.height * WORLD.height })
  }
  function beginPointer(event, source, type = selected) {
    if (world.ending || rewinding || !event.isPrimary || event.button !== 0) return
    event.preventDefault()
    event.currentTarget.focus({ preventScroll: true })
    event.currentTarget.setPointerCapture(event.pointerId)
    const spot = location(event)
    setSelected(type)
    pointer.current = { id: event.pointerId, source, type, last: spot, brushSize, strength }
    if (source === 'bottle') setDrag({ type, x: event.clientX, y: event.clientY, over: Boolean(spot) })
    if (spot) { paint(type,null,spot,strength,true,brushSize);start(type,{...spot,mode:'brush',brushSize},strength) }
  }
  function movePointer(event) {
    const active = pointer.current
    if (active?.id !== event.pointerId) return
    event.preventDefault()
    const samples=event.nativeEvent?.getCoalescedEvents?.() || []
    for(const sample of samples.length?samples:[event]) {
      const spot=location(sample)
      if(spot) {
        paint(active.type,active.last,spot,active.strength,!active.last,active.brushSize)
        start(active.type,{...spot,mode:'brush',brushSize:active.brushSize},active.strength)
      } else if(active.last) stop()
      active.last=spot
    }
    if(active.source==='bottle')setDrag({type:active.type,x:event.clientX,y:event.clientY,over:Boolean(active.last)})
  }
  function release(event) {
    if (event?.pointerId !== undefined && pointer.current?.id !== event.pointerId) return
    if(event?.type==='pointerup' && pointer.current) {
      const spot=location(event),active=pointer.current
      if(spot && (!active.last || Math.hypot(spot.x-active.last.x,spot.y-active.last.y)>=1))paint(active.type,active.last,spot,active.strength,!active.last,active.brushSize)
    }
    pointer.current = null; keyboard.current = false; setDrag(null); stop()
  }
  function rewind() {
    release()
    setRewinding(true)
    reset()
    clearTimeout(rewindTimer.current)
    rewindTimer.current = setTimeout(() => {
      setRewinding(false)
      canvas.current?.focus({ preventScroll: true })
    }, matchMedia('(prefers-reduced-motion: reduce)').matches ? 40 : 820)
  }
  useEffect(() => {
    const cancel = () => { pointer.current = null; keyboard.current = false; setDrag(null); stop() }
    const visibility = () => { if (document.hidden) cancel() }
    const key = event => { if (event.key === 'Escape') cancel() }
    window.addEventListener('blur', cancel); document.addEventListener('visibilitychange', visibility); window.addEventListener('keydown', key)
    return () => { clearTimeout(rewindTimer.current); window.removeEventListener('blur', cancel); document.removeEventListener('visibilitychange', visibility); window.removeEventListener('keydown', key) }
  }, [stop])
  useEffect(() => {
    if (!world.ending) return
    endingKeyHeld.current = keyboard.current
    pointer.current = null; keyboard.current = false; setDrag(null)
    replayButton.current?.focus({ preventScroll: true })
    const trap = event => {
      if (endingKeyHeld.current && (event.key === ' ' || event.key === 'Enter')) { event.preventDefault(); event.stopPropagation() }
    }
    const releaseKey = event => {
      if (endingKeyHeld.current && (event.key === ' ' || event.key === 'Enter')) { event.preventDefault(); event.stopPropagation(); endingKeyHeld.current = false }
    }
    window.addEventListener('keydown', trap, true); window.addEventListener('keyup', releaseKey, true)
    return () => { window.removeEventListener('keydown', trap, true); window.removeEventListener('keyup', releaseKey, true) }
  }, [world.ending])

  useEffect(() => {
    const closeOutside = event => {
      const panel = debugPanel.current
      if (panel?.open && !panel.contains(event.target)) panel.open = false
    }
    // Capture observes outside actions before a canvas/button captures the
    // pointer. Never cancel the event: the clicked control still operates.
    document.addEventListener('pointerdown', closeOutside, true)
    document.addEventListener('click', closeOutside, true)
    return () => {
      document.removeEventListener('pointerdown', closeOutside, true)
      document.removeEventListener('click', closeOutside, true)
    }
  }, [])

  const status = world.input ? `${POTIONS.find(p => p.id === world.input).name}正在倒入` : world.ending ? '本輪實驗已結束' : '瓶口已關上'
  return <main className={`wp-page ${onBack ? 'is-integrated' : ''} ${world.input ? 'is-painting' : ''}`} aria-label="Bottled Weather 魔法天氣藥水">
    <header className="edition-header wp-header">
      {onBack
        ? <nav className="wp-back-nav" aria-label="天氣研究頁導覽"><button type="button" onClick={() => {release();onBack()}}>BACK</button></nav>
        : <a className="edition-wordmark" href="/?edition=main" onClick={event => { if(onHome){event.preventDefault();release();onHome()} }}><span>✧</span><span data-dev-text-dynamic>The Wizard’s<br /><b>GENESIS</b></span></a>}
      <p>CODEX EDITION <i>／</i> 研究手冊</p>
      {!onBack && <nav aria-label="天氣研究頁導覽"><span>06 / 魔法天氣藥水</span><a href="/?edition=main">世界封面 ↗</a></nav>}
    </header>
    <section className="wp-layout">
      <aside className="wp-introduction">
        <p className="edition-kicker">WEATHER EXPERIMENT / 06</p>
        <h1 aria-label="Bottled weather. 魔法天氣藥水"><span>Bottled</span><em>weather.</em><small>魔法天氣藥水</small></h1>
        <p className="wp-lead">試著用不同的藥水，改變眼前的世界吧！</p>
        <p className="wp-description">不同的藥水會對環境產生不同影響。可以自由組合，也可以觀察地形與氣候的變化。</p>
        <WeatherIllustration />
        <div className="wp-margin-note"><span>✳</span><p>因為是生態箱不是地球<br />所以盡情使用也沒有關係的喔！（？）</p></div>
        <button ref={letterButton} type="button" className="wp-letter-reopen" aria-haspopup="dialog" title="重新閱讀「不知道多久以前的信件」" onClick={() => { release(); setLetterOpen(true) }}><span aria-hidden="true">✉</span>重讀信件</button>
        <p className="wp-chapter">FIELD EXPERIMENT / 06<br /><span>所有氣候變化皆為模擬實驗結果。</span></p>
      </aside>

      <div className="wp-world-column">
        <figure ref={worldPlate} className={`wp-world-plate ${world.input ? 'is-casting' : ''}`} style={{ '--weather-color': potion.color }}>
          <div ref={worldFrame} className="wp-world-frame" aria-hidden="true" />
          <div className="wp-plate-header"><span>EXPERIMENT 06 / WEATHER SIMULATION</span><span className={`wp-live ${world.input ? 'is-active' : ''}`} role="status"><i />{status}</span></div>
          <div className="wp-map-grid" aria-hidden="true" />
          <div className={`wp-world-stage ${ending ? 'has-ending' : ''}`}>
          <div className="wp-world-background" inert={Boolean(ending) || rewinding}>
          <WorldCanvas ref={canvas} model={model} renderer={renderer} onReady={onReady} onDragStart={event => event.preventDefault()} onPointerDown={event => beginPointer(event, 'world')} onPointerMove={movePointer} onPointerUp={release} onPointerCancel={release} onLostPointerCapture={release}
            onKeyDown={event => {
              if ((event.key === ' ' || event.key === 'Enter') && !event.repeat && !keyboard.current && !world.ending && !rewinding) { event.preventDefault(); keyboard.current = true; start(selected, { x: WORLD.columns / 2, y: WORLD.rows * .28, brushSize }, strength) }
              else if (event.key === ' ' || event.key === 'Enter') event.preventDefault()
            }} onKeyUp={event => { if (event.key === ' ' || event.key === 'Enter') { event.preventDefault(); release() } }} onBlur={() => { if (keyboard.current) release() }} />
          </div>
          {ending && <EndingCard ending={ending} replayRef={replayButton} onRewind={rewind} />}
          {rewinding && <div className="wp-rewind-magic" aria-hidden="true"><i /><i /><i /><span>↶</span><small>REWINDING THE WORLD</small></div>}
          </div>
          <div className="wp-compass" aria-hidden="true"><span>N</span><i>✧</i></div>
          <figcaption><span>使用右側的藥水，在島嶼上進行實驗。</span><span>{WORLD.columns} × {WORLD.rows} / PARTICLE WORLD</span></figcaption>
        </figure>
        <div className="wp-world-readings" aria-label="即時世界狀態"><span><small>氣溫</small><b>{world.temperature.toFixed(0)}°</b></span><span><small>陸地留存</small><b>{Math.round((1 - world.metrics.permanentLandLoss) * 100)}<i>%</i></b></span><span><small>世界穩定度</small><b>{Math.round((1 - world.metrics.damage) * 100)}<i>%</i></b></span></div>
      </div>

      <aside className="wp-research">
        <section className="wp-potion-paper">
          <div className="wp-paper-heading"><span className="edition-kicker">01 / CHOOSE YOUR WEATHER</span><span>↙</span></div>
          <h2>選擇實驗藥水</h2>
          <div className="wp-potions" aria-label="天氣藥水選擇">{POTIONS.map(p => <button type="button" key={p.id} disabled={Boolean(ending) || rewinding} className={selected === p.id ? 'is-selected' : ''} aria-label={`選擇${p.name}藥水`} aria-pressed={selected === p.id} style={{ '--bottle-color': p.color }}
            onClick={() => setSelected(p.id)} onPointerDown={event => beginPointer(event, 'bottle', p.id)} onPointerMove={movePointer} onPointerUp={release} onPointerCancel={release} onLostPointerCapture={release}>
            <small>{p.number}</small><Bottle potion={p} /><strong>{p.name}</strong>
          </button>)}</div>
          {typeof potion?.note === 'string' && potion.note.trim() !== '' && <p className="wp-potion-remark" key={`${selected}:${potion.note}`}><span style={{ background: potion.color }} />{potion.note}</p>}
          <div className="wp-brush-size" role="radiogroup" aria-label="筆刷大小"><span>筆刷大小</span><div className="wp-brush-nodes">{BRUSH_SIZES.map((size,index) => <button key={size.id} type="button" role="radio" aria-label={`${size.label}筆刷`} aria-checked={brushSize===size.id} tabIndex={brushSize===size.id?0:-1} disabled={Boolean(ending) || rewinding} onClick={() => {release();setBrushSize(size.id)}} onKeyDown={event => {
            if(!['ArrowLeft','ArrowRight','Home','End'].includes(event.key))return
            event.preventDefault()
            const next=event.key==='Home'?0:event.key==='End'?2:(index+(event.key==='ArrowRight'?1:2))%3
            release();setBrushSize(BRUSH_SIZES[next].id)
            event.currentTarget.parentElement.querySelectorAll('button')[next]?.focus()
          }}><i aria-hidden="true" /><span>{size.label}</span></button>)}</div></div>
        </section>

        <div className="wp-lower-controls">
          <button type="button" className="wp-rewind-link" disabled={rewinding} onClick={rewind}>↶ 重置世界</button>
          <button type="button" className="wp-possibilities" aria-expanded={hints} aria-controls="wp-ending-hints" onClick={() => setHints(!hints)}>偶爾會發生的小事故<span>{hints ? '−' : '＋'}</span></button>
          {hints && <div className="wp-ending-hints" id="wp-ending-hints">{ENDINGS.map(e => <p key={e.id}><b>{e.number} / {e.title}</b><span>{e.cause}</span></p>)}</div>}
        </div>
      </aside>
    </section>
    <footer className="wp-footer"><span>MADE BETWEEN WORLDS</span><details className="wp-debug" ref={debugPanel}><summary>開發觀測 ＋</summary><dl>
      <div><dt>模擬秒數</dt><dd>{world.time.toFixed(1)}</dd></div>
      <div><dt>光照</dt><dd>{world.light.toFixed(0)}%</dd></div>
      <div><dt>蒸發轉換</dt><dd>{world.evaporated}</dd></div>
      <div><dt>輸入</dt><dd>{world.input || '已停止'}</dd></div>
      <div><dt>藥水雨滴</dt><dd>{world.rainAdded}</dd></div>
      <div><dt>藥水雪粒</dt><dd>{world.snowAdded}</dd></div>
      <div><dt>流體與雪粒</dt><dd>{world.particles}</dd></div>
      <div><dt>海面高度 %</dt><dd>{world.seaLevel.toFixed(1)}</dd></div>
      <div><dt>海面上升速率</dt><dd>{world.riseRate.toFixed(2)}</dd></div>
      <div><dt>陸地淹沒</dt><dd>{(world.metrics.floodedLand * 100).toFixed(0)}%</dd></div>
      <div><dt>永久地形損失</dt><dd>{(world.metrics.permanentLandLoss * 100).toFixed(0)}%</dd></div>
      <div><dt>乾燥程度</dt><dd>{((1 - world.metrics.moisture) * 100).toFixed(0)}%</dd></div>
      <div><dt>地層侵蝕</dt><dd>{(world.metrics.erosion * 100).toFixed(0)}%</dd></div>
      <div><dt>水體結冰</dt><dd>{(world.metrics.ice * 100).toFixed(0)}%</dd></div>
      <div><dt>地表雪覆</dt><dd>{(world.metrics.snow * 100).toFixed(0)}%</dd></div>
      <div><dt>沙漠化</dt><dd>{(world.metrics.desert * 100).toFixed(0)}%</dd></div>
      <div><dt>風勢</dt><dd>{(world.wind * 100).toFixed(0)}%</dd></div>
      <div><dt>雲量</dt><dd>{(world.cloudiness * 100).toFixed(0)}%</dd></div>
      <div><dt>暴風雨</dt><dd>{(world.storm * 100).toFixed(0)}%</dd></div>
      <div><dt>彩虹</dt><dd>{(world.rainbow * 100).toFixed(0)}%</dd></div>
      <div><dt>岩漿粒數</dt><dd>{world.lavaAdded}</dd></div>
      <div><dt>岩漿蒸氣</dt><dd>{world.steamCreated}</dd></div>
      <div><dt>冷卻岩石</dt><dd>{world.basaltCreated.toFixed(1)}</dd></div>
      <div><dt>生長粒子／遇水消耗</dt><dd>{world.counts[11]} / {world.growthConsumed}</dd></div>
      <div><dt>砂粒／植物</dt><dd>{world.counts[9]} / {world.counts[10]}</dd></div>
      <div><dt>投入砂粒／培育植物</dt><dd>{world.sandAdded} / {world.plantsSeeded}</dd></div>
      <div><dt>植物生長／枯萎</dt><dd>{world.plantsGrown} / {world.plantsWilted}</dd></div>
      <div><dt>水／冰／雪</dt><dd>{world.counts[3]} / {world.counts[5]} / {world.counts[4]}</dd></div>
      <div><dt>蒸氣／雲</dt><dd>{world.counts[7]} / {world.counts[8]}</dd></div>
      <div><dt>凝結／自然降水</dt><dd>{world.condensed} / {world.naturalRain}</dd></div>
    </dl></details>
      <section className="wp-technical-references" aria-labelledby="wp-technical-references-title">
        <h2 id="wp-technical-references-title">技術參考 / TECHNICAL REFERENCES</h2>
        <p>Falling Sand 模擬機制參考 Sandspiel<br />Created by Max Bittker · MIT License · © 2018</p>
        <p>GitHub: <a href="https://github.com/MaxBittker/sandspiel" target="_blank" rel="noopener noreferrer">https://github.com/MaxBittker/sandspiel</a></p>
      </section>
    </footer>

    <AnimatePresence>{letterOpen && <WeatherLetter key="weather-letter" onClose={() => setLetterOpen(false)} returnFocus={letterButton} />}</AnimatePresence>
    {drag && <div className={`wp-drag-bottle ${drag.over ? 'is-pouring' : ''}`} style={{ left: drag.x, top: drag.y }} aria-hidden="true"><Bottle potion={POTIONS.find(p => p.id === drag.type)} pouring={drag.over} /></div>}
  </main>
}
