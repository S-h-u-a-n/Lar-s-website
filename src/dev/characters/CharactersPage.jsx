import { useCallback, useEffect, useRef, useState } from 'react'
import { loadCharacters } from './characters'
import InfinitePortraits from './InfinitePortraits'
import CharacterFile from './CharacterFile'
import HomeSectionGeometry from '../../components/main/HomeSectionGeometry'
import './characters.css'

export default function CharactersPage({ onBack }) {
  const [characters, setCharacters] = useState(null)
  const [selected, setSelected] = useState(null)
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
    document.title = "The Wizard's GENESIS"
    return () => { document.title = title }
  }, [])
  const character = characters?.find(item => item.id === selected)
  return <main className="cw-page">
    <div className="cw-main" inert={Boolean(character)}>
      <HomeSectionGeometry variant="characters-page"/>
      <header className="cw-header"><div className="cw-brand"><span className="cw-brand-mark" aria-hidden="true">✦</span><span>The Wizard's<br/><b>GENESIS</b></span></div><div className="cw-header-actions">{onBack && <button onClick={onBack}>返回</button>}</div></header>
      <div className="cw-heading"><p className="cw-kicker">THE PEOPLE BEHIND THE WONDER</p></div>
      <section className="cw-stage" aria-label="角色肖像收藏">
        {characters?.length > 0 && <InfinitePortraits characters={characters} paused={Boolean(character)} onOpen={open}/>}
        {!characters && <p className="cw-loading" role="status">正在整理肖像收藏⋯</p>}
        {characters?.length === 0 && <p className="cw-loading" role="status">目前沒有可載入的肖像。</p>}
        <span className="cw-corner cw-corner-tl" aria-hidden="true">+</span><span className="cw-corner cw-corner-br" aria-hidden="true">+</span>
      </section>
      <footer className="cw-footer"><span><b>{String(characters?.length || 0).padStart(2, '0')}</b> 位成員 <i>・</i> 持續收錄中</span><span className="cw-instruction">↔ 自由拖曳 <i>/</i> 滾輪漫遊 <i>/</i> 點擊翻閱檔案</span></footer>
    </div>
    {character && <CharacterFile character={character} characters={characters} onSelect={setSelected} onClose={close}/>}
  </main>
}
