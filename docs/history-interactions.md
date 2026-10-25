# History interaction update verification — 2026-10-25

Preview: http://127.0.0.1:5186/history-test.html . Existing `npm run dev`.

## Implementation

Kept reference coordinates, sizes, original stacking, horizontal direction/gain,
original high-resolution images, outline shadows and background inertia settings.
Kept global character motion (impulse .0385, maxAngle 3.675, stiffness 72, damping 13).
Only the character pivot changes to its actual foot, as requested.

Opening: visible maps begin at 0ms (620ms duration), people at 140ms (720ms),
background fades at 260ms (500ms). Slide distance is enough to place the actual
silhouette below the viewport, at least the configured CSS distance. EaseOutBack
overshoot is .65. Final translation is exactly zero. Offscreen art is not staged.
Unrelated background decodes pause during opening; two-slot loading, destination
priority, persistent image sources and input remain available.

Foot pivots and packed alpha masks are sidecar metadata, not replacement artwork.
Every foot pivot was visually checked on an analysis contact sheet. Hover scale
is 1.10, foot-anchored; local directional spring push is composed with the existing
spring into a single transform. Alpha hit mapping accounts for current perspective,
rotation, translation and scale. Live paint order selects only one opaque person.
Temporary z=81/80 returns to original z=20 after release/settling.

Arrow is a noninteractive screen-fixed ← at left 22px / top 46%, size 32px,
3px float. It fades after effective scroll and remains dismissed even on return.
The subtitle is live Times New Roman text at 72 reference pixels, 45px gap,
400ms fade, under the original title. No other copy, button or decoration was added.

## Actual browser verification

Chrome at 1512 × 805; browser pointer movement/clicks were used to position the
cursor on inert images (there are no click handlers). No image derivative is served.

- 35/35 original image sources loaded. Original art/reference placements remain
  SHA-256 identical. App, main, IntroScreen JSX/CSS, and inertiaParallax are unchanged.
- Actual opening trace: at 100ms map was moving, people still hidden, layers opacity
  zero; at ~167ms people had begun moving; at ~367ms backgrounds were fading;
  at ~642ms map was settled and people had a small negative Y overshoot. Final
  opening state complete, every staged transform settled to its normal position.
  After staging the decode queue, a fresh run recorded 42 opening RAF samples.
  This is observation, not a controlled FPS benchmark or hardware-wide guarantee.
- All 18 actual DOM transform origins use individual foot coordinates (roughly
  94–99% of original image height, with different X positions), not bottom-center.
- Individually visited people-1 through people-18 across the strip and moved the
  pointer to an opaque torso point: all 18 selected the expected ID; hovered count
  was exactly one each time.
- people-1 held scale=1.1000, z=81, and its push count stayed at one while stationary.
  Moving into its transparent PNG margin cleared hover. It returned to scale=1.0000
  and z=20; people-2 could be independently selected next.
- Original global response remains present on pointer/wheel movement. Other people
  stay scale=1 while the selected person enlarges. Foot-fixed geometry plus inverse
  projection are covered by tests. Representative screenshots show intact bodies,
  feet, silhouettes and shadows, without parent cropping.
- Scroll to left with a very large native wheel operation, immediately continue
  in the same direction: camera=0, subtitle visible, entry-state stayed idle.
- Reverse to right: camera=1, arrow opacity=0 and dismissed=true. Return to left
  with continuous input: still idle. After a real elapsed idle gap, a new forward
  wheel operation changed entry-state to requested, requests=1. Additional forward
  input left requests=1. Standalone stayed on the history page, as intended.
- Left title and subtitle visually checked. The original main title geometry is
  retained. Screenshots: history-entry-hint.png, history-hover-foot.png.
- Initial dev HMR previously produced duplicate-createRoot warnings. Bootstrap
  was separated into entry.jsx and the exported component HistoryTest.jsx; later
  component updates do not recreate the root. Historical logs may remain in the
  old browser tab; validate new navigation for current errors.

## Automated checks

Ten checks pass across interactions.test.mjs and imageLoader.test.mjs:
load priority/concurrency/no duplicate sources; decode failure isolation; disposal;
opening priority pause/resume; continuous momentum rejection and once-only trigger;
reverse/leave/early-gesture rejection; entry ordering/overshoot/exact endpoint;
foot-pivot 3D projection inverse; all packed masks/foot ranges/transparent corners;
hover scale settling to 1.10 then exactly 1. Independent Vite entry build passed.

## Deliberately not connected

Formal flow was read, not modified: IntroScreen calls App's guarded
beginComicTransition, which owns transitioning -> comic after 900ms; the existing
IntroScreen controls its exit animation, and later navigation uses shared transition
components. Standalone cannot safely drive that private state machine.

This page therefore emits one `genesis:history-enter` event and supports an optional
`onEnter` prop. It does not navigate or fake a transition. Future integration needs
an explicitly authorized App entry slot plus the existing callback and exit lifecycle,
keeping the official intro -> comic ordering intact.

## Limits still needing device checks

WheelEvent lacks a portable physical gesture/momentum phase. The implemented rule
requires 650ms quiet/dwell and 60px fresh intent within 400ms; simulated continuous
tails are covered, but physical mouse/trackpad hardware still needs validation.
No claim is made that all intermittent momentum patterns can be perfectly identified.
Full Safari/Firefox, reduced-motion OS setting, and mobile viewport checks were not
performed in this update. The original high-resolution decode footprint remains
material; no resolution was reduced or extra artwork generated to conceal that cost.

Final normal-URL reload (profiling off): ready=true, opening=complete, camera=1,
entry-state=idle, 35 decoded images, arrow opacity=.7. No new warnings/errors
were captured after that reload.

## Files changed in this update

Modified: src/dev/history/entry.jsx, config.js, history.css, imageLoader.js,
imageLoader.test.mjs, README.md.
Added: src/dev/history/HistoryTest.jsx, interactionMath.js, entryGesture.js,
interactionGeometry.json, interactions.test.mjs; docs/history-interactions.md,
docs/history-hover-foot.png, docs/history-entry-hint.png.
