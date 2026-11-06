import { useCallback, useEffect, useRef, useState } from 'react'
import { loadCharacters } from './characters'
import InfinitePortraits from './InfinitePortraits'
import CharacterFile from './CharacterFile'
import './characters.css'

export default function CharactersPage({ onBack }) {
  const [characters, setCharacters] = useState(null)
  const [selected, setSelected] = useState(null), [indexOpen, setIndexOpen] = useState(false)
  const opener = useRef(null), restoreFrame = useRef(0)
  const open = useCallback((id, source) => { opener.current = source || document.activeElement; setSelected(id) }, [])
  const close = useCallback(() => {
    setSelected(null)
    restoreFrame.current = requestAnimationFrame(() => opener.current?.focus({ preventScroll: true }))
  }, [])
  useEffect(() => () => cancelAnimationFrame(restoreFrame.current), [])
  useEffect(() => {
    let active = true
    loadCharacters().then(items => { if (active) setCharacters(items) })
    return () => { active = false }
  }, [])
  useEffect(() => {
    const title = document.title
    document.title = '同行者檔案館 · The Wizard’s GENESIS'
    return () => { document.title = title }
  }, [])
  const character = characters?.find(item => item.id === selected)
  return <main className="cw-page">
    <div className="cw-main" inert={Boolean(character)}>
      <header className="cw-header"><div className="cw-brand"><span className="cw-brand-mark" aria-hidden="true">✦</span><span>The Wizard’s<br/><b>GENESIS</b></span></div><div className="cw-header-actions">{onBack && <button onClick={onBack}>返回</button>}<button className="cw-index-toggle" aria-expanded={indexOpen} aria-controls="cw-index" onClick={() => setIndexOpen(open => !open)}>檔案索引 <span>{indexOpen ? '−' : '+'}</span></button></div></header>
      <div className="cw-heading"><p className="cw-kicker">THE PEOPLE BEHIND THE WONDER</p></div>
      <section className="cw-stage" aria-label="角色肖像收藏">
        {characters?.length > 0 && <InfinitePortraits characters={characters} paused={Boolean(character) || indexOpen} onOpen={open}/>}
        {!characters && <p className="cw-loading" role="status">正在整理肖像收藏⋯</p>}
        {characters?.length === 0 && <p className="cw-loading" role="status">目前沒有可載入的肖像。</p>}
        <span className="cw-corner cw-corner-tl" aria-hidden="true">+</span><span className="cw-corner cw-corner-br" aria-hidden="true">+</span>
        {indexOpen && <aside className="cw-index" id="cw-index" aria-label="角色檔案索引"><div className="cw-index-title"><span>COLLECTION INDEX</span><button aria-label="關閉索引" onClick={() => setIndexOpen(false)}>×</button></div><p>選一位同行者，翻開他的檔案。</p><div>{characters?.map((item, index) => <button key={item.id} onClick={event => open(item.id, event.currentTarget)}><span>{String(index + 1).padStart(2, '0')}</span>{item.name}<span>↗</span></button>)}</div></aside>}
      </section>
      <footer className="cw-footer"><span><b>{String(characters?.length || 0).padStart(2, '0')}</b> 位同行者 <i>·</i> 肖像持續收錄中</span><span className="cw-instruction">↔ 自由拖曳 <i>/</i> 滾輪漫遊 <i>/</i> 點擊翻閱檔案</span><span className="cw-footer-mark">COLLECTED WITH CURIOSITY ✦</span></footer>
    </div>
    {character && <CharacterFile character={character} characters={characters} onSelect={setSelected} onClose={close}/>}
  </main>
}
