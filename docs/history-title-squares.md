# History title and floating squares verification

Preview: http://127.0.0.1:5186/history-test.html (`npm run dev`).

## Sources inspected and reused

Read-only source inspection and live Chrome observation of the formal entry/replay
preceded implementation. `GenesisLetters.jsx` is imported unchanged, including the
seven original text-image PNGs, cropped sticker geometry, spring keyframes, 450ms
initial delay, 85ms stagger, 340ms appearance, 620ms disappearance and cleanup on
`replayKey` changes. Its original hover behavior is retained.

Typography uses the same normal and italic Playfair Display variable TTFs in
`Font/En-1`, weight 400, italic pre-title and normal main title, main tracking
-0.045em and line-height 1.1. The formal edition's 3.7/7.5 size ratio and 4/113.4em
line gap are retained at the history title's original reference anchor/scale.
Scoped sticker CSS comes from `IntroScreen.css`; no global formal CSS is imported.
The replay SVG, 24px hit area and hover rotation follow the original control.

Squares use the 13 original `Art/IntroScreen/square/*.PNG` sources. Size weighting,
14–22 second float cycles, drift/sine sway/rotation, smooth fade and parent opacity
0.45 follow IntroSquares/edition styling. Thirty fixed seeded anchors cover ten
columns of the complete panorama; there is no random respawn on re-render.
A single square RAF updates only nearby squares, pauses in hidden documents and
uses no React state. Existing photo/interaction RAF can still sleep independently.
Reduced motion selects ten static squares. All photos remain above this layer.

## Configuration and implementation

`config.js`: `squares` count, seed, opacity, duration, reference scale, overscan and
reduced-motion count; `titlePlayback` type ratios, reserved height and 300px preload
margin. Square motion ranges are in `squareLayout.js`, adapted from the source.
`historyTitle.css` scopes original typography, sticker styles and replay dimensions.

`HistoryTitle.jsx` isolates title state/replays from HistoryTest's image/entrance
engine. It prepares stickers near the viewport and waits for font readiness and
complete visibility before one automatic playback. `titleVisibility.js` checks the
cached unanimated h1 layout rectangle, never the letters' animated rectangles.
Replay increments only the original component's replayKey; prior timers and
animations are cancelled by its existing cleanup.

## Actual checks

- Standalone Vite build passed; 12 Node tests passed, including image loader,
  entrance/hover/entry gesture regressions and new gate/layout tests.
- Chrome 1512×805: initial right viewport had autoPlays=0. At camera 0.10403,
  title x=-163.14 remained unplayed. At camera 0.02133, title x=30.06 and complete
  553.05×155.12 layout became visible: autoPlays=1 before reaching camera=0.
- Repeated clicks, including two in immediate succession, incremented replay state
  and produced the original active letter/sticker animation. Camera stayed exactly
  0.021328088778083162; opening stayed complete, entry state stayed idle.
- Leaving and returning, then moving to both full panorama ends, retained exactly
  one automatic play. Thirty square nodes persisted; right/left views displayed
  different subsets. All 35 original history images and 30 square image nodes
  completed loading with nonzero naturalWidth.
- Screenshot `history-title-squares.png` shows final title, control, preserved
  subtitle, artwork and original square palette. No history artwork was replaced.
- SHA256 comparison of 174 protected art/font/formal-source and existing history
  geometry/interaction/loader files found zero changes from task-start snapshots.

Physical trackpad behavior and frame rate on low-memory devices still need device
validation; these checks do not claim hardware performance profiling. Existing
standalone `genesis:history-enter` integration boundary is unchanged.
