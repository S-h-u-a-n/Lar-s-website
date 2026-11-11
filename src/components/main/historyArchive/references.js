// Normalize article identity only; keep the original URL for the clickable link.
export function referenceKey(href) {
  const url = new URL(href)
  const host = url.hostname.toLowerCase().replace(/\.m\.wikipedia\.org$/, '.wikipedia.org')
  if (host.endsWith('.wikipedia.org')) {
    let title = url.pathname.startsWith('/wiki/')
      ? decodeURIComponent(url.pathname.slice(6))
      : url.pathname === '/w/index.php' ? url.searchParams.get('title') : null
    if (title) {
      title = title.normalize('NFC').replace(/_/g, ' ').trim().replace(/ +/g, ' ')
      title = title[0].toUpperCase() + title.slice(1)
      return `${host}/wiki/${title}`
    }
  }
  url.hash = ''
  return url.href
}

export function collectReferences(record, sources) {
  const seen = new Set()
  // Section citations remain the source of truth; include any record-level extras.
  const ids = [...(record.sections || []).flatMap(section => section.sources || []), ...(record.sources || [])]
  return ids.flatMap(id => {
    const [label, href] = sources[id]
    const key = referenceKey(href)
    if (seen.has(key)) return []
    seen.add(key)
    return [{ id, label: label.replace(/^Wikipedia · /, ''), href }]
  })
}
