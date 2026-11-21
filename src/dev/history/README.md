# Shared history entrance panorama

Run `npm run dev`, open http://127.0.0.1:5186/ for the official entrance.
`App` imports this same component; no second panorama implementation exists.
The retained http://127.0.0.1:5186/history-test.html bootstrap is an independent
debug preview with no navigation callback. The production build uses index.html.
See `docs/history-production-integration.md` for the formal handoff and checks.

## Files and adjustment

- `InitialHistoryTitle.jsx` / `initialHistoryTitle.css`: approved initial C title,
  1200ms two-line entrance, indefinite hold, 800ms shared text/haze fade on actual
  camera travel. Separate from the original far-left `HistoryTitle` and replay.
- `initialPeopleHint.js`: one pass through the first three decoded, visible
  silhouettes in right-to-left order. Begins 1050ms after opening; uses the same
  1.10 hover scale and inherited foot origin. Each scale-only pulse lasts 500ms;
  starts are staggered 180ms (0–500 / 180–680 / 360–860ms). The larger of real
  hover and cue scale wins without writing to hover state. Scroll departure
  cancels pending cues and smoothly restores active cues over 120ms;
  reduced motion skips them. No click events or label activation are synthesized.
  Existing people expose hover/labels, not a content-opening click handler.

Formal integration checks: all 24 history tests pass. Chrome confirms C holds after
the cue sequence, people-1/2/3 cue in that order, real hover stays at 1.10 after
the sequence, boundary wheel retains the title,
actual travel fades/removes it, early travel cancels pending cues, and the left
GENESIS replay and Into the World button still enter the existing storybook flow.

- `HistoryTest.jsx`: the exported standalone component, one RAF loop, immutable
  image wrappers, input handling, composed entrance/global/local transforms.
- `entry.jsx`: bootstrap only, so component HMR does not recreate the React root.
- `placements.json`: original 12524 × 2620 reference-space x/y/width/height,
  alpha bounds and registration evidence. Unchanged by the interaction update.
- `interactionGeometry.json`: per-person `foot` pivot percentages and packed
  256px-long-edge alpha hit masks. `foot` is editable independently of placement.
  Pivots were extracted from actual lowest opaque foot silhouettes and visually
  checked. Masks include opaque paper borders and use alpha >48; image appearance
  is not downsampled or replaced. Foot analysis used alpha >128.
- `config.js`: all adjustable behavior. `entrance` has group delay/duration,
  minimum CSS entry distance and restrained easeOutBack overshoot. Map 0/620ms,
  people 140/720ms, layer fades start at 260/380/500ms, each lasts 500ms: complete in 1000ms
  after decoded initial assets receive staged raster/compositor preparation.
  `arrow` controls fixed left/top/font size/floating/fade. `hover` controls 1.10
  scale, push impulse, spring/damping, composed angle limits and debounce.
  `entryHint` controls subtitle size/gap/fade. `entryGesture` controls idle/dwell/
  gesture window/threshold. Original `motion`, `parallax`, `parallaxDynamics`,
  `shadow`, placement and scroll gain are retained.
- `interactionMath.js`: entrance interpolation, spring, inverse 3D projection and
  alpha sampling. No layout read/getImageData inside pointer handling.
- `inertiaParallax.js`: unchanged background-only velocity spring.
- `imageLoader.js`: two concurrent source/decode operations; right/target viewport
  priority. During opening, non-priority decode work is deferred; new destinations
  can still be prioritized. All sources stay assigned, no offscreen unmount/reload.
- `entryGesture.js`: conservative post-arrival wheel state machine.
- `history.css`: scoped layout, persistent arrow fade and subtitle styling.

## Opening and hover

Only the initial actual viewport assets are staged. Other art remains in its
original layout and appears normally if the user scrolls during opening. Input
is never locked. The same RAF combines entry translateY, the unchanged whole-row
spring, local push/tilt, and scale, with each character's true foot pivot.
Background opacity and parallax compose independently. A single final transform
avoids CSS/JS animation competition. Settled transforms are removed.

Pointer hits are converted back through the composed foot scale, rotateZ,
rotateX and perspective before testing cached alpha bits. Topmost opaque character
wins according to live z-index and DOM painting order. Selected artwork temporarily
uses z=81; exiting scale uses z=80 until settled, then the original z is restored.
Entry is suppressed until that character has finished arriving. Scrolling clears
hover intent, with 140ms scroll quiet, 90ms exit hysteresis and 300ms push cooldown.
A stationary hover holds 1.10 but does not continuously add angular impulses.
No click handler, pointer cursor or click destination is added.

Reduced motion skips entrance travel/fade timing and rotation/parallax. The arrow
stops floating. Images remain original PNGs, and no filtered or merged art is made.

## End gesture and integration boundary

`Into the World ←` appears below the unchanged title at the actual left endpoint.
Arrival is separate from entry intent: the title must be reached and opening
complete, then wheel input must pause for 650ms; a new forward gesture must supply
60 CSS px within 400ms. Continuing momentum extends the idle timer. Reverse input
cancels the candidate; leaving the endpoint resets arrival. A trigger is locked
for the rest of this mount. Scrolling back remains possible in standalone mode.

On a valid gesture, `HistoryTest` calls optional `onEnter` and dispatches the
bubbling DOM event `genesis:history-enter`, detail:
`{ next: 'comic', source: 'history-test' }`.
It sets main `data-entry-state="requested"`, `data-entry-requests="1"` for QA.
Standalone has no navigation callback: it deliberately does not redirect, fade out
or mount another page. There is no imitation transition.

Read-only inspection of formal flow found:
`IntroScreen.beginEntry -> App.beginComicTransition -> transitioning -> 900ms -> comic`.
The current IntroScreen owns its leaving animation; App owns story state and later
curve/circular transitions. Future authorized integration should mount HistoryTest
in a controlled entry slot and pass the existing callback/transition state, preserving
`intro -> comic` order and the shared transition lifecycle. The formal integration now uses this App-owned state sequence and an optional
ComicIntro readiness callback; see the production integration notes.

WheelEvent has no portable physical trackpad phase flag. The idle/dwell/budget
rule blocks continuous tails, but a real device with unusual long silent gaps
cannot be perfectly classified. Physical-trackpad validation remains necessary.

## Verification

Run `node --test src/dev/history/interactions.test.mjs src/dev/history/imageLoader.test.mjs`.
See `docs/history-interactions.md` for actual browser checks and limitations.
`?profile=1` enables invisible original performance telemetry plus a bounded
`data-opening-trace` of actual initial wrapper transforms/opacity. It is off normally.

During formal handoff, `disabled` stops further wheel intent and `leaving` fades
the panorama using the existing 900ms entry duration. The document scroll lock is
restored on unmount. Both image-animation engines use synchronous layout-effect
cleanup so no RAF can paint after React detaches their image refs. Root document
sizing lives in `standalone.css`, imported only by the debug bootstrap.

## Original entry title and squares

`HistoryTitle.jsx` reuses unchanged `GenesisLetters` with a complete-layout,
font-ready, one-time visibility gate (`titleVisibility.js`); replay changes only
its local replayKey. `historyTitle.css` scopes original Playfair typography and
sticker/control rules. The title remains at the existing reference anchor.
`HistorySquares.jsx` / `squareLayout.js` / `historySquares.css` reuse original PNG
square assets and float vocabulary with deterministic full-panorama distribution,
visible-only painting and a single paused-when-hidden animation loop.
Adjust `config.js` → `titlePlayback` and `squares`. Full source/verification notes:
`docs/history-title-squares.md`. Run all checks: `node --test src/dev/history/*.test.mjs`.

## Historical paper labels

`labels.js` centralizes all 18 names/dates and label spacing/fade parameters.
`HistoryLabel.jsx` is a single viewport overlay, driven by the existing `hovered`
alpha-hit result; it adds no hover listeners, pointer targets or per-frame React
state. Its one ResizeObserver tracks text/font dimensions, and its short WAAPI
fade is cancelled on replacement/unmount. `historyLabel.css` scopes the paper style.

`labelPosition.js` derives upper-side contour points from the same alpha-hit masks,
excluding transparent padding and lower-body props. Paper corners sit 14 CSS px
from the current person's steady hover contour. Upper-right is the default;
only viewport edges can select upper-left or clamp the position. Neighbor/title
avoidance and maximum-sway envelopes are deliberately absent, preserving ownership
and proximity. Placement follows camera/layout without inheriting instantaneous
rotation or scale. The paper background is #fefdf9 with 12px 0 12px 0 corners.
See `docs/history-labels.md` for mapping evidence and actual browser checks.

## Opening rendering repair

`openingAnimation.js` retains the existing easeOutBack travel/overshoot and source
resolution. Initial decoded actors paint at opacity .001 at their resting location,
one per preparation frame, before the opening clock starts. This primes filtered
raster surfaces instead of first painting them during visible travel. WAAPI drives
outer transform/opacity; the inner `.history-motion` owns foot sway/hover transform.
Background fades have independent delays (layer.stagger in config.js); parallax
continues to own their outer horizontal transform, not their opacity.

Prepared surfaces remain while visible: removing a finished map surface at 620ms
caused a measured repaint stall during the still-running people/fade animations.
They are released offscreen after opening or on unmount; no blanket promotion of
all 35 source images is used. Reduced motion cancels opening travel/fades promptly.
See `docs/history-opening-repair.md` for before/after browser measurements.

## Into the World entry control

The existing title container is left-aligned, matching its already-left-aligned
heading. The hint is a visually reset native button, retaining the original Times
font, scaled size/color, gap and fade. It is disabled outside the left endpoint or
while entering, so invisible text is not in the Tab order. Native Tab/Enter/Space
work without a separate keyboard handler. Click and wheel call the same local
requestEntry function, guarded by one immediate entryRequested latch plus the
existing readiness/end/disabled checks. They use the same onEnter callback and
App-owned comic transition. Neither changes the camera position. Existing wheel
quiet/dwell/momentum rules and title/replay animation remain unchanged.

Browser checks: main-title/hint x both 85.4375 at 1512×861; original Times font,
23.6611px size and rgb(104,27,11) color. Double click followed by wheel produced
one request at camera=0 and entered comic. Tab from replay focused the native
Into the World button; Enter produced one request. Hidden control was disabled.
