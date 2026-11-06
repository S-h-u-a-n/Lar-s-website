import { useEffect, useRef } from 'react'
import { characterIndex, geometry, modulo, rebase, wheelPixels } from './gridMath'

/** Fixed viewport-sized pool. All per-frame work stays outside React. */
export default function InfinitePortraits({ characters, paused, onOpen }) {
  const viewport = useRef(null), layer = useRef(null), api = useRef({ paused, onOpen })
  api.current = { paused, onOpen }
  useEffect(() => {
    if (!characters.length) return
    const element = viewport.current, world = layer.current
    const reduced = matchMedia('(prefers-reduced-motion: reduce)')
    let size, grid, pool = [], frame = 0, drag = null, moved = false, suppressUntil = 0
    let x = 24, y = 26, targetX = x, targetY = y
    const animate = slot => {
      slot.animation?.cancel()
      if (reduced.matches) return
      slot.animation = slot.button.animate([
        { opacity: 0, transform: 'scale(.42)' },
        { opacity: 1, transform: 'scale(1)' },
      ], { duration: 480, delay: modulo(slot.column * 7 + slot.row * 11, 6) * 28, easing: 'cubic-bezier(.22,1,.36,1)', fill: 'backwards' })
    }
    const paint = () => {
      const startColumn = Math.floor(-x / grid.stepX) - 1
      const startRow = Math.floor(-y / grid.stepY) - 1
      for (let row = startRow; row < startRow + grid.rows; row++) {
        for (let column = startColumn; column < startColumn + grid.columns; column++) {
          const slot = pool[modulo(row, grid.rows) * grid.columns + modulo(column, grid.columns)]
          const left = column * grid.stepX + x, top = row * grid.stepY + y
          const index = characterIndex(column, row, characters.length)
          const changed = slot.column !== column || slot.row !== row
          const visible = left < size.width && left + grid.tile > 0 && top < size.height && top + grid.tile > 0
          if (changed) {
            slot.column = column; slot.row = row
            slot.node.dataset.characterId = characters[index].id
            slot.button.setAttribute('aria-label', `開啟${characters[index].name}的角色檔案`)
            slot.name.textContent = characters[index].name
            if (slot.index !== index) {
              slot.image.src = characters[index].image
              slot.index = index
            }
          }
          slot.node.style.transform = `translate3d(${left}px,${top}px,0)`
          if (visible && (!slot.visible || changed)) animate(slot)
          slot.visible = visible
          // Keyboard access is provided by the unique character index, not duplicate tiles.
        }
      }
      element.dataset.offset = `${x.toFixed(2)},${y.toFixed(2)}`
    }
    const tick = () => {
      frame = 0
      if (api.current.paused) return
      // Short input smoothing; no velocity accumulator or release momentum.
      const dx = targetX - x, dy = targetY - y
      const blend = reduced.matches ? 1 : .52
      x += dx * blend; y += dy * blend
      if (Math.abs(dx) + Math.abs(dy) < .15) { x = targetX; y = targetY }
      paint()
      if (x !== targetX || y !== targetY) frame = requestAnimationFrame(tick)
      else if (!drag) {
        const nextX = rebase(x, grid.stepX, characters.length), nextY = rebase(y, grid.stepY, characters.length)
        if (nextX !== x || nextY !== y) {
          // Preserve slot identities through rebasing; no animation replay.
          const shiftC = Math.round((x - nextX) / grid.stepX), shiftR = Math.round((y - nextY) / grid.stepY)
          x = targetX = nextX; y = targetY = nextY
          for (const slot of pool) { slot.column += shiftC; slot.row += shiftR }
          // Reindex the pool to its rebased logical coordinates.
          const next = []
          for (const slot of pool) next[modulo(slot.row, grid.rows) * grid.columns + modulo(slot.column, grid.columns)] = slot
          pool = next
          element.dataset.offset = `${x.toFixed(2)},${y.toFixed(2)}`
        }
      }
    }
    const requestPaint = () => { if (!frame) frame = requestAnimationFrame(tick) }
    const resize = () => {
      size = { width: element.clientWidth, height: element.clientHeight }
      grid = geometry(size.width, size.height)
      for (const slot of pool) slot.animation?.cancel()
      world.replaceChildren()
      pool = Array.from({ length: grid.columns * grid.rows }, () => {
        const node = document.createElement('div'), button = document.createElement('button')
        const image = document.createElement('img'), name = document.createElement('span')
        node.className = 'cw-slot'; button.className = 'cw-portrait'; button.type = 'button'; button.tabIndex = -1
        node.style.width = node.style.height = `${grid.tile}px`
        image.alt = ''; image.draggable = false; image.decoding = 'async'
        name.className = 'cw-portrait-name'
        button.append(image, name); node.append(button); world.append(node)
        return { node, button, image, name, index: -1, visible: false, column: null, row: null }
      })
      paint()
    }
    const down = event => {
      if (api.current.paused || event.button !== 0 || !event.isPrimary) return
      moved = false
      drag = { id: event.pointerId, x: event.clientX, y: event.clientY, originX: targetX, originY: targetY }
    }
    const move = event => {
      if (!drag || drag.id !== event.pointerId) return
      if (api.current.paused) { end(event); return }
      const dx = event.clientX - drag.x, dy = event.clientY - drag.y
      if (!moved && Math.hypot(dx, dy) < 6) return
      if (!moved) { moved = true; element.setPointerCapture(event.pointerId); element.classList.add('is-dragging') }
      targetX = drag.originX + dx; targetY = drag.originY + dy
      requestPaint()
    }
    const end = event => {
      if (!drag || drag.id !== event.pointerId) return
      if (moved) suppressUntil = Date.now() + 350
      drag = null; element.classList.remove('is-dragging')
      if (element.hasPointerCapture(event.pointerId)) element.releasePointerCapture(event.pointerId)
      requestPaint()
    }
    const click = event => {
      if (api.current.paused || Date.now() < suppressUntil) return
      const tile = event.target.closest('[data-character-id]')
      if (tile) {
        // Finish only the short follow-through, then freeze this exact position.
        x = targetX; y = targetY; paint()
        api.current.onOpen(tile.dataset.characterId, tile.querySelector('button'))
      }
    }
    const wheel = event => {
      if (api.current.paused || event.ctrlKey) return
      event.preventDefault()
      const delta = wheelPixels(event, size.width, size.height)
      targetX -= delta.x; targetY -= delta.y; requestPaint()
    }
    resize()
    const observer = new ResizeObserver(resize); observer.observe(element)
    element.addEventListener('pointerdown', down); element.addEventListener('pointermove', move)
    element.addEventListener('pointerup', end); element.addEventListener('pointercancel', end)
    element.addEventListener('lostpointercapture', end); element.addEventListener('click', click)
    element.addEventListener('wheel', wheel, { passive: false })
    return () => {
      observer.disconnect(); cancelAnimationFrame(frame)
      for (const slot of pool) slot.animation?.cancel()
      world.replaceChildren()
      element.removeEventListener('pointerdown', down); element.removeEventListener('pointermove', move)
      element.removeEventListener('pointerup', end); element.removeEventListener('pointercancel', end)
      element.removeEventListener('lostpointercapture', end); element.removeEventListener('click', click); element.removeEventListener('wheel', wheel)
    }
  }, [characters])
  return <div ref={viewport} className="cw-viewport" inert={paused} aria-label="可向任意方向拖曳的角色牆"><div ref={layer} className="cw-layer" /></div>
}
