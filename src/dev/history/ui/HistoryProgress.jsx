import { useLayoutEffect, useRef } from 'react'

export default function HistoryProgress() {
  const indicator = useRef(null)
  useLayoutEffect(() => {
    const host = indicator.current.closest('.history-viewport')
    const sync = () => {
      const camera = Number(host.dataset.camera)
      const ready = host.dataset.ready === 'true' && Number.isFinite(camera)
      indicator.current.style.setProperty('--history-ui-camera', ready ? String(camera) : '1')
      indicator.current.dataset.shown = String(ready && host.dataset.opening === 'complete' && camera > 0 && host.dataset.leaving !== 'true')
    }
    const observer = new MutationObserver(sync)
    observer.observe(host, { attributes: true, attributeFilter: ['data-camera', 'data-ready', 'data-opening', 'data-leaving'] })
    sync()
    return () => observer.disconnect()
  }, [])
  return <div ref={indicator} className="history-ui-progress" aria-hidden="true"><span /></div>
}
