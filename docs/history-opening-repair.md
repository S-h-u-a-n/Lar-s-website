# Official history opening: diagnosis and verification

## Actual pre-fix evidence

Formal root /?profile=1, Chrome, viewport 1512×861. Existing priority/decode queue
already awaited the required initial images. The first trace showed travel at
0/8/17/25ms followed by a 200ms missing frame interval; another gap was 508.4ms.
Only ten opening samples were collected before 858ms. Render callback costs were
mostly 0.1–0.4ms (max 3.4ms), and Long Task observation captured 198ms and 503ms
blocks. A second pre-fix run using Long Animation Frame observations showed large
renderStart→styleAndLayoutStart intervals with no long script attribution. This
supports rendering/raster/compositing work, not React state churn or wheel handlers,
as the dominant measured stall. Exact GPU upload time is not exposed by this API;
we do not claim a device-level GPU trace.

Source review confirmed all art was hidden until its first moving frame, with
transparent PNGs and contour filters receiving their first visible rendering then.
Each background source is 11166×2620 (~111.6 MiB decoded RGBA per source). The
existing loader's decode completion does not guarantee a ready raster/compositor
surface. All three backgrounds also used the same layer delay/duration/progress,
so their opacities were identical by construction; frame stalls could skip most
of that shared fade. There was no independent layer stagger.

## Repair and isolated experiment

- Keep original PNGs, drop shadows, travel distance, 620ms map / 720ms people timing,
  140ms people delay and .65 overshoot. Build compositor keyframes from the original
  entranceProgress curve. Independent initial image nodes remain unchanged.
- Prepare only decoded initial-viewport actors, one per rendered preparation frame,
  at their resting position and .001 opacity with targeted will-change. The visible
  animation clock starts after that actual painting work, not after a timeout/retry.
  Non-priority art decode stays deferred through opening, as before.
- Outer item transform/opacity belongs to the opening animation. A same-sized inner
  history-motion element owns existing foot-pivot sway and hover transforms. Original
  math and hit masks are unchanged. Background parallax owns transform; fade owns
  opacity. No per-frame React state updates or additional image downloads are added.
- Each background has its own WAAPI instance: starts 260/380/500ms, duration 500ms.
  Stagger=120ms is centralized in config.js. They do not translate vertically.
- An intermediate experiment cancelling/demoting each completed actor produced new
  166.7/250ms stalls around map/people completion. Keeping those prepared surfaces
  while visible removed these stalls in the next run. Finished surfaces are released
  only after opening when offscreen, or synchronously on unmount; only initial actors
  are promoted. This intentionally trades bounded visible-surface memory for smoothness.
- Reduced-motion changes cancel travel/fades. Asset failures are never warmed/shown.

## Measured after

Same dev root/viewport: 120 opening samples; max continuous RAF gap 9.3ms; none >20ms.
The trace contains uninterrupted small translation increments through the rebound,
ending at exact zero. Rendering work still exists during the preparation phase;
it is no longer inside the moving/fading sequence. It has not been eliminated.

Production build root /?profile=1 was reloaded twice. 119/120 opening samples,
maximum rounded sample interval 17ms, with no observed long-animation-frame entry
starting within the sampled 1000ms opening. At ~533ms actual computed layer opacity:
layer-1=.569686, layer-2=.224444, layer-3=.0127188. All finish at opacity=1; map/people
outer transforms finish at identity, backgrounds at none. This verifies actual
computed effects rather than merely different configuration values.

Post-opening production hover: people-1 scale=1.1, foot origin inherited correctly,
label=people-1, outer resting, inner owns perspective/rotation/scale. After scrolling,
layer offsets were -7.32184/-4.39311/-1.46437px, and no offscreen initial actor retained
will-change. Existing labels, text, artwork dimensions and registration were not edited.
18 history Node tests passed. Production build passed (existing chunk-size warnings).

Instrumentation: diagnostics.js adds supported Long Animation Frame reporting only
when profile=1. HistoryTest profile traces now sample all three computed opacities,
computed entrance transforms and the absolute opening start for phase correlation.
Raw run evidence is summarized from local /private/tmp/history-opening-*.json files.
Hardware/browser-dependent smoothness cannot be guaranteed from one computer; no
low-memory GPU profiling or exhaustive device matrix was performed.

## Modified files

HistoryTest.jsx, history.css, config.js, diagnostics.js; new openingAnimation.js and
openingAnimation.test.mjs. README and this report document the repair. No App flow,
other page, historical label copy/placement, shadow value or source art was changed.
