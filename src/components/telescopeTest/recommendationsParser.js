export function parseRecommendations(markdown, avatarUrls = {}) {
  const recommendations = markdown.split(/^## /m).slice(1).map(section => {
    const [id] = section.split(/\r?\n/, 1)
    const fields = Object.fromEntries(
      section.split(/\r?\n/).flatMap(line => {
        const match = line.match(/^- ([a-zA-Z]+):\s*(.*)$/)
        return match ? [[match[1], match[2]]] : []
      }),
    )
    const required = [
      'characterId', 'characterName', 'locationName', 'englishName', 'country',
      'quote', 'introduction', 'visitInfo', 'latitude', 'longitude', 'website',
      'avatarPath', 'photoPath',
    ]
    const missing = required.filter(field => !fields[field])
    if (missing.length) throw new Error(`Recommendation "${id}" is missing: ${missing.join(', ')}`)

    const latitude = Number(fields.latitude)
    const longitude = Number(fields.longitude)
    const zoom = fields.zoom === undefined ? 12 : Number(fields.zoom)
    const website = new URL(fields.website)
    if (id !== fields.characterId) throw new Error(`Recommendation id does not match characterId: ${id}`)
    if (!Number.isFinite(latitude) || Math.abs(latitude) > 90) throw new Error(`Invalid latitude in recommendation "${id}"`)
    if (!Number.isFinite(longitude) || Math.abs(longitude) > 180) throw new Error(`Invalid longitude in recommendation "${id}"`)
    if (!Number.isFinite(zoom) || zoom < 1 || zoom > 16) throw new Error(`Invalid zoom in recommendation "${id}"`)
    if (website.protocol !== 'https:') throw new Error(`Recommendation website must use HTTPS: ${id}`)

    return {
      id,
      ...fields,
      latitude,
      longitude,
      zoom,
      avatarSrc: avatarUrls[fields.avatarPath] ?? null,
    }
  })
  const ids = recommendations.map(place => place.id)
  if (new Set(ids).size !== ids.length) throw new Error('Recommendation character IDs must be unique')
  return recommendations
}
