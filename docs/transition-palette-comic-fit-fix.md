# Transition palette and complete comic fit correction — 2026-10-10

## Actual fault and corrections
Telescope's frame measurement ran in the child's layout effect before the parent frame ref was available. It returned without measuring and never retried, leaving the full-window scale active. This was reproduced in Chrome: 21 of 27 art/text boxes exceeded the frame's 20px safety area at 1512×861.

Frame measurement now runs after refs are committed. Before the frame is measured, the stage remains hidden to avoid showing an incorrect initial size. ResizeObserver tracks available frame dimensions. The nominal design remains 1920×1080; saved percentage coordinates and dialogue-local pixel coordinates are unchanged.

The editor measures all rendered image/text rectangles, including currently hidden sequence items, rotations and user offsets, in the unscaled design coordinates. Their union with the nominal stage forms complete content bounds B. Uniform scale = min((frameWidth − 48)/B.width, (frameHeight − 48)/B.height). Translation centers B in the available rectangle and compensates B's minimum x/y. No overflow clipping is used to fit the art. Content size/text/config changes remeasure bounds; text already accounts for ancestor transforms during drag.

Return now randomly captures one complete preset (background, square, official PNG icon) once in transition state. Geometric placeholders are removed. Curve fill uses the overlay's CSS variable; during the covered stage the actual fixed full-screen overlay also receives the same background color. Original curve timing, paths and Story/Main default black appearance remain unchanged.

## Central configuration
`src/components/portalComics/config.js`

| Fixed portal | Background | Square | Official icon |
| --- | --- | --- | --- |
| Globe | #A8D9B2 | #65B997 | icon-globe.PNG |
| Telescope | #68B9EB | #B6E5EE | icon-telescope.PNG |
| Natural | #FFD8C7 | #F3B85C | icon-book1.PNG |
| Human | #B7A6DE | #F4C5E5 | icon-book2.PNG |
| Ball | #FFB7C9 | #D981A5 | icon-ball.PNG |

The sky blue, peach and coral use existing site colors; mint, lavender and matching square colors extend their soft palette. All icons are actual imports from `Art/Big/Big-icon`. Forward transitions remain fixed to their portal; return selects one whole row.

## Actual browser verification
Chrome, local Vite server:
- Return captured at the fully covered stage: 1512×861 overlay, peach background/yellow square/book1 icon. Both overlay background and SVG path computed fill were rgb(255,216,199).
- A second return captured mint background/green square/globe icon: both fills rgb(168,217,178). Screenshots showed solid color over the entire viewport and the actual centered icon image.
- Telescope completed its original comic sequence. Its forward transition showed fixed sky blue and icon-telescope.PNG. Its return randomly showed peach/book1.
- Complete comic revealed through existing IMG editor: 27 image/text boxes checked at 1512×861, 1920×1080 and 1100×700; all stayed at least 20px inside the frame, outside list empty.
- Temporary image Y=-20 and dialogue text X=1200 were also fitted without clipping. Restored image Y=3.42 and text X=94 exactly after tests.
- Text drag: 10px pointer movement produced ~9.99px visible movement, updating X from 94 to 120; restored to 94.
- Original reading sequence/fades and completion remained operational; Telescope map interface loaded after the comic.
- Build and whitespace checks passed. Existing large-bundle warning remains. Temporary viewport override reset.

Not exhaustive: all saved user layouts, extreme viewport shapes, every random preset in a screenshot, every functional-page internal interaction, production-preview full regression. No assets deleted, no storage cleared, no config migration, no commit/push.

## Modified files this correction
- src/App.jsx
- src/components/portalComics/config.js
- src/components/CurveTransition.jsx
- src/components/CurveTransition.css
- src/dev/LayoutEditor.jsx
- docs/transition-palette-comic-fit-fix.md
