import { useEffect, useRef } from 'react'
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion'
import { CATEGORIES, SELECTOR, WORK_MARKDOWN } from './data'
import { Cover } from './WorkSelector'
import Text from './Text'
import WorkMarkdown from './WorkMarkdown'
import { getSpotifyEmbed } from './spotifyEmbed'
export default function WorkDialog({ work, onClose }) {
  const panel = useRef(null), previous = useRef(null), reduced = useReducedMotion()
  useEffect(() => {
    if (!work) return
    previous.current = document.activeElement
    panel.current?.querySelector('button')?.focus({ preventScroll: true })
    const key = event => {
      if (event.key === 'Escape') onClose()
      if (event.key !== 'Tab') return
      const buttons = [...panel.current.querySelectorAll(work.category === 'music' ? 'button, a, iframe, [tabindex="0"]' : 'button, a, [tabindex="0"]')]
      const first = buttons[0], last = buttons.at(-1)
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus() }
      else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus() }
    }
    window.addEventListener('keydown', key)
    return () => { window.removeEventListener('keydown', key); previous.current?.focus({ preventScroll: true }) }
  }, [work, onClose])
  const spotifyEmbed = work ? getSpotifyEmbed(work.spotifyEmbedUrl) : null
  const musicMarkdown = work?.category === 'music' && work.markdown
    ? WORK_MARKDOWN[work.markdown]
    : null
  const musicSectionsStart = musicMarkdown?.search(/^###\s+/m) ?? -1
  const musicOverview = musicSectionsStart < 0 ? musicMarkdown : musicMarkdown.slice(0, musicSectionsStart)
  const musicSections = musicSectionsStart < 0 ? '' : musicMarkdown.slice(musicSectionsStart)
  const workDescription = work?.markdown
    ? <WorkMarkdown markdown={WORK_MARKDOWN[work.markdown]}/>
    : <div className="ball-work-basic-content"><small>{CATEGORIES.find(category => category.id === work?.category)?.name}</small><h2 id="ball-work-title">{work?.name}</h2><p>{work?.originalTitle}</p>{work?.summary && <p>{work.summary}</p>}{work?.description?.map((text, index) => <p key={index}>{text}</p>)}{work?.recommendation && <section className="ball-reason"><Text as="h3" id="reason">WHY WE LOVE IT</Text><p>{work.recommendation}</p></section>}{work?.illustration && <img src={work.illustration} alt={work.name}/>}</div>
  return <div inert={!work} className="edition-work-modal-host" style={{ pointerEvents: work ? 'auto' : 'none' }}>
    <AnimatePresence>
      {work && <motion.div key={work.id} className="ball-modal" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: reduced ? 0 : SELECTOR.duration }} onClick={event => { if (event.target === event.currentTarget) onClose() }}>
        <motion.section ref={panel} className={`ball-work-dialog${work.category === 'music' ? ' ball-work-dialog--music' : ''}`}  style={{ transformPerspective: 1100, transformOrigin: 'left center' }} role="dialog" aria-modal="true" aria-labelledby="ball-work-title" initial={{ opacity: 0, y: 24, scale: .98, rotateY: reduced ? 0 : -12 }} animate={{ opacity: 1, y: 0, scale: 1, rotateY: 0 }} exit={{ opacity: 0, y: 16, scale: .98, rotateY: reduced ? 0 : 6 }} transition={{ duration: reduced ? 0 : SELECTOR.duration, ease: SELECTOR.easing }}>
          <header><Text id="details">ON OUR SHELF</Text><button onClick={onClose}><Text id="close">CLOSE ×</Text></button></header>
          <div className={`ball-work-scroll${work.markdown || spotifyEmbed ? ' ball-work-scroll--markdown' : ''}`}>
            {work.category !== 'music' && <motion.div key={`art-${work.id}`} className="ball-work-art" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: reduced ? 0 : SELECTOR.duration, ease: SELECTOR.easing }}><Cover work={work} mode="detail"/></motion.div>}
            <motion.div key={`content-${work.id}`} className={work.markdown || spotifyEmbed ? 'ball-work-content-scroll' : undefined} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: reduced ? 0 : SELECTOR.duration, delay: reduced ? 0 : .04, ease: SELECTOR.easing }}>
              {work.category === 'music' ? <>
                <WorkMarkdown markdown={musicOverview}/>
                {work.releaseYear && <div className="ball-music-facts"><p><strong>發行年份</strong>{work.releaseYear}</p></div>}
                {spotifyEmbed && <iframe key={work.id} className="ball-spotify-embed" src={spotifyEmbed.src} title={`${work.name} Spotify 播放器`} width="100%" height={spotifyEmbed.height} loading="lazy" allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture" referrerPolicy="strict-origin-when-cross-origin"/>}
                {musicSections && <WorkMarkdown markdown={musicSections}/>}
              </> : <>
                {(work.artist || work.releaseYear) && <div className="ball-music-facts">{work.artist && <p><strong>歌手</strong>{work.artist}</p>}{work.releaseYear && <p><strong>發行年份</strong>{work.releaseYear}</p>}</div>}
                {workDescription}
                {spotifyEmbed && <iframe key={work.id} className="ball-spotify-embed" src={spotifyEmbed.src} title={`${work.name} Spotify 播放器`} width="100%" height={spotifyEmbed.height} loading="lazy" allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture" referrerPolicy="strict-origin-when-cross-origin"/>}
              </>}
            </motion.div>
          </div>
        </motion.section>
      </motion.div>}
    </AnimatePresence>
  </div>
}
