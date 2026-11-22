export const wrapWorkIndex = (index, length) => length ? ((index % length) + length) % length : 0
export function createWorkNavigation() {
  return { selectedIndex: 0, start: 0, direction: 1 }
}
export function workNavigationReducer(state, event) {
  switch (event.type) {
    case 'reset': return createWorkNavigation()
    case 'select': return { ...state, selectedIndex: event.index }
    case 'seek': return { selectedIndex: event.index, start: event.index, direction: event.index < state.start ? -1 : 1 }
    case 'step':
      if (!event.length) return state
      return { selectedIndex: wrapWorkIndex(state.selectedIndex + event.direction, event.length), start: state.start + event.direction, direction: event.direction }
    default: throw new Error(`Unknown work navigation action: ${event.type}`)
  }
}
// Logical positions distinguish an outgoing occurrence from the same work
// entering at the other end, including categories with only three works.
export function visibleWorkEntries(works, start, count) {
  return Array.from({ length: Math.min(count, works.length) }, (_, offset) => {
    const position = start + offset
    return { position, work: works[wrapWorkIndex(position, works.length)] }
  })
}
