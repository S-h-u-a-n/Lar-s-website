import { useLayoutEffect, useRef, useState } from 'react'
import { useTextEditorState } from '../../dev/textEditorStore'
import round from '../../../Art/Big/Big-decoration/Big-round1.PNG'
import { MAINTENANCE } from './config'
import AssetCrop from './AssetCrop'
import EditableText from './EditableText'

export default function Maintenance() {
  const [isMaintenanceExpanded, setIsMaintenanceExpanded] = useState(false)
  const asideRef = useRef(null)
  const adjustment = useRef({ x: 0, y: 0, extra: 0 })
  const { data } = useTextEditorState()
  useLayoutEffect(() => {
    const aside = asideRef.current
    const heading = aside.querySelector('.big-test-maintenance-heading')
    const artboard = aside.closest('.big-test-artboard')
    const fit = () => {
      const texts = [...heading.querySelectorAll('[data-text-editor-id]')].map(node => node.getBoundingClientRect())
      if (!texts.length) return
      const previous = adjustment.current
      const frame = artboard.getBoundingClientRect()
      const bar = aside.closest('.main-scene').querySelector('.big-test-banner').getBoundingClientRect()
      const dot = aside.querySelector('.big-test-maintenance-dot').getBoundingClientRect()
      const left = Math.min(...texts.map(rect => rect.left)) - previous.x
      const right = Math.max(...texts.map(rect => rect.right)) - previous.x
      const top = Math.min(...texts.map(rect => rect.top)) - previous.y - previous.extra
      const bottom = Math.max(...texts.map(rect => rect.bottom)) - previous.y - previous.extra
      const extra = Math.max(0, bar.bottom + 16 + bottom - top - (dot.top - previous.extra))
      const x = Math.min(0, frame.right - 8 - right) + Math.max(0, frame.left + 8 - left)
      const y = Math.max(bar.bottom + 8 - (top + extra), Math.min(0, dot.top - previous.extra - 8 - bottom))
      adjustment.current = { x, y, extra }
      heading.style.translate = `${x}px ${y}px`
      aside.style.setProperty('--bt-maintenance-extra-top', `${extra}px`)
    }
    const observer = new ResizeObserver(fit)
    observer.observe(artboard)
    observer.observe(heading)
    fit()
    return () => observer.disconnect()
  }, [data['big-test-maintenance-title'], data['big-test-maintenance-hint']])
  return <aside ref={asideRef} className="big-test-maintenance">
    <div className="big-test-maintenance-heading"><EditableText id="maintenance-title" as="h2">Daily Maintenance</EditableText><EditableText id="maintenance-hint" as="p">Click to inspect</EditableText></div>
    {MAINTENANCE.map(item => <button key={item.id} type="button" className={`big-test-maintenance-item${isMaintenanceExpanded ? ' is-expanded' : ''}`} aria-expanded={isMaintenanceExpanded} onClick={() => setIsMaintenanceExpanded(current => !current)}>
      <div className="big-test-maintenance-reveal"><EditableText id={`maintenance-${item.id}`}>{item.name}</EditableText></div>
      <div className="big-test-maintenance-dot"><AssetCrop src={round} crop={{ x: 526, y: 140, width: 990, height: 990 }} tint={item.color} /></div>
    </button>)}
  </aside>
}
