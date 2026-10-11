# BallTest

Development URL: `?dev=ball-test`. In development, the existing ball model hit handler directly calls openPortal, which selects BallTest and uses the unchanged CircularReveal. BACK uses returnFromPortal('ball'). Production ball destination remains unchanged. Other object routes are unchanged.

## Editing

- `src/components/ballTest/data.js`: categories, fictional works, covers, descriptions, recommendation text, per-work dialogue, characters, layout, and selector settings.
- `Live2DSlot.jsx`: independent, stable character slots. Receives idle/talking/expression/motion; replace its silhouette with an adapter later. No Live2D runtime is installed.
- `WorkSelector.jsx`: Skiper53 adaptation, fixed-height visible window, animated cover heights and layout, cyclic arrows. Hover ID, selected index, opened work, and dialogue line are separate states.
- `WorkDialog.jsx`: white translucent backdrop with blur, animated rounded panel, independent scrolling, Escape/close/backdrop dismiss and focus restoration. Opening/closing does not reset selection or dialogue.
- `Text.jsx`: existing editor integration, prefix `ball-test-`, storage `genesis:text-editor:ball-test:v1`. Dynamic works/dialogue remain in data.js.

## Skiper source and license

Read official https://skiper-ui.com/v1/skiper53 and https://skiper-ui.com/registry/skiper53.json. Registry declares framer-motion; original imports unused Swiper CSS and cn plus Tailwind classes. This project has npm and no shadcn configuration. Adapted the official height/hover animation directly to existing Framer Motion and scoped CSS; no package/config/lockfile changes. Original demo illustrations are not used.

Official terms: free personal/commercial use and modification, attribution required for free version. Attribution retained in source and visible link in the selector. Author @gurvinder-singh02 / Skiper UI.

## Actual verification

- Independent route renders; five categories switch their three covers.
- Down arrow three times cycles back to the same work; up from first selects last.
- Cover focus/hover expands and other covers contract; pointer leaving restores even heights. Hovering a different cover leaves selected-work dialogue intact.
- Dialogue progresses Mira → Theo; opening/closing Tiny Orbits kept Theo and selected work.
- Detail modal shows cover, labels, article and reason; blur remains behind clear panel.
- Desktop emulation: 1440×480 page, 1440×900 page, 1000×1000 details. Controls visible; panel inside viewport. Native desktop checked too.
- BACK returns normal Big; single click actual ball opens through existing reveal with no intro. Reveal captured during transition.
- TEXT registers BallTest labels. Temporary BACK QA edit survived refresh, then restored original BACK via editor (no resets).
- npm run build and git diff --check pass; existing bundle warning remains.

Not exhaustively tested: every unrelated Big/Globe/Telescope interaction, all editor property types, all possible viewport sizes, future large datasets or actual Live2D adapters. Official artwork, real covers and final writing intentionally remain placeholders.
