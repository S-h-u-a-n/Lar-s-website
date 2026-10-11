# GlobeTest development handoff

Open the existing Vite server with `?dev=globe-test` (current server: http://127.0.0.1:5174/?dev=globe-test). This is a lazy, development-only route. The normal entrance remains unchanged; Back to the laboratory opens the existing formal Big scene. Formal GlobePage and its CSS are untouched, and this test is not substituted into normal Globe navigation.

## Inspection and reuse

- GlobePage previously rendered GlobeViewer over the full page with a return button and an empty section. GlobeViewer loads `Mode/globe.glb` using GLTFLoader into one PerspectiveCamera/OrbitControls canvas.
- GLB JSON inspection confirmed actual named nodes: earth, moon, jupiter, mars, mercury, neptune, pluto, saturn, sun, uranus, venus. The existing raycaster walks mesh ancestors to these names.
- Existing framing: FOV 38, horizontal camera view offset 0.24, initial direction (1,0,0), bounding-sphere framing with a 0.78 framing-aspect cap. Focus and reset use the same 1000ms cubic-out camera animation. Material presets, texture final-color shader controls, camera-relative lighting, cosmos billboard, rotation and wheel zoom remain shared.
- GlobeViewer adds optional selection/ready callbacks, optional transparent rendering and temporary input suspension. Default prop values preserve formal rendering and operation. Callback refs avoid rebuilding the model effect when notes/story state changes. GlobeTest never changes `transparent` after mounting and never conditionally unmounts the viewer for a story.
- BigTest colors are sourced from its geometry config; story timings use its existing MOTION values. Design uses a different composition, with a partial grid, circular foundation, small squares and a right striped accent. The white translucent scrim, backdrop blur and rounded panel transform follow BigTest's document-overlay approach. No extra package/editor/artwork was added.

## Files

Modified: `src/App.jsx` (lazy test route), `src/components/GlobeViewer.jsx` (optional integration hooks).

Added in `src/components/globeTest/`:

- `GlobeTest.jsx`: model/selection/continent/story composition, isolated TEXT persistence.
- `GlobeTest.css`: scoped desktop layout, notes/reveal and story animations, reduced-motion support.
- `ResearchNotes.jsx`: persistent notebook, all celestial entries, continent selection and chapters. Selecting a different body resets only notebook scroll/continent selection.
- `StoryDialog.jsx`: reusable data-driven chapter/dialogue presentation, NEXT/FINISH, close/scrim/Escape, focus trap and return focus.
- `Text.jsx`: existing useEditableText hook with stable `globe-test-` IDs, independent editor transforms.
- `celestialData.js`: eleven body records and six continents. Fields include name, subtitle, introduction, research, annotation and optional illustration. Continents expose name, introduction and `marker: null`.
- `stories.js`: character dictionary and separate story groups. Each continent currently has two placeholder chapters; every non-Earth body shares the same two `celestial` chapters. Chapter records contain id/title/background/dialogue; dialogue has stable id/character/text. Avatar/background paths are optional, currently null.
- `config.js`: shared-source palette and animation timings.
- `data.js`: exports for these separate data modules.

Added this document.

## Marker interface and editorial content

Earth notes offer six working continent buttons now. A future model marker should call the same continent-selection setter used by ResearchNotes. Marker coordinates are intentionally absent: validate earth-local surface positions/normals and mesh transforms before placing them. No fabricated geographical markers are rendered.

All notebook/dialogue text is English placeholder content, not scientific reference copy. Formal facts, character portraits, illustrations and scripts remain editorial follow-up work. Avatar initials are decorative fallback graphics. Optional artwork slots are already rendered when populated.

## TEXT and state preservation

Existing editor supports content, font family/size/weight, color, position, alignment, dimensions, rotation and opacity. New headings, controls, body records, continent names, chapter labels, character names and dialogue lines use stable prefixed IDs. Hidden note/chapter/dialogue content remains registered in development, so it can be selected before navigating to it. Dynamic panels animate outer wrappers; editor translate/rotate styles stay on inner text elements.

Automatic persistence uses `genesis:text-editor:globe-test:v1`. Other page keys are neither cleared nor overwritten. Saving depends on the current origin; a different port/hostname has separate storage. Copy Config remains available. Story artwork/layout changes are made in source data/CSS, not in a duplicate editor.

Opening a story preserves selected body, continent, notebook scroll and viewer instance. Closing it does not invoke reset or select another body. Camera animation can finish behind the overlay; model input is suspended while the story is open. Focus/keyboard return is restored to the triggering chapter button.

## Actual verification

- Final production build and `git diff --check` passed. Production assets do not include GlobeTest's title/story content; the existing large-bundle warning remains.
- Native Chrome: route loads directly, original model renders, header/model/toolbar have separate vertical space. Earth was selected by direct model raycast click, producing the Earth notebook. Drag rotation and wheel zoom were exercised; Reset view restored the initial framing.
- All eleven body selections were exercised through the supplementary selector and displayed corresponding notes using the existing focus function. This is not an exhaustive direct-raycast test of every mesh.
- Asia's two chapter buttons appeared; the first story progressed Mira → Theo → Mira → FINISH. Closing retained Earth, Asia and the notebook. Jupiter displayed the shared celestial chapter group; its story opened and Escape closed it without resetting Jupiter.
- Story overlay visibly whitened/blurred the model and notes while keeping the dialogue panel clear. Model stays mounted in source throughout these operations.
- Desktop viewport emulation checked 1440×900 and 1000×1000 with Earth selected, and 1440×480 with notes and story open. Panels remain separate from the model, scroll internally and keep controls reachable. Native Chrome window layout was also checked, without claiming a measured native window size.
- TEXT edit of Back to the laboratory was saved, refreshed and read back through the existing editor, then restored to its original text. No reset/delete action was used.
- Back opened the formal Big scene; a plain URL still showed the original entrance.
- Not exhaustively tested: every direct celestial raycast hit, all chapters/continents, long-text stress cases, every viewport during active animation, formal Globe end-to-end navigation, Safari/Firefox, and formal celestial special-effect equivalence beyond preserved source logic.

## Future integration

Keep this route isolated until separate approval. Promote the composed presentation into GlobePage only after review, preserving GlobeViewer's default camera/material logic and callback interface. Export reviewed TEXT values before integration; retain or explicitly migrate IDs to preserve adjustments. Validate continent marker coordinates independently. Do not replace the original GlobePage or remove old assets as part of this test.
