# BallTest

Development URL: `?dev=ball-test`. In development, the existing ball model hit handler directly calls openPortal, which selects BallTest and uses the unchanged CircularReveal. BACK uses returnFromPortal('ball'). Production ball destination remains unchanged. Other object routes are unchanged.

## Editing

- `src/components/ballTest/data.js`: categories, fictional works, covers, descriptions, recommendation text, per-work dialogue, characters, layout, and selector settings.
- `CharacterPortrait.jsx`: stable SVG character composition. Tivbo is on the left with pink stripes and tivbo-frame. Lar is on the right with green dots and lar-frame. Body and optimized face share manifest coordinates and one outline filter. Alpha backing masks clip the layers, with the frame drawn last. No Live2D runtime is installed.
- `characterAssets.js`: resolves original bodies, optimized faces and matching decorations from `Art/ball/web/characters.json`. `data.js` controls defaults and framing independently of the authoritative face placement.
- `decodedImages.js`: loads and decodes body/face pairs before atomic replacement, rejects stale requests and keeps a bounded cache (8 images / 96 MiB decoded). Only requested images are fetched.
- In development, `?edition=favorites` automatically exposes independent pose and expression selects. Production builds omit these controls. The existing collapsible panel and selects are retained, with no query flag required. Patterns support `prefers-reduced-motion` and do not move the frame or character.
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
- Dialogue progresses Lar → Tivbo; opening/closing Tiny Orbits kept the speaker and selected work.
- Detail modal shows cover, labels, article and reason; blur remains behind clear panel.
- Desktop emulation: 1440×480 page, 1440×900 page, 1000×1000 details. Controls visible; panel inside viewport. Native desktop checked too.
- BACK returns normal Big; single click actual ball opens through existing reveal with no intro. Reveal captured during transition.
- TEXT registers BallTest labels. Temporary BACK QA edit survived refresh, then restored original BACK via editor (no resets).
- npm run build and git diff --check pass; existing bundle warning remains.

Not exhaustively tested: every unrelated Big/Globe/Telescope interaction, all editor property types, all possible viewport sizes, future large datasets or actual Live2D adapters. Official artwork, real covers and final writing intentionally remain placeholders.

## Character integration checks

- `node --test src/components/ballTest/characters.test.mjs`: cache limits/retry, complete-pair commits, stale/unmounted requests, and all 1000 SVG pose/expression combinations. Side, matching decorations, optimized face paths, placement, mask and outline grouping are asserted.
- `node scripts/prepare-ball-faces.mjs --verify-only`: strict source/output pixel validation, including Lar’s existing safety mask.
- Browser check: Tivbo left / Lar right, both final expressions and eighth poses, unchanged stationary frames and clipped backgrounds. Visual spot checks supplement the exhaustive asset and render checks, rather than inspecting 1000 states manually.

## Whole-frame motion and shadow

The Git baseline `c40525b` retains `Live2DSlot.jsx`, `edition.css` and `useParallax.js`. The accepted left Tivbo idle behavior uses pointer rotation only. Both current slots now use exactly that same `.ball-portrait-float` rule: `calc(var(--pointer-x) * 1deg)` around bottom center. The extra `[data-talking=true]` speaking animation has been removed, so dialogue cannot add rocking to Lar or change either slot’s motion. The internal SVG person transforms remain unchanged.

App’s original `useParallax` is unchanged: normalized pointer range −1..1, blend 0.09, stop threshold 0.002, smooth reset on document leave/visibility change. No spring or extra pointer listener was added. The original 600 ms opacity entrance remains.

Background motion translates actual repeated SVG circles/rectangles inside the existing alpha mask, independently of the slot transforms. It no longer uses an animated pattern paint server. Dots translate (160,160) in 27 s. Stripes are fixed at 55° and translate (103.24376,147.44737) in 22 s, exactly one perpendicular repeat period. Extra offscreen geometry prevents gaps. Backing, person and frame stay stationary relative to the slot. The existing live reduced-motion subscription removes SVG animation elements when reduction is requested, leaving the same shapes static.

A separate backing-image SVG filter casts only a shadow from SourceAlpha: Gaussian blur 24, offset (10, 30), ink #34465a at 18% opacity, all in decoration coordinates. Its output excludes the original backing to avoid double compositing transparent edges. Expanded filter bounds and visible scene overflow preserve blur, while the existing alpha mask still clips the person/pattern. All layers including the shadow float together.

### Current browser verification

Chrome screenshots at distinct times visibly show different dot and stripe positions inside the same stationary frames. This supersedes the earlier patternTransform-only check, which established changing numbers but was insufficient evidence of visible repaint. Source inspection confirmed the backing is a plain color and the frame interior is transparent. This repair bypasses the pattern paint-server path rather than relying on it to repaint inside a mask. The browser-specific cause of the previously reported stationary appearance was not fully isolated.

## Interface and dialogue bubble

Visible names remain 緹芙波 / 拉爾, with unchanged internal IDs. Categories remain Chinese. The title is OUR FAVORITES!, and BACK is plain text with a thin underline and its original handler. Selector/modal labels use the original English text from Git baseline c40525b, except NEXT follows the latest explicit wording. The original Selector adapted from Skiper UI link is rendered once at the page bottom, outside the central selector. No work title, description or dialogue content was changed.

The four rounded corners remain. The sole pseudo-element tail is above the bubble, skewed toward the speaking character (left/up for Tivbo, right/up for Lar). There is no lower tail. At the final dialogue line no visible completion hint is rendered. Browser screenshots checked both speakers and the final line, along with BACK, the title, selector labels and bottom credit. The dev-only original 8/63 and 8/62 controls, character framing, pointer motion, outline and shadow are unchanged.

The dialogue retains the existing data-dev-text-dynamic opt-out to prevent development text adaptation from overwriting its changing speaker/content. The Ball-only global navigation exclusion remains.
