const SPOTIFY_CONTENT_TYPES = new Set(['track', 'album', 'playlist', 'episode', 'show'])

export function getSpotifyEmbed(spotifyEmbedUrl) {
  if (!spotifyEmbedUrl) return null

  let url
  try {
    url = new URL(spotifyEmbedUrl)
  } catch {
    throw new Error(`Invalid Spotify embed URL: ${spotifyEmbedUrl}`)
  }
  if (url.protocol !== 'https:' || url.hostname !== 'open.spotify.com') {
    throw new Error(`Spotify embed URL must use https://open.spotify.com: ${spotifyEmbedUrl}`)
  }

  const path = url.pathname.split('/').filter(Boolean)
  if (path[0]?.startsWith('intl-')) path.shift()
  if (path[0] === 'embed') path.shift()
  const [type, id] = path
  if (!SPOTIFY_CONTENT_TYPES.has(type) || !/^[\da-z]+$/i.test(id ?? '')) {
    throw new Error(`Unsupported Spotify embed URL: ${spotifyEmbedUrl}`)
  }

  url.pathname = `/embed/${type}/${id}`
  url.searchParams.delete('theme')
  return { src: url.toString(), height: ['track', 'episode'].includes(type) ? 152 : 352 }
}
