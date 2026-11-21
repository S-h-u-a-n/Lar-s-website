// Keep one stable <img> and source per asset. Bound concurrent decode work instead
// of submitting 1.3 GiB of RGBA images to the decoder in the same task.
export function createImageLoader(assets, images, onChange, concurrency = 2) {
  let disposed = false, active = 0, preferred = new Set(), focus = Infinity, backgroundPaused = false
  const state = assets.map(() => 'queued')
  function pump() {
    if (disposed) return
    const candidates = assets.map((asset, i) => ({ asset, i }))
      .filter(({ i }) => state[i] === 'queued' && (!backgroundPaused || preferred.has(i)))
    candidates.sort((a, b) => Number(preferred.has(b.i)) - Number(preferred.has(a.i)) ||
      Math.abs(a.asset.x + a.asset.width / 2 - focus) - Math.abs(b.asset.x + b.asset.width / 2 - focus))
    while (active < concurrency && candidates.length) {
      const { asset, i } = candidates.shift(), img = images[i]
      active++; state[i] = 'loading'; img.dataset.loadState = 'loading'
      img.fetchPriority = preferred.has(i) ? 'high' : 'low'
      img.src = asset.src
      img.decode().then(() => {
        if (!img.naturalWidth || !img.naturalHeight) throw new Error('Empty decoded image')
        state[i] = 'ready'
      }).catch(error => {
        state[i] = 'failed'
        console.error(`History image failed: ${asset.id}`, asset.src, error)
      }).finally(() => {
        active--
        if (disposed) return
        img.dataset.loadState = state[i]
        onChange()
        pump()
      })
    }
  }
  return {
    state,
    setBackgroundPaused(paused) { if (backgroundPaused === paused) return; backgroundPaused = paused; pump() },
    prioritize(indices, center) { preferred = new Set(indices); focus = center; pump() },
    dispose() { disposed = true },
  }
}
