import { useEffect, useMemo, useRef, useState } from 'react'
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion'
import { CATEGORIES, WORKS } from './data'
import { PosterCopyrightNotice } from './PosterCopyright'

const INDEXED_WORKS = CATEGORIES.flatMap(category => category.works.map(id => {
  const work = WORKS[id]
  if (!work) throw new Error(`Unknown Ball work "${id}" in category "${category.id}"`)
  return { work, category }
}))

export default function WorkIndexDialog({ open, onClose, onSelect }) {
  const [query, setQuery] = useState('')
  const [categoryId, setCategoryId] = useState('all')
  const panel = useRef(null)
  const reduced = useReducedMotion()

  useEffect(() => {
    if (!open) return
    const previous = document.activeElement
    panel.current?.querySelector('input')?.focus({ preventScroll: true })
    const key = event => {
      if (event.key === 'Escape') onClose()
      if (event.key !== 'Tab') return
      const controls = [...panel.current.querySelectorAll('input, select, button')]
      const first = controls[0], last = controls.at(-1)
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus() }
      else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus() }
    }
    window.addEventListener('keydown', key)
    return () => {
      window.removeEventListener('keydown', key)
      previous?.focus?.({ preventScroll: true })
    }
  }, [open, onClose])

  const counts = useMemo(() => Object.fromEntries(CATEGORIES.map(category => [category.id, category.works.length])), [])
  const filteredWorks = useMemo(() => {
    const normalizedQuery = query.trim().toLocaleLowerCase()
    return INDEXED_WORKS.filter(({ work, category }) => {
      if (categoryId !== 'all' && category.id !== categoryId) return false
      if (!normalizedQuery) return true
      return [work.name, work.originalTitle, work.artist].filter(Boolean)
        .some(value => value.toLocaleLowerCase().includes(normalizedQuery))
    })
  }, [categoryId, query])

  return <AnimatePresence>
    {open && <motion.div className="ball-modal ball-index-modal" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: reduced ? 0 : .22 }} onClick={event => { if (event.target === event.currentTarget) onClose() }}>
    <motion.section ref={panel} className="ball-work-dialog ball-index-dialog" role="dialog" aria-modal="true" aria-labelledby="ball-index-title" initial={reduced ? false : { opacity: 0, y: 14, scale: .985 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 8, scale: .99 }} transition={{ duration: reduced ? 0 : .28, ease: [.22, .75, .25, 1] }}>
      <header><button onClick={onClose}>關閉 ×</button></header>
      <h2 id="ball-index-title">作品索引</h2>
      <div className="ball-index-content">
        <div className="ball-index-filters">
          <label>搜尋作品<input type="search" value={query} onChange={event => setQuery(event.target.value)} placeholder="輸入作品名稱或歌手" /></label>
          <label>作品分類<select value={categoryId} onChange={event => setCategoryId(event.target.value)}>
            <option value="all">所有分類（{INDEXED_WORKS.length}）</option>
            {CATEGORIES.map(category => <option key={category.id} value={category.id}>{category.name}（{counts[category.id]}）</option>)}
          </select></label>
        </div>
        <p className="ball-index-category-counts"><span>分類數量</span>{CATEGORIES.map(category => <span key={category.id}>{category.name} {counts[category.id]}</span>)}</p>
        <p className="ball-index-result-count" aria-live="polite">找到 {filteredWorks.length} 件作品</p>
        {filteredWorks.length ? <ul className="ball-index-list">{filteredWorks.map(({ work, category }) => <li key={work.id}>
          <button onClick={() => onSelect(work)}><span>{work.name}</span><small>{category.name}</small></button>
        </li>)}</ul> : <p className="ball-index-empty">找不到符合條件的作品。</p>}
        <details className="ball-poster-rights"><summary>圖片來源與權利聲明</summary><PosterCopyrightNotice/></details>
      </div>
    </motion.section>
    </motion.div>}
  </AnimatePresence>
}
