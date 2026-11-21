# Portal comic integration — 2026-10-10

## Files
- `src/App.jsx`: five comic destinations, completion/arrival state machine, existing BACK routing, icon preload, lazy destination mount under the curve cover.
- `src/components/MainScene.jsx`: five portal clicks always start navigation, including repeat visits. Other model interaction branches unchanged.
- `src/components/CurveTransition.jsx`: optional color/icon configuration. Existing curve paths, variants, easing, 0.75s cover/reveal, 0.35s reveal delay and default black appearance unchanged.
- `src/components/portalComics/config.js`: five separate comic data entries, actual PNG imports, colors, central square/icon sizing.
- `src/components/portalComics/ComicPages.jsx`: GlobeComicPage, NaturalComicPage, HumanComicPage, BallComicPage, shared placeholder and lazy-page arrival wrapper.
- `src/components/portalComics/ComicPages.css`: placeholder layout; arrival uses existing `home-page-arrive` keyframes, 700ms ease, as Main does.

## Routing
| Model ID | Comic screen | Functional component |
| --- | --- | --- |
| globe | GlobeComicPage | GlobeTest |
| telescope | existing TComicPage | TelescopeTest |
| book-open1 | NaturalComicPage | NaturalTest |
| book-close1 | HumanComicPage | HumanTest |
| ball | BallComicPage | BallTest |

Big → comic continues using existing CircularReveal. At comic completion, the existing CurveTransition covers the viewport, then the comic unmounts and the lazy functional page mounts once. After its committed arrival animation finishes, the cover reveals. A ref guard rejects repeated completion/navigation requests. The cover returns offscreen with pointer-events none; BACK clears portal state.

TComicPage source, materials, timing, editor IDs and reading logic were not changed. Only its App onComplete callback changed. Story → Main retains its original state handlers and black default transition.

## Configuration and editing
Colors come from BigTest's palette. In config, the five background/square pairs are pink/yellow, peach/teal, yellow/pink, blue/peach, teal/yellow. Icons use `Art/Big/Big-icon/icon-{globe,telescope,book1,book2,ball}.PNG`, preserving aspect ratio.

Each new comic has independent `panels` data, screen identifier and TEXT IDs `{screen}-title`, `-back`, `-placeholder`, `-continue`. Storage uses the existing `genesis:text-editor:{screen}:v1` mechanism; no existing key was reset or migrated. Future panels accept `{id, src, alt}`. Named page components can be individually extended.

## Actual verification
Chrome, local Vite server at 127.0.0.1:5174:
- 1512×861: all five model clicks reached their respective comic; four CONTINUE buttons and the existing Telescope reading completion reached the appropriate Test component. All five functional BACK buttons returned to Big.
- Telescope existing comic advanced through its original sequence and reached the new Telescope interface with real map UI.
- Natural and Telescope transitions were checked after completion: both curve overlays had pointer-events none and SVG top 100vh.
- 1100×700: formal root flow Intro → Story → Main → Big completed; Natural comic, CONTINUE, functional BACK, repeated Natural entry and comic BACK all worked. Placeholder and functional page remained readable.
- During Natural transition, DOM confirmed yellow path fill and exact `icon-book1.PNG` image URL; default Story curve remained unthemed.
- Temporary viewport override restored.
- `npm run build` and `git diff --check` passed. Existing large bundle warning remains.

Not exhaustively tested: every animation frame for flashes, rapid repeated clicks under artificial network delays, every viewport size, full internals of five functional pages, editor save/reload for all new comic strings, standalone production-preview browser run. Existing functional/editor source was left unchanged. No assets or storage were deleted; no commit/push.
