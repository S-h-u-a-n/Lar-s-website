import test from 'node:test'
import assert from 'node:assert/strict'
import { getSpotifyEmbed } from './spotifyEmbed.js'

test('creates a compact Spotify track embed using the default light theme', () => {
  assert.deepEqual(getSpotifyEmbed('https://open.spotify.com/track/4uLU6hMCjMI75M1A2tKUQC'), {
    src: 'https://open.spotify.com/embed/track/4uLU6hMCjMI75M1A2tKUQC',
    height: 152,
  })
})

test('preserves Spotify embed URLs, removes unsupported theme overrides, and uses a taller player for collections', () => {
  assert.deepEqual(getSpotifyEmbed('https://open.spotify.com/embed/album/1DFixLWuPkv3KT3TnV35m3?theme=1'), {
    src: 'https://open.spotify.com/embed/album/1DFixLWuPkv3KT3TnV35m3',
    height: 352,
  })
})

test('normalizes localized Spotify share links', () => {
  assert.deepEqual(getSpotifyEmbed('https://open.spotify.com/intl-zh-TW/track/4uLU6hMCjMI75M1A2tKUQC'), {
    src: 'https://open.spotify.com/embed/track/4uLU6hMCjMI75M1A2tKUQC',
    height: 152,
  })
})

test('does not create an embed when no URL is configured', () => {
  assert.equal(getSpotifyEmbed(undefined), null)
})

test('rejects non-Spotify and unsupported URLs', () => {
  assert.throws(() => getSpotifyEmbed('https://example.com/track/123'), /must use https:\/\/open\.spotify\.com/)
  assert.throws(() => getSpotifyEmbed('https://open.spotify.com/artist/123'), /Unsupported Spotify embed URL/)
})
