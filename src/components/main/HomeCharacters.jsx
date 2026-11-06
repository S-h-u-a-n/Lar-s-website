import { useEffect, useRef, useState } from 'react'
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion'
import { loadCharacters } from '../../dev/characters/characters'
import './HomeCharacters.css'

export default function HomeCharacters({ onEnter }) {
  const [characters, setCharacters] = useState([]), [current, setCurrent] = useState(0)
  const [direction, setDirection] = useState(1)
  const reduced = useReducedMotion(), gesture = useRef(null), swipedAt = useRef(0), section = useRef(null)
  useEffect(() => {
    let active = true
    const observer = new IntersectionObserver(entries => {
      if (!entries.some(entry => entry.isIntersecting)) return
      observer.disconnect()
      loadCharacters().then(items => { if (active) setCharacters(items) })
    }, { rootMargin: '400px' })
    observer.observe(section.current)
    return () => { active = false; observer.disconnect() }
  }, [])
  const turn = delta => {
    if (!characters.length) return
    setDirection(Math.sign(delta))
    setCurrent(value => (value + delta + characters.length) % characters.length)
  }
  const cards = characters.length ? Array.from({ length: Math.min(3, characters.length) }, (_, index) => {
    const position = characters.length === 1 ? 0 : index - 1
    return { character: characters[(current + position + characters.length) % characters.length], position }
  }) : []
  return <motion.section ref={section} id="home-characters" className="home-characters" aria-labelledby="home-characters-title" initial={reduced ? false : { opacity: 0, y: 24 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, amount: .15 }} transition={{ duration: .7, ease: [.22, .75, .25, 1] }}>
    <div className="hc-section-label"><span>03 / FELLOW EXPLORERS</span><span>THE PEOPLE BEHIND THE WONDER</span></div>
    <div className="hc-composition">
      <div className="hc-gallery" role="region" aria-roledescription="輪播" aria-label="研究計畫同行者肖像" onKeyDown={event => { if (event.key === 'ArrowLeft' || event.key === 'ArrowRight') { event.preventDefault(); turn(event.key === 'ArrowLeft' ? -1 : 1) } }}>
        <div className="hc-orbit" aria-hidden="true"><i/><i/><span>✧</span><b>COLLECTED WITH CURIOSITY</b></div>
        <div className="hc-cards" onPointerDown={event => { if (event.button === 0) gesture.current = { x: event.clientX, y: event.clientY, id: event.pointerId } }} onPointerUp={event => {
          const start = gesture.current; gesture.current = null
          if (!start || start.id !== event.pointerId) return
          const dx = event.clientX - start.x
          if (Math.abs(dx) > 35 && Math.abs(dx) > Math.abs(event.clientY - start.y)) { swipedAt.current = Date.now(); turn(dx < 0 ? 1 : -1) }
        }} onPointerCancel={() => { gesture.current = null }}>
          <AnimatePresence initial={false} custom={direction}>
            {cards.map(({character, position}) => <motion.button key={character.id} type="button" className="hc-portrait" tabIndex={position === 0 ? 0 : -1} aria-label={position === 0 ? `目前肖像：${character.name}，切換下一位` : position < 0 ? '顯示上一位同行者' : '顯示下一位同行者'} onClick={() => { if (Date.now() - swipedAt.current > 350) turn(position || 1) }} initial={{ x: `${direction * 144 - 50}%`, y: 25, scale: .65, opacity: 0, rotate: direction * 12 }} animate={{ x: `${position * 72 - 50}%`, y: position === 0 ? 0 : 22, scale: position === 0 ? 1 : .8, opacity: position === 0 ? 1 : .72, rotate: position * 9 }} exit={custom => ({ x: `${-custom * 144 - 50}%`, y: 30, scale: .65, opacity: 0, rotate: -custom * 12 })} transition={{ duration: reduced ? 0 : .55, ease: [.22, .75, .25, 1] }} style={{zIndex:position===0?3:2}}>
              <span className="hc-portrait-image"><img src={character.image} alt="" loading="lazy" draggable="false"/></span><span className="hc-caption"><small>FELLOW EXPLORER</small><span>{character.name}</span><i>✦</i></span>
            </motion.button>)}
          </AnimatePresence>
          {!characters.length && <p className="hc-loading" role="status">正在翻閱肖像收藏⋯</p>}
        </div>
        <div className="hc-controls"><button type="button" onClick={() => turn(-1)} disabled={characters.length < 2} aria-label="上一位同行者">←</button><p aria-live="polite" aria-atomic="true"><span>{characters[current]?.name || '肖像收藏'}</span><small>{String(characters.length ? current + 1 : 0).padStart(2,'0')} <i>/</i> {String(characters.length).padStart(2,'0')}</small></p><button type="button" onClick={() => turn(1)} disabled={characters.length < 2} aria-label="下一位同行者">→</button></div>
      </div>
      <div className="hc-copy"><p className="edition-kicker">A LITTLE MAGIC. A SHARED CURIOSITY.</p><h2 id="home-characters-title">角色介紹<em>好奇心，讓我們相遇。</em></h2><p className="hc-description">有人追著星光跑，有人把問題寫滿筆記。<br/>一群魔法師，一個還在繼續的研究計畫。<br/>來認識這些一起觀察世界的同行者，<br/>翻開他們尚在書寫的故事。</p><button type="button" className="edition-enter hc-enter" onClick={onEnter}><span>翻開角色檔案</span><i aria-hidden="true">↗</i></button><p className="hc-postscript"><span aria-hidden="true">✦</span> 一張肖像，一段等待被認識的故事。</p></div>
    </div>
    <div className="hc-bottom-note"><span>PORTRAITS & FIELD NOTES</span><span>一起，把世界看得更近一點。</span></div>
  </motion.section>
}
