import test from 'node:test'
import assert from 'node:assert/strict'

test('letter visibility persists across SPA navigation but resets on page reload', async () => {
  const previousStorage = Object.getOwnPropertyDescriptor(globalThis, 'sessionStorage')
  let storageAccesses = 0
  Object.defineProperty(globalThis, 'sessionStorage', {
    configurable: true,
    value: {
      getItem() { storageAccesses++; return '1' },
      setItem() { storageAccesses++ },
    },
  })

  try {
    const pageSession = await import(`./letterSession.js?session=${Date.now()}`)
    assert.equal(pageSession.hasSeenWeatherLetter(), false)

    pageSession.markWeatherLetterSeen()
    assert.equal(pageSession.hasSeenWeatherLetter(), true)
    assert.equal(pageSession.hasSeenWeatherLetter(), true, 'returning through SPA navigation keeps the in-memory state')

    const reloadedPage = await import(`./letterSession.js?reload=${Date.now()}`)
    assert.equal(reloadedPage.hasSeenWeatherLetter(), false, 'a page reload starts with a fresh module state')
    assert.equal(storageAccesses, 0, 'persistent storage must not affect automatic display')
  } finally {
    if (previousStorage) Object.defineProperty(globalThis, 'sessionStorage', previousStorage)
    else delete globalThis.sessionStorage
  }
})
