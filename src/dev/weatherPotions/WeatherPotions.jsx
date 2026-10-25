import { useEffect, useRef, useState } from 'react'
import useParallax from '../../edition/useParallax'
import { BRUSH_SIZES, POTIONS, RULES, WORLD } from './fallingSand/config'
import { ENDINGS } from './fallingSand/endings'
import { pickWorld } from './fallingSand/terrain'
import { Bottle, WeatherOrbit } from './LineArt'
import EndingCard from './EndingCard'
import useWorld from './useWorld'
import WorldCanvas from './WorldCanvas'

export default function WeatherPotions({ onBack, onHome, onReady } = {}) {
  useParallax()
  const { model, snapshot: world, renderer, start, paint, stop, reset } = useWorld()
  const [selected, setSelected] = useState('rain')
  const [strength, setStrength] = useState(RULES.defaultStrength)
  const [brushSize, setBrushSize] = useState(RULES.defaultBrush)
  const [drag, setDrag] = useState(null), pointer = useRef(null), keyboard = useRef(false)
  const [hints, setHints] = useState(false), [rewinding, setRewinding] = useState(false)
  const canvas = useRef(null), replayButton = useRef(null), rewindTimer = useRef(null), endingKeyHeld = useRef(false)
  const potion = POTIONS.find(p => p.id === selected)
  const ending = ENDINGS.find(e => e.id === world.ending)

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

  const status = world.input ? `${POTIONS.find(p => p.id === world.input).name}正在倒入` : world.ending ? '本輪實驗已結束' : '瓶口已關上'
  return <main className={`wp-page ${onBack ? 'is-integrated' : ''} ${world.input ? 'is-painting' : ''}`} aria-label="Bottled Weather 魔法天氣藥水">
    <header className="edition-header wp-header">
      <a className="edition-wordmark" href="/?edition=main" onClick={event => { if(onHome){event.preventDefault();release();onHome()} }}><span>✧</span><span>The Wizard’s<br /><b>GENESIS</b></span></a>
      <p>CODEX EDITION <i>／</i> 研究手冊</p>
      <nav aria-label="天氣研究頁導覽"><span>06 / 魔法天氣藥水</span>{onBack ? <button type="button" onClick={() => {release();onBack()}}>↙ 回到研究室</button> : <a href="/?edition=main">世界封面 ↗</a>}</nav>
    </header>
    <section className="wp-layout">
      <aside className="wp-introduction">
        <p className="edition-kicker">A SMALL WORLD. A BIG WHAT IF.</p>
        <h1 aria-label="Bottled weather. 魔法天氣藥水"><span>Bottled</span><em>weather.</em><small>魔法天氣藥水</small></h1>
        <p className="wp-lead">把一場天氣，倒進世界裡。</p>
        <p className="wp-description">雨多一點，太陽久一點，<br />或者，乾脆把整座島冷藏。<br />山海會記得你的每一次胡鬧。</p>
        <WeatherOrbit />
        <div className="wp-margin-note"><span>✳</span><p>魔法師的溫馨提醒：<br /><em>「天氣很好」不代表你做得很好。</em></p></div>
        <p className="wp-chapter">FIELD EXPERIMENT / 06<br /><span>本研究不保證明天還有陸地。</span></p>
      </aside>

      <div className="wp-world-column">
        <figure className={`wp-world-plate ${world.input ? 'is-casting' : ''}`} style={{ '--weather-color': potion.color }}>
          <div className="wp-plate-header"><span>PLATE 06 / A WORLD IN YOUR HANDS</span><span className={`wp-live ${world.input ? 'is-active' : ''}`} role="status"><i />{status}</span></div>
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
          <figcaption><span>一座島。七種天氣。先玩一會兒。</span><span>{WORLD.columns} × {WORLD.rows} / PARTICLE WORLD</span></figcaption>
        </figure>
        <div className="wp-world-readings" aria-label="即時世界狀態"><span><small>氣溫</small><b>{world.temperature.toFixed(0)}°</b></span><span><small>陸地留存</small><b>{Math.round((1 - world.metrics.lostLand) * 100)}<i>%</i></b></span><span><small>世界穩定度</small><b>{Math.round((1 - world.metrics.damage) * 100)}<i>%</i></b></span></div>
        <p className="wp-world-instruction"><span>點一下，或按住拖曳，沿途改變天氣。</span><small>放開就停。也可以把瓶子拖進世界，持續倒入。</small></p>
      </div>

      <aside className="wp-research">
        <section className="wp-potion-paper">
          <div className="wp-paper-heading"><span className="edition-kicker">01 / CHOOSE YOUR WEATHER</span><span>↙</span></div>
          <h2>今天，想要什麼天氣？</h2>
          <div className="wp-potions" aria-label="天氣藥水選擇">{POTIONS.map(p => <button type="button" key={p.id} disabled={Boolean(ending) || rewinding} className={selected === p.id ? 'is-selected' : ''} aria-label={`選擇${p.name}藥水`} aria-pressed={selected === p.id} style={{ '--bottle-color': p.color }}
            onClick={() => setSelected(p.id)} onPointerDown={event => beginPointer(event, 'bottle', p.id)} onPointerMove={movePointer} onPointerUp={release} onPointerCancel={release} onLostPointerCapture={release}>
            <small>{p.number}</small><Bottle potion={p} /><strong>{p.name}</strong>
          </button>)}</div>
          <p className="wp-potion-remark" key={selected}><span style={{ background: potion.color }} />{potion.note}</p>
          <div className="wp-brush-size" role="radiogroup" aria-label="筆刷大小"><span>筆刷大小</span><div className="wp-brush-nodes">{BRUSH_SIZES.map((size,index) => <button key={size.id} type="button" role="radio" aria-label={`${size.label}筆刷`} aria-checked={brushSize===size.id} tabIndex={brushSize===size.id?0:-1} disabled={Boolean(ending) || rewinding} onClick={() => {release();setBrushSize(size.id)}} onKeyDown={event => {
            if(!['ArrowLeft','ArrowRight','Home','End'].includes(event.key))return
            event.preventDefault()
            const next=event.key==='Home'?0:event.key==='End'?2:(index+(event.key==='ArrowRight'?1:2))%3
            release();setBrushSize(BRUSH_SIZES[next].id)
            event.currentTarget.parentElement.querySelectorAll('button')[next]?.focus()
          }}><i aria-hidden="true" /><span>{size.label}</span></button>)}</div></div>
          <div className="wp-strength" role="group" aria-label="倒入份量"><span>倒入份量</span>{[[RULES.defaultStrength, '一小口'],[1, '放手一倒']].map(([value,label]) => <button key={value} type="button" disabled={Boolean(ending) || rewinding} aria-pressed={strength===value} onClick={() => setStrength(value)}>{label}</button>)}</div>
          <div className="wp-dose-instruction"><span>∞</span><p>藥水不限量，世界不一定。<small>聚焦世界後，可按住空白鍵施法。</small></p></div>
        </section>

        <section className="wp-notebook" aria-labelledby="wp-notebook-title">
          <div className="wp-paper-heading"><span className="edition-kicker">02 / FIELD NOTES</span><span>✎</span></div><h2 id="wp-notebook-title">觀察筆記</h2>
          <div className="wp-note-dots" aria-hidden="true" />
          <div className="wp-observations" aria-live="polite">{world.observations.length ? world.observations.slice(0, 3).map(note => <article key={note.id}><span>↳</span><div><h3>{note.title}</h3><p>{note.text}</p></div></article>) : <div className="wp-empty-note"><span>一切正常。</span><p>通常，這是事故發生前的最後一句。</p><i>— 研究室的前輩</i></div>}</div>
          <button type="button" className="wp-possibilities" aria-expanded={hints} aria-controls="wp-ending-hints" onClick={() => setHints(!hints)}>偶爾會發生的小事故<span>{hints ? '−' : '＋'}</span></button>
          {hints && <div className="wp-ending-hints" id="wp-ending-hints">{ENDINGS.map(e => <p key={e.id}><b>{e.number} / {e.title}</b><span>{e.cause}</span></p>)}</div>}
        </section>
        <button type="button" className="wp-rewind-link" disabled={rewinding} onClick={rewind}>↶ 回溯這個世界<span>重新開始</span></button>
      </aside>
    </section>
    <footer className="wp-footer"><span>MADE BETWEEN WORLDS</span><p>以好奇心為指南，偶爾也以後悔為指南。</p><details className="wp-debug"><summary>開發觀測 ＋</summary><dl><div><dt>模擬秒數</dt><dd>{world.time.toFixed(1)}</dd></div><div><dt>光照</dt><dd>{world.light.toFixed(0)}%</dd></div><div><dt>蒸發轉換</dt><dd>{world.evaporated}</dd></div><div><dt>輸入</dt><dd>{world.input || '已停止'}</dd></div><div><dt>藥水雨滴</dt><dd>{world.rainAdded}</dd></div><div><dt>藥水雪粒</dt><dd>{world.snowAdded}</dd></div><div><dt>流體與雪粒</dt><dd>{world.particles}</dd></div><div><dt>海面高度 %</dt><dd>{world.seaLevel.toFixed(1)}</dd></div><div><dt>海面上升速率</dt><dd>{world.riseRate.toFixed(2)}</dd></div><div><dt>乾燥程度</dt><dd>{((1 - world.metrics.moisture) * 100).toFixed(0)}%</dd></div><div><dt>地層侵蝕</dt><dd>{(world.metrics.erosion*100).toFixed(0)}%</dd></div><div><dt>水體結冰</dt><dd>{(world.metrics.ice * 100).toFixed(0)}%</dd></div><div><dt>地表雪覆</dt><dd>{(world.metrics.snow * 100).toFixed(0)}%</dd></div><div><dt>沙漠化</dt><dd>{(world.metrics.desert * 100).toFixed(0)}%</dd></div><div><dt>風勢</dt><dd>{(world.wind*100).toFixed(0)}%</dd></div><div><dt>雲量</dt><dd>{(world.cloudiness*100).toFixed(0)}%</dd></div><div><dt>暴風雨</dt><dd>{(world.storm*100).toFixed(0)}%</dd></div><div><dt>彩虹</dt><dd>{(world.rainbow*100).toFixed(0)}%</dd></div><div><dt>岩漿粒數</dt><dd>{world.lavaAdded}</dd></div><div><dt>岩漿蒸氣</dt><dd>{world.steamCreated}</dd></div><div><dt>冷卻岩石</dt><dd>{world.basaltCreated.toFixed(1)}</dd></div><div><dt>水／冰／雪</dt><dd>{world.counts[3]} / {world.counts[5]} / {world.counts[4]}</dd></div><div><dt>蒸氣／雲</dt><dd>{world.counts[7]} / {world.counts[8]}</dd></div><div><dt>凝結／自然降水</dt><dd>{world.condensed} / {world.naturalRain}</dd></div></dl></details></footer>

    {drag && <div className={`wp-drag-bottle ${drag.over ? 'is-pouring' : ''}`} style={{ left: drag.x, top: drag.y }} aria-hidden="true"><Bottle potion={POTIONS.find(p => p.id === drag.type)} pouring={drag.over} /></div>}
  </main>
}
