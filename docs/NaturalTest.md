# NaturalTest first version

Direct development entry: `http://127.0.0.1:5174/?dev=natural-test` (substitute the active Vite port).

In development, Big / BigTest → click `book-open1` → existing CircularReveal → NaturalTest. BACK uses `returnFromPortal('book-open1')`; it returns to BigTest for a BigTest session and Big otherwise. No top-level website navigation item is added. `book-close1` and production destinations are unchanged.

The development-only book-open1 branch calls the existing portal selection directly on every visit, including after BACK. No introduction or ENTER confirmation is required. App overrides only its development destination.

## Files

- `src/components/naturalTest/NaturalTest.jsx`: fixed navigation, selection/view restoration, composition.
- `src/components/naturalTest/useResearchCamera.js`: DOM transform camera, drag threshold/capture, cursor-anchored wheel zoom, interruptible animation and resize.
- `src/components/naturalTest/ResearchCanvas.jsx`: category groups and interactive entries/SVG icons.
- `src/components/naturalTest/ReadingPanel.jsx`: right-side reading panel with independent scroll and student note.
- `src/components/naturalTest/data.js`: BigTest palette/motion, camera settings, CATEGORIES, ENTRIES, ARTICLES, NOTES.
- `src/components/naturalTest/Text.jsx`: existing TEXT hook with natural-test prefix.
- `src/components/naturalTest/NaturalTest.css`: scoped style/desktop adaptation, entry animation and zoom detail tiers.
- `src/App.jsx`: DEV lazy entry/destination and existing reveal/return integration.
- `src/components/MainScene.jsx`: DEV book-open1 direct portal condition only.

## Content edits

CATEGORIES owns id, name, introduction, color, world x/y, width/height, decoration type, entry ID list. ENTRIES owns id, title, description, high-zoom detail, category-local x/y, icon type and article/note IDs. ARTICLES owns title, subtitle, paragraph array, optional image/imageAlt and page marker. NOTES owns author, text and color.

Initial articles/notes are generated from the small sample entry list to keep placeholders short. Replace the generated entries with explicit keyed article/note objects when adding finished copy; ReadingPanel needs no changes. Add another category plus its entries/article/note data to expand the atlas; bounds and navigation derive from CATEGORIES. CSS pattern vocabulary: stripes, circle, dots, grid, orbit.

## Camera

World position is category position plus entry-local position. CSS screen position is `world * scale + translation`. Scale range .16–1.8; overview derives the world bounds and viewport dimensions. Wheel converts the pointer to local viewport coordinates and keeps its world point anchored. RAF evaluates BigTest's cubic-bezier(.22,.75,.25,1) over 420ms, cancelling prior movement before a new target. Drag writes the outer world transform without React rerender each frame; state changes only when crossing a zoom-detail threshold.

Low zoom shows category groups; normal zoom shows entry title/icon/description; high zoom adds entry detail. Full article stays in ReadingPanel. Opening preserves camera center/scale; closing restores it. Resize refits overview or adjusts the active target; selected entries are centered in the space left of the panel. Header, controls and panel are outside the world transform. Float/hover/editor transforms use separate nodes.

## TEXT and isolation

Fixed UI and per-entry READ use existing useEditableText. IDs: natural-test-*. Persistence: genesis:text-editor:natural-test:v1. Categories/articles/notes remain editable source data. No existing storage is reset. Only while NaturalTest is mounted, existing editor layers and orientation prompt sit above the persistent CircularReveal layer. No new editors or dependencies.

Production build excludes the test module/UI. Formal Big camera/materials and production book interaction branches stay unchanged. BigTest, Globe, Telescope, TComicPage styles/components were not edited for this task.

## Actual checks

- Build and git diff --check passed; existing large-bundle warning only.
- Direct NaturalTest route renders all five groups.
- All five category navigation buttons operated; entries appeared at category zoom.
- Drag and cursor-area wheel zoom visibly changed the world while fixed UI stayed in place.
- VOLCANO opened, focused left, showed right panel; CLOSE restored previous category view and keyboard focus.
- Reading panel scroll reached the student annotation without moving the canvas.
- Entry correction: fresh BigTest session, single book-open1 click entered NaturalTest using the existing reveal, without an introduction or ENTER. BACK returned to BigTest. Build and diff checks passed.
- NaturalTest TEXT BACK was edited, reloaded with edit preserved, then restored without a reset.
- Chrome Desktop responsive emulation: 1440×900 overview; 1000×1000 category/reading; resize with reading open to 1440×480; selected entry stayed left, panel remained readable/scrollable, controls stayed fixed. 1440×480 overview displayed all five main groups.
- Fresh direct reload Console showed React's development information without runtime errors.

Not exhaustively checked: every sample article, all zoom limits/long edited text, other browsers, mobile orientation, complete regressions of other pages. Full scientific copy, official illustrations and character stories intentionally remain future work.
