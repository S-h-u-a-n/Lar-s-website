import { useEffect, useRef } from 'react'
import { motion, useReducedMotion } from 'framer-motion'
import orbisEmblem from '../../../Art/Big/Big-letter/orbis.PNG'

const text = value => value || '待補錄'
const list = value => Array.isArray(value) ? value.filter(Boolean).join('、') : value

export default function CharacterFile({ character, characters, onSelect, onClose }) {
  const dialog = useRef(null), close = useRef(null)
  const reduced = useReducedMotion(), index = characters.findIndex(item => item.id === character.id)
  useEffect(() => {
    dialog.current.showModal()
    close.current.focus({ preventScroll: true })
    const element = dialog.current
    return () => { element.close() }
  }, [])
  return <dialog ref={dialog} className="cw-file" aria-labelledby="cw-file-name" onCancel={event => { event.preventDefault(); onClose() }} onClick={event => { if (event.target === event.currentTarget) onClose() }}>
    <div className="cw-file-paper">
      <header className="cw-file-header"><span>GENESIS / PERSONNEL ARCHIVE</span><button ref={close} onClick={onClose} className="cw-close" aria-label="關閉角色檔案">收起檔案 <span>×</span></button></header>
      <div className="cw-file-scroll" key={character.id}>
        <div className="cw-file-visual">
          <span className="cw-file-tab">研究室成員檔案</span>
          <div className="cw-orbit" aria-hidden="true"><i/><i/><span>✧</span></div>
          <motion.figure initial={{ opacity: 0, y: reduced ? 0 : 18, rotate: reduced ? 0 : -5 }} animate={{ opacity: 1, y: 0, rotate: reduced ? 0 : -2 }} transition={{ duration: reduced ? 0 : .45, ease: [.22, 1, .36, 1] }}>
            <img src={character.image} alt={character.name} />
            <figcaption><span>PORTRAIT STUDY</span><span>✦</span></figcaption>
          </motion.figure>
          <div className="cw-file-seal" aria-hidden="true"><span className="cw-file-emblem" style={{ maskImage: `url(${orbisEmblem})`, WebkitMaskImage: `url(${orbisEmblem})` }}/></div>
          <p className="cw-visual-note">A Collection of Curious Minds.</p>
        </div>
        <motion.div className="cw-file-copy" initial={{ opacity: 0, y: reduced ? 0 : 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: reduced ? 0 : .35 }}>
          <p className="cw-kicker">FIELD NOTES · 角色檔案</p><h2 id="cw-file-name">{character.name}</h2>
          <div className="cw-file-details" tabIndex={0} role="region" aria-label="人物資料與簡介">
          <dl className="cw-facts"><div><dt>年齡 <small>AGE</small></dt><dd>{text(character.age)}</dd></div><div><dt>所屬 <small>AFFILIATION</small></dt><dd>{text(character.affiliation)}</dd></div></dl>
          <section className="cw-file-section"><h3><span>01</span> 特長 <small>APTITUDES</small></h3><p>{text(list(character.specialties))}</p></section>
          <section className="cw-file-section"><h3><span>02</span> 參與項目 <small>PROJECT</small></h3><p>{text(list(character.projects))}</p></section>
          {character.biography && <section className="cw-biography" aria-labelledby="cw-biography-title"><h3 id="cw-biography-title">人物簡介 <small>PROFILE</small></h3><div className="cw-biography-text">{character.biography.split(/\n\s*\n/).map((paragraph, index) => <p key={index}>{paragraph}</p>)}</div><span className="cw-biography-dots" aria-hidden="true">{Array.from({ length: 9 }, (_, index) => <i key={index}/>)}</span></section>}
          </div>
        </motion.div>
      </div>
      <footer className="cw-file-footer"><button onClick={() => onSelect(characters[(index - 1 + characters.length) % characters.length].id)}>← 上一份</button><span>{String(index + 1).padStart(2, '0')} <i>/</i> {String(characters.length).padStart(2, '0')}</span><button onClick={() => onSelect(characters[(index + 1) % characters.length].id)}>下一份 →</button></footer>
    </div>
  </dialog>
}
