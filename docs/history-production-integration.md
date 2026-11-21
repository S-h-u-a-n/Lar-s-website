# Official history entrance integration

## Entry points and shared implementation

- Official development root: http://127.0.0.1:5186/
- Production build preview: http://127.0.0.1:4186/ (`npm run build`, `npm run preview`).
- Independent debug bootstrap retained: /history-test.html on the dev server.
- App directly imports the same `src/dev/history/HistoryTest.jsx` used by the debug
  bootstrap. The dev directory name does not gate it behind DEV or a query flag.
  No duplicated artwork configuration or second animation implementation exists.
- Default state is still `intro`; its rendered component is now HistoryEntrance.
  The old IntroScreen import/mount is removed. IntroScreen/IntroEarth/IntroSquares
  files and assets remain on disk as backup. GenesisLetters remains shared.
- Existing edition/development deep links keep their destinations and order.

## Handoff

The unchanged endpoint gesture guard requires arrival, 650ms idle/dwell and a new
60px forward gesture within 400ms. Continuous momentum cannot satisfy a new quiet
period; reverse scroll remains available before requesting entry. There is still
no portable physical trackpad gesture-phase API, so unusual real-device momentum
needs device validation.

The gesture's existing onEnter callback now calls App.beginComicTransition.
App stays `transitioning` while mounting the original ComicIntro behind the opaque
history entrance. ComicIntro only adds an optional onReady notification when its
existing asset loading phase has completed (or its existing error UI is reached).
The original comic art, state machine, layout, narration and interactions stay intact.

On readiness, App starts its existing 900ms timer and the panorama fades using the
old entry easing cubic-bezier(.22,1,.36,1). No old IntroScreen is mounted between
states. The underlying comic is inert during handoff; after 900ms state becomes
`comic`, panorama unmounts and comic interactions are released. Loading a slow
comic cannot cause the panorama to disappear first. The normal comic entrance
animation progresses underneath the crossfade; it is not recreated or duplicated.

History wheel intent is locked after requesting handoff. The document overflow/
overscroll lock is restored on unmount. Root sizing/overflow CSS was moved into
standalone.css, so importing the panorama cannot permanently lock the home page.
Both panorama and square RAF engines synchronously clean up via useLayoutEffect:
production testing caught and fixed a final-frame access to detached refs that
passive useEffect cleanup had allowed during real unmounts.

## Files changed in this integration

- src/App.jsx: swap default entrance, comic readiness + existing timer handoff.
- src/components/ComicIntro.jsx: optional readiness notification only.
- src/dev/history/HistoryTest.jsx: handoff props, temporary body lock, synchronous cleanup.
- src/dev/history/HistorySquares.jsx: synchronous cleanup on unmount.
- src/dev/history/history.css: scoped entrance stacking, original duration/easing fade,
  scoped content-box compatibility with the standalone composition.
- src/dev/history/entry.jsx and new standalone.css: debug-only root CSS.
- src/dev/history/README.md and this report; two screenshot artifacts.

## Actual verification

- Production `npm run build` passed (existing large-chunk warnings remain).
- All 12 history Node tests passed, covering loader priority/decode, entrance,
  endpoint momentum guard, foot/alpha hit math, hover, title gate and square layout.
- Live Chrome dev root: initial camera=1, opening completed, no .intro-screen.
  All 35 original images decoded. Hover people-1 reached scale(1.1), origin
  56.4248% 95.2078%, and returned to its base; the original foot pivot is preserved.
- Mid-scroll actual layer displacements were -5.50882/-3.30529/-1.10176 CSS px;
  the existing three-layer inertia differences are active. Thirty square nodes remain.
- One long scroll reached camera=0 while App stayed intro and entryState idle.
  Title autoPlays=1; replay worked. A fresh forward gesture produced exactly one
  entry request and mounted comic loading behind opaque history. Vertical forward
  was verified on dev; horizontal left forward was verified in production preview.
- Production preview observed comic entering with history leaving=true and opacity
  0.958204, then history detached and App became comic. No old intro appeared.
- After the synchronous cleanup fix, a rebuilt production run completed another
  full handoff with no new console errors (earlier captured errors belonged only
  to the pre-fix bundle). Dev StrictMode refresh/remount also completed normally.
- Comic click advanced narration, and its existing “前往世界封面” curtain reached home.
  At home history was absent and body.style.overflow was restored to its prior value.
  Reload returned to the new entrance, not the retired intro. Independent preview
  also remained available and mounted the same history component.
- Production home → research room navigation completed; the 3D room and all six
  tool buttons became interactive, with no history node or lingering overflow lock.
- Browser screenshots: history-production-entrance.png, history-production-comic.png.

Art, fonts, placements, geometry masks, config.js behavior values, inertia logic,
imageLoader and the retired IntroScreen files were not edited. Existing unrelated
workspace edits were preserved. Other portal designs were not changed; exhaustive
portal navigation, physical trackpad momentum and low-memory GPU performance were
not re-profiled in this integration. This changes the local project/build only;
no hosted deployment was performed.
