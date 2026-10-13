import { forwardRef, useEffect, useRef } from 'react'
import { WORLD } from './config.js'
import { createRenderer } from './renderer.js'
import { loadTiles } from './tileset.js'

const WorldCanvas = forwardRef(function WorldCanvas({ model, renderer, onTilesReady, ...events }, forwardedRef) {
  const canvasRef = useRef(null)
  useEffect(() => {
    const canvas = canvasRef.current
    const ctx = canvas.getContext('2d')
    let draw
    const tiles = loadTiles(set => { onTilesReady?.({ loaded:set.loaded,total:set.total,errors:[...set.errors] }); draw?.() })
    const render = createRenderer(tiles)
    const reduced = matchMedia('(prefers-reduced-motion: reduce)')
    draw = () => {
      ctx.setTransform(canvas.width / WORLD.width, 0, 0, canvas.height / WORLD.height, 0, 0)
      render(ctx, model.current, reduced.matches)
    }
    const resize = () => {
      const rect = canvas.getBoundingClientRect(), dpr = Math.min(2, devicePixelRatio || 1)
      canvas.width = Math.max(1, Math.round(rect.width * dpr)); canvas.height = Math.max(1, Math.round(rect.height * dpr))
      draw()
    }
    renderer.current = draw
    const observer = new ResizeObserver(resize); observer.observe(canvas)
    reduced.addEventListener('change', draw); resize()
    return () => { tiles.dispose(); observer.disconnect(); reduced.removeEventListener('change', draw); if (renderer.current === draw) renderer.current = null }
  }, [model, renderer, onTilesReady])
  return <canvas className="wp-world-canvas" style={{ aspectRatio: WORLD.width / WORLD.height }} ref={element => { canvasRef.current = element; if (typeof forwardedRef === 'function') forwardedRef(element); else if (forwardedRef) forwardedRef.current = element }} tabIndex="0" role="application" aria-label="微型像素世界：按住滑鼠或空白鍵倒入選定藥水，放開立即停止，Escape 取消。" {...events} />
})
export default WorldCanvas
