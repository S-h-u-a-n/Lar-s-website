export const PORTAL_DESTINATIONS = {
  ball: 'ball',
  globe: 'globe',
  potion: 'bottled-weather',
  telescope: 'telescope',
  'book-close1': 'book-close1',
  'book-open1': 'book-open1',
  bookink: 'bookink',
}

export function getPortalDestination(portalId) {
  return PORTAL_DESTINATIONS[portalId] || null
}