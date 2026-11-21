# Initial title animation experiment

Archived after formal integration: the `intro-title-test` query now opens the
official App, without lab controls or a second overlay. Approved C lives in
`../history/InitialHistoryTitle.jsx` and `../history/initialHistoryTitle.css`.
The files here retain the comparison source only and are no longer loaded.

Development URL: `http://127.0.0.1:5186/?dev=intro-title-test`

The entry wraps the existing App and renders a separate, pointer-transparent overlay.
HistoryTest, the panorama camera, the existing far-left HistoryTitle, and App-owned
Into the World transitions are reused unchanged. Only main.jsx selects this module,
and only in Vite development mode. The retired cover experiment is not imported.

Reference: `reference/intro-reference.png`, PNG RGBA, 3024 × 1720.
The reference has no embedded font specification; Arial bold is the visual match
used here. Color is #502419. Placement, type sizes and line gap live in introTitle.css.
The haze is a separate blurred radial gradient behind crisp text, with transparent
edges. Both belong to the same parent fade and are unmounted together.

Default: C. Timing: B has a 1500ms entrance (1291ms letter travel plus the existing
maximum 209ms stagger); A/C retain 1200ms. B uses a gentler easing curve and its
haze fades in over the entrance; letters and their ancestors stay at opacity 1.
The shared parent still handles the unchanged 800ms exit. Full display has no
timeout: only a change in HistoryTest's existing `data-camera` starts exit.
During entrance, that change pauses the current pose before fading the parent.
A/B/C share identical
final DOM layout and CSS. Replay remounts only the overlay, not App or HistoryTest.
The title starts once the panorama reports presentation readiness. A scoped
MutationObserver reads the rendered camera; there are no extra input listeners or
scroll controllers. Clicks, hover and wheel input clamped at the edge do not exit.
Further scrolling cannot replay a completed title; only lab controls can replay it.
Reduced motion uses short fades.

## Source review

- https://reactbits.dev/text-animations/split-text
- https://github.com/DavidHDev/react-bits/blob/main/src/content/TextAnimations/SplitText/SplitText.jsx
- https://github.com/DavidHDev/react-bits/blob/main/LICENSE.md

Reviewed November 3, 2026. Official implementation imports gsap, gsap/ScrollTrigger,
gsap/SplitText and @gsap/react. It supports character staggering, custom from/to,
font readiness, reduced motion and cleanup. License is MIT + Commons Clause:
application/website use is permitted; selling or redistributing the components
themselves is restricted; copied substantial source requires retaining its notice.

This experiment independently implements character staggering with native Web
Animations, without copying the official component or adding dependencies. It
compares the requested movement styles; it does not benchmark GSAP SplitText.

## Verification

- Vite production build passes; this development-only experiment is excluded.
- Chrome: all three choices and replay work without navigation/reloading App.
- Display remains indefinitely until the rendered camera changes.
- Exit freezes the current entrance pose and removes the overlay and haze together.
- CSS and effect cleanup are shared across A/B/C; no per-variant final geometry.
- Official HistoryTest, HistoryTitle and App were not edited for this experiment.
