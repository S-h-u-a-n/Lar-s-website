// Choose visible opaque silhouettes in the panorama's right-to-left reading order.
export function initialHintPeople(assets, { width, height, scale, cameraPx, ready }) {
  const offsetY = (height - 2620 * scale) / 2
  return assets.flatMap((asset, index) => {
    if (!asset.id.startsWith('people-') || !asset.interaction || !ready(index)) return []
    const [l, t, r, b] = asset.bounds
    const left = (asset.x + l / 2109 * asset.width) * scale - cameraPx
    const right = (asset.x + r / 2109 * asset.width) * scale - cameraPx
    const top = offsetY + (asset.y + t / 2984 * asset.height) * scale
    const bottom = offsetY + (asset.y + b / 2984 * asset.height) * scale
    const visibleWidth = Math.max(0, Math.min(width, right) - Math.max(0, left))
    return visibleWidth >= (right - left) * .5 && bottom > 0 && top < height ? [{ index, center: (left + right) / 2 }] : []
  }).sort((a, b) => b.center - a.center).slice(0, 3).map(item => item.index)
}

const DURATION = 650, STAGGER = 220, CANCEL = 120
const smooth = t => t * t * (3 - 2 * t)

// A single scale crest per person, composed into the existing foot transform.
// Time the cue directly so the hover spring does not add a slow settling tail.
export function createInitialPeopleHint(indices, startAt) {
  let phase = 'waiting', cancelledAt = null, weights = new Map(), cancelledWeights
  return {
    get running() { return phase === 'waiting' || phase === 'playing' || (phase === 'cancelled' && weights.size > 0) },
    get phase() { return phase },
    cancel(time) {
      if (cancelledAt !== null || phase === 'complete') return
      cancelledAt = time; cancelledWeights = weights; phase = 'cancelled'
    },
    update(time) {
      weights = new Map()
      if (phase === 'complete') return weights
      if (phase === 'cancelled') {
        const t = Math.min(1, Math.max(0, (time - cancelledAt) / CANCEL))
        if (t < 1) for (const [index, weight] of cancelledWeights) weights.set(index, weight * (1 - smooth(t)))
        return weights
      }
      if (time < startAt) return weights
      phase = 'playing'
      indices.forEach((index, order) => {
        const t = (time - startAt - order * STAGGER) / DURATION
        if (t > 0 && t < 1) weights.set(index, Math.sin(Math.PI * t) ** 2)
      })
      if (time >= startAt + Math.max(0, indices.length - 1) * STAGGER + DURATION) phase = 'complete'
      return weights
    },
  }
}
