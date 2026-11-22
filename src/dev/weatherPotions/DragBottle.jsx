import { forwardRef, useEffect, useImperativeHandle, useMemo, useState } from 'react'
import { createFrameBatch } from '../../lib/visibleFrameLoop'
import { POTIONS } from './fallingSand/config'
import { Bottle } from './LineArt'

// Coordinate updates render only this overlay, not the entire sandbox page.
export default forwardRef(function DragBottle(_, ref) {
  const [drag, setDrag] = useState(null)
  const updates = useMemo(() => createFrameBatch(setDrag), [])
  useImperativeHandle(ref, () => ({ set(value) {
    if (value) updates.push(value)
    else updates.flush(null)
  } }), [updates])
  useEffect(() => () => updates.cancel(), [updates])
  return drag && <div className={`wp-drag-bottle ${drag.over ? 'is-pouring' : ''}`} style={{ left: drag.x, top: drag.y }} aria-hidden="true"><Bottle potion={POTIONS.find(p => p.id === drag.type)} pouring={drag.over}/></div>
})
