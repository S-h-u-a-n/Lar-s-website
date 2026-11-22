import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import './PhotoCredit.css'
import { textSymbolLabel } from '../../lib/textSymbols'

// Screen-space control stays clickable above the reading dismissal layer.
export default function PhotoCredit({ photoRef, credit, inline = false, children }) {
  const [host, setHost] = useState(null), [open, setOpen] = useState(false)
  const button = useRef(null), dialog = useRef(null)
  useEffect(() => { setHost(photoRef.current?.closest('.natural-test') ?? null) }, [photoRef])
  useLayoutEffect(() => {
    const photo = photoRef.current, control = button.current
    if (inline || !host || !photo || !control) return
    const place = () => {
      const rect = photo.getBoundingClientRect(), page = host.getBoundingClientRect()
      control.style.left = `${rect.right - page.left - 29}px`
      control.style.top = `${rect.bottom - page.top - 29}px`
    }
    const world = photo.closest('.nt-world')
    const motion = new MutationObserver(place)
    if (world) motion.observe(world, { attributes: true, attributeFilter: ['style'] })
    const size = new ResizeObserver(place)
    size.observe(photo); size.observe(host)
    place()
    return () => { motion.disconnect(); size.disconnect() }
  }, [host, photoRef, inline])
  useLayoutEffect(() => {
    if (open && dialog.current && !dialog.current.open) dialog.current.showModal()
  }, [open])
  if (!inline && !host) return null
  const close = () => {
    if (dialog.current?.open) dialog.current.close()
    setOpen(false)
    button.current?.focus({ preventScroll: true })
  }
  const isOriginalPhoto = Boolean(credit.attribution)
  const control = <button ref={button} className="research-photo-info" aria-label={isOriginalPhoto ? '圖片版權資訊' : '圖片來源與授權'} aria-haspopup="dialog" onClick={event => { event.stopPropagation(); setOpen(true) }}>ⓘ</button>
  return <>{inline ? control : createPortal(control, host)}
    {open && createPortal(<dialog ref={dialog} className="research-photo-license" aria-labelledby="research-photo-license-title" onCancel={event => { event.preventDefault(); event.stopPropagation(); close() }} onClose={event => { event.stopPropagation(); close() }} onKeyDown={event => event.stopPropagation()} onClick={event => { event.stopPropagation(); if (event.target === event.currentTarget) close() }}>
      <div className="research-photo-license-copy">
        <button className="research-photo-license-close" aria-label="關閉圖片來源" onClick={close}>×</button>
        <h2 id="research-photo-license-title">{isOriginalPhoto ? '圖片版權資訊' : '圖片來源與授權'}</h2>
        {children ?? (isOriginalPhoto ? <p>{credit.attribution}</p> : <>
          <p>{credit.title}</p>
          <dl>
            <dt>作者</dt><dd>{credit.author}</dd>
            <dt>來源</dt><dd><a href={credit.sourceUrl} target="_blank" rel="noopener noreferrer">{textSymbolLabel(credit.sourceLabel || 'Wikimedia Commons 原始檔案頁 ↗︎')}</a></dd>
            <dt>授權</dt><dd><a href={credit.licenseUrl} target="_blank" rel="noopener noreferrer">{credit.license}</a></dd>
            <dt>修改</dt><dd>{credit.modifications}</dd>
          </dl>
        </>)}
      </div>
    </dialog>, document.body)}
  </>
}
