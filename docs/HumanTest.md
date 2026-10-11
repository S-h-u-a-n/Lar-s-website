# HumanTest

Development entry: `?dev=human-test`.
In development, clicking the actual `book-close1` model goes directly through the existing CircularReveal to HumanTest. BACK uses returnFromPortal. `book-open1` still goes to NaturalTest. Production portal targets are unchanged.

## Files and reuse

`src/components/humanTest/data.js` contains independent categories, local entry coordinates, four content types, content records, and characters. Add a category and its entry IDs here; no camera changes are needed. Category coordinates are world coordinates; entry coordinates are relative to their category. Optional images and avatars accept asset paths.

HumanTest supplies its own canvas, panel, text wrapper, data, and scoped styles to NaturalTest's existing atlas shell. The shell shares category navigation, selection focus, saved camera restore, resize handling, and fixed controls. `useResearchCamera` still owns all dragging/zooming. Its default zoom limits are unchanged for NaturalTest; HumanTest opts into a lower minimum to fit its larger world in short windows.

Colors and motion come from NaturalTest's existing BigTest-derived STYLE. Human diagrams include architecture, book pages, a skyline, circuits and a map. Content modes: article, story (GlobeTest-compatible chapter/dialogue data shape), infographic, recommendation. These are editorial placeholders; final writing/artwork remain to be supplied.

TEXT IDs use `human-test-`; persistence key is `genesis:text-editor:human-test:v1`. Fixed controls, READ hints and reading controls use the existing editor. Dynamic category/article/story text is edited in data.js. No storage reset or new dependencies.

## Actual checks

- Browser: independent entry, all five category navigation choices, dragging and wheel zoom.
- Article and infographic open/close; previous category view restored. Recommendation rendered. Story advanced through Mira/Theo/Mira and the end state.
- Desktop emulation: 1440×900 overview; 1000×1000 infographic; resize while reading to 1440×480, then overview. Fixed controls remained visible and focused entry stayed left of the panel. Short-window overview fits all groups at a smaller scale; choose a category to read details.
- Normal Big: BACK rendered Big; single click on actual book-close1 launched HumanTest through CircularReveal (captured during reveal). book-open1 subsequently launched NaturalTest; Natural category navigation and Volcano panel checked.
- TEXT: BACK edited temporarily, reload restored edited text after loading; restored original BACK through editor. No reset commands used.
- Production build passes. Existing bundle-size warning remains.
- Not exhaustive: every unrelated Big/Globe/Telescope interaction, every font/position editor control, mobile portrait and all possible desktop sizes. No claim of full regression coverage.
