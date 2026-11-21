# Return transition and Telescope comic frame — 2026-10-10

## Changes
- `src/App.jsx`: all five functional onBack callbacks now start the existing CurveTransition. A palette pair is randomly selected once and stored with the transition state. Under full cover, Big mounts, plays the same 700ms arrival stage, and then the shared reveal runs. Comic BACK remains immediate; internal close/menu operations are unchanged.
- `src/components/portalComics/config.js`: RETURN_TRANSITION_ICON provides a replaceable local-image slot; currently uses geometric blocks because Big-icon contains no Big-specific icon.
- `src/components/CurveTransition.jsx`: shared geometry placeholder; background CSS variable prevents interpolation between the previous transition color and the newly chosen palette. Existing path/timing/easing are unchanged.
- `src/components/TComicPage.jsx`, `TComicPage.css`: uses the same portal-comic__panels class as the four blank comic pages, with their cream background, 2px dashed teal border and 24px radius. Existing images/text/sequence/fade durations are unchanged.
- `src/components/portalComics/ComicPages.css`: shared page-container styling also applies to Telescope, without applying placeholder button styling to its editor.
- `src/dev/LayoutEditor.jsx`: optional stageBoundsRef fits one 1920×1080 comic design stage into the frame with a 24px safety inset. ResizeObserver recomputes its single uniform scale. Drag deltas and selection handles use that scale. Dialogue groups share the design frame. Other pages omit the new prop and retain existing behavior.

TEXT already computes the inverse of all ancestor transforms for dialogue-group coordinates, so no TEXT editor change is needed. No coordinates, storage keys or saved drafts are migrated/reset. Image drag test values were restored exactly.

## Actual checks
Chrome / local Vite:
- 1512×861 and 1100×700: all Telescope images and dialogue text rectangles were within the dashed frame when the IMG editor revealed all items (outside list empty).
- IMG drag: 20px moved t-comic-1 X from 64.1 to 66.2291066623296, matching the stage-scale conversion; restored to 64.1.
- Existing Telescope sequence completed and entered TelescopeTest.
- All five functional BACK callbacks were exercised and returned to the new Big. Four were tested through existing dev entry URLs, Telescope through its completed comic. Return target is screen `scene`, not a test preview.
- Observed return palette pairs: yellow/pink, peach/teal, teal/yellow, all existing pairs. Random selection may repeat, as requested.
- Completed transition overlays had pointer-events none/top 100vh. Big remained visible and its maintenance control was clickable.
- Build and diff whitespace checks passed; existing large-bundle warning remains.
- Temporary viewport override reset.

Not exhaustively checked: every custom user layout, every viewport ratio, TEXT drag/save/reload, full interaction regression across the five functional pages, per-frame flash capture and artificial slow-network stress. No function-page designs, Story/Main transition timing, circular reveal, assets or browser data were altered/deleted. No commit/push.
