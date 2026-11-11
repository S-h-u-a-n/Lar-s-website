// A bounded application cache. Browser HTTP/decoded-resource caches remain browser-managed.
export function createDecodedImageCache({ limit = 8, maxDecodedBytes = 96 * 1024 * 1024, createImage = () => new Image() } = {}) {
  const ready = new Map(), pending = new Map()
  let decodedBytes = 0
  const bytes = image => (image.naturalWidth || 0) * (image.naturalHeight || 0) * 4
  function load(url) {
    if (ready.has(url)) {
      const image = ready.get(url)
      ready.delete(url); ready.set(url, image)
      return Promise.resolve(image)
    }
    if (pending.has(url)) return pending.get(url)
    const image = createImage()
    image.decoding = 'async'
    image.src = url
    const promise = Promise.resolve().then(() => image.decode()).then(() => {
      ready.set(url, image); decodedBytes += bytes(image)
      while (ready.size > limit || decodedBytes > maxDecodedBytes) {
        const oldest = ready.keys().next().value
        decodedBytes -= bytes(ready.get(oldest)); ready.delete(oldest)
      }
      return image
    }).finally(() => pending.delete(url))
    pending.set(url, promise)
    return promise
  }
  return { load, get size() { return ready.size }, get decodedBytes() { return decodedBytes }, get pendingCount() { return pending.size } }
}
export const characterImages = createDecodedImageCache()

// Each slot commits a complete pair. A superseded or unmounted request cannot commit.
export function createCharacterRequestGate(load) {
  let version = 0
  return {
    async request(next, commit, reject) {
      const current = ++version
      try {
        await Promise.all([load(next.bodyUrl), load(next.faceUrl)])
        if (current === version) commit(next)
      } catch (error) { if (current === version) reject(error) }
    },
    cancel() { version++ },
  }
}
