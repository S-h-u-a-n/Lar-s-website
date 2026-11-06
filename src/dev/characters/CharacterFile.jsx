import { useEffect, useRef } from 'react'
import { motion, useReducedMotion } from 'framer-motion'

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
          <span className="cw-file-tab">人物觀察簿</span>
          <div className="cw-orbit" aria-hidden="true"><i/><i/><span>✧</span></div>
          <motion.figure initial={{ opacity: 0, y: reduced ? 0 : 18, rotate: reduced ? 0 : -5 }} animate={{ opacity: 1, y: 0, rotate: reduced ? 0 : -2 }} transition={{ duration: reduced ? 0 : .45, ease: [.22, 1, .36, 1] }}>
            <img src={character.image} alt={character.name} />
            <figcaption><span>PORTRAIT STUDY</span><span>✦</span></figcaption>
          </motion.figure>
          <div className="cw-file-seal" aria-hidden="true">THE WIZARD’S<br/><b>G</b><br/>GENESIS</div>
          <p className="cw-visual-note">每一段探索，都從一位同行者開始。</p>
        </div>
        <motion.div className="cw-file-copy" initial={{ opacity: 0, y: reduced ? 0 : 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: reduced ? 0 : .35 }}>
          <p className="cw-kicker">FIELD NOTES · 角色檔案</p><h2 id="cw-file-name">{character.name}</h2>
          <span className="cw-record-status">{character.year || character.department || character.notes ? '持續整理中' : '人物設定待補錄'}</span>
          <dl className="cw-facts"><div><dt>年級 <small>YEAR</small></dt><dd>{text(character.year)}</dd></div><div><dt>學系／身分 <small>DEPARTMENT</small></dt><dd>{text(character.department)}</dd></div></dl>
          <section className="cw-file-section"><h3><span>01</span> 特長 <small>APTITUDES</small></h3><p>{text(list(character.specialties))}</p></section>
          <section className="cw-file-section"><h3><span>02</span> 參與任務 <small>EXPEDITIONS</small></h3><p>{text(list(character.missions))}</p></section>
          <section className="cw-notes"><h3>頁邊筆記 <small>OBSERVATIONS</small></h3><p>{character.notes || '這一頁，留給尚未寫下的故事。人物介紹與研究紀錄將在資料整理後補入。'}</p></section>
        </motion.div>
      </div>
      <footer className="cw-file-footer"><button onClick={() => onSelect(characters[(index - 1 + characters.length) % characters.length].id)}>← 上一份</button><span>{String(index + 1).padStart(2, '0')} <i>/</i> {String(characters.length).padStart(2, '0')}</span><button onClick={() => onSelect(characters[(index + 1) % characters.length].id)}>下一份 →</button></footer>
    </div>
  </dialog>
}
