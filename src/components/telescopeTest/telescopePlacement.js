import { useLayoutEffect } from 'react'

// Attach the unchanged button group to the LARGE frame's actual rotated bounds.
export function useLargeFrameTools(stage) {
  useLayoutEffect(() => {
    const host = stage.current
    const frame = host.querySelector('.tt-yuta-large-backdrop')
    const tools = host.querySelector('.tt-observation-tools')
    function align() {
      const origin = host.getBoundingClientRect(), bounds = frame.getBoundingClientRect()
      host.style.setProperty('--tt-tools-top', `${bounds.top - origin.top}px`)
      host.style.setProperty('--tt-tools-left', `${bounds.left - origin.left - tools.offsetWidth - 10}px`)
    }
    const observer = new ResizeObserver(align)
    ;[host, frame, tools].forEach(node => observer.observe(node))
    align()
    window.addEventListener('resize', align)
    return () => { observer.disconnect(); window.removeEventListener('resize', align) }
  }, [stage])
}

// Art-directed preferred regions, not random coordinates. Exact positions are
// selected from measured empty space, accounting for rotation and all motion.
const regions = {
  stripes: [[.055, .17], [.04, .3]],
  grid: [[.085, .85], [.13, .9]],
  checker: [[.55, .88], [.65, .94]],
  polka: [[.53, .14], [.58, .16]],
  pink: [[.035, .55], [.04, .43]],
  yellow: [[.97, .1], [.97, .22]],
  blue: [[.58, .75], [.56, .83]],
}
const intersects = (a, b) => a.left < b.right && a.right > b.left && a.top < b.bottom && a.bottom > b.top
const rect = node => {
  const r = node.getBoundingClientRect()
  return { left: r.left, top: r.top, right: r.right, bottom: r.bottom }
}

export function useTelescopeSquarePlacement(root) {
  useLayoutEffect(() => {
    const host = root.current, page = host.closest('.telescope-test')
    const nodes = [...host.querySelectorAll('[data-floating-square]')]
    const protectedNodes = [...page.querySelectorAll('.tt-header,.tt-modes,.tt-attribution,.tt-observation-notice,.tt-observation-tools,.tt-yuta-large-backdrop,.tt-yuta,.tt-yuta-name,.tt-dialogue-bubble,.tt-compass')]
    let scheduled = 0, alive = true
    function arrange() {
      scheduled = 0
      if (!alive) return
      const origin = host.getBoundingClientRect()
      const obstacles = [...protectedNodes, ...document.querySelectorAll('.edition-navigation,.layout-editor-toggle,.text-editor-toggle')]
        .filter(node => node.getClientRects().length && getComputedStyle(node).visibility !== 'hidden')
        .map(rect)
      const lensNode = page.querySelector('.tt-window')
      const lens = lensNode.getBoundingClientRect()
      // Rotation expands a square DOMRect but not the circular map. Protect
      // the actual circle plus its existing 11px shadow and 6px clearance.
      const circle = { x: lens.left + lens.width / 2, y: lens.top + lens.height / 2, radius: Math.max(lensNode.offsetWidth, lensNode.offsetHeight) / 2 + 17 }
      const placed = []
      const items = nodes.map(node => {
        const matrix = new DOMMatrixReadOnly(getComputedStyle(node).transform)
        const side = node.offsetWidth
        // Translation is clamped to ±6px in CSS. 12px reserves that full
        // excursion plus breathing room, in every direction and at every time.
        return { node, side, width: side * (Math.abs(matrix.a) + Math.abs(matrix.c)), height: side * (Math.abs(matrix.b) + Math.abs(matrix.d)) }
      }).sort((a, b) => (b.side + (b.node.dataset.floatingSquare === 'polka' ? 8 : 0)) - (a.side + (a.node.dataset.floatingSquare === 'polka' ? 8 : 0)))
      for (const item of items) {
        const { node, side, width, height } = item
        const halfX = width / 2 + 12, halfY = height / 2 + 12
        const preferred = regions[node.dataset.floatingSquare]
        let best = null, bestScore = Infinity
        const xs = [], ys = []
        for (let x = origin.left + halfX + 8; x <= origin.right - halfX - 8; x += 12) xs.push(x)
        for (let y = origin.top + halfY + 8; y <= origin.bottom - halfY - 8; y += 12) ys.push(y)
        // Include exact content edges so narrow, genuinely empty regions do
        // not disappear merely because a coarse search grid missed them.
        for (const edge of [...obstacles, ...placed]) {
          xs.push(edge.left - halfX, edge.right + halfX)
          ys.push(edge.top - halfY, edge.bottom + halfY)
        }
        for (const cy of ys) {
          for (const cx of xs) {
            if (cx < origin.left + halfX + 8 || cx > origin.right - halfX - 8 || cy < origin.top + halfY + 8 || cy > origin.bottom - halfY - 8) continue
            const box = { left: cx - halfX, top: cy - halfY, right: cx + halfX, bottom: cy + halfY }
            const dx = circle.x - Math.max(box.left, Math.min(circle.x, box.right))
            const dy = circle.y - Math.max(box.top, Math.min(circle.y, box.bottom))
            if (dx * dx + dy * dy < circle.radius * circle.radius) continue
            if (obstacles.some(other => intersects(box, other)) || placed.some(other => intersects(box, other))) continue
            const score = Math.min(...preferred.map(([x, y], index) => (cx - origin.width * x) ** 2 + (cy - origin.height * y) ** 2 + index * 900))
            if (score < bestScore) { bestScore = score; best = { box, cx, cy } }
          }
        }
        node.dataset.placed = best ? 'true' : 'false'
        if (best) {
          node.style.setProperty('--tt-square-left', `${best.cx - origin.left - side / 2}px`)
          node.style.setProperty('--tt-square-top', `${best.cy - origin.top - side / 2}px`)
          placed.push(best.box)
        }
      }
    }
    const schedule = () => { if (!scheduled) scheduled = requestAnimationFrame(arrange) }
    const observer = new ResizeObserver(schedule)
    ;[page, ...protectedNodes].forEach(node => observer.observe(node))
    schedule()
    document.fonts.ready.then(() => { if (alive) schedule() })
    window.addEventListener('resize', schedule)
    return () => { alive = false; cancelAnimationFrame(scheduled); observer.disconnect(); window.removeEventListener('resize', schedule) }
  }, [root])
}

// The dots are children of the LARGE frame, so its own rotation and resize
// define their coordinate system. Only the dots receive positioning variables.
export function useLargeFrameDots(stage) {
  useLayoutEffect(() => {
    const host = stage.current
    const frame = host.querySelector('.tt-yuta-large-backdrop')
    const dots = frame.querySelector('.tt-color-dots')
    const small = host.querySelector('.tt-yuta-background')
    const model = host.querySelector('.tt-yuta')
    function align() {
      const largeBounds = frame.getBoundingClientRect(), smallBounds = small.getBoundingClientRect(), modelBounds = model.getBoundingClientRect()
      // The transparent square canvas exceeds the visible character. Reserve
      // the conservative right 86% envelope plus the entire small square.
      const gutter = largeBounds.right - Math.max(smallBounds.right, modelBounds.left + modelBounds.width * .86)
      const diameter = dots.firstElementChild.offsetWidth
      const right = Math.max(12, Math.min(24, frame.clientWidth * .045, (gutter - diameter - 8) / 2))
      dots.style.setProperty('--tt-dots-right', `${right}px`)
      dots.style.setProperty('--tt-dots-top', `${Math.max(14, Math.min(24, frame.clientHeight * .045))}px`)
      dots.style.setProperty('--tt-dots-gap', `${Math.max(4, Math.min(6, frame.clientHeight * .012))}px`)
    }
    const observer = new ResizeObserver(align)
    ;[frame, small, model].forEach(node => observer.observe(node))
    align()
    return () => observer.disconnect()
  }, [stage])
}


// Move the existing coordinate group as one unit; the index stays untouched.
export function useCoordinateClearance(coordinate) {
  useLayoutEffect(() => {
    const node = coordinate.current
    const index = document.querySelector('.edition-navigation')
    if (!index) return
    const page = node.closest('.telescope-test')
    const bubble = node.parentElement.querySelector('.tt-dialogue-bubble')
    function align() {
      const previous = parseFloat(node.style.getPropertyValue('--tt-coordinate-shift')) || 0
      const baseRight = node.getBoundingClientRect().right - previous
      const shift = Math.min(-24, index.getBoundingClientRect().left - 24 - baseRight)
      node.style.setProperty('--tt-coordinate-shift', `${shift}px`)
      page.dataset.readingSpace = String(bubble.getBoundingClientRect().bottom + page.scrollTop > index.getBoundingClientRect().top - 16)
    }
    const observer = new ResizeObserver(align)
    ;[node, node.parentElement, index, bubble].forEach(el => observer.observe(el))
    align()
    window.addEventListener('resize', align)
    return () => { observer.disconnect(); window.removeEventListener('resize', align) }
  }, [coordinate])
}
