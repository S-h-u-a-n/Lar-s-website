# BigTest development handoff

Open the running Vite server with `?dev=big-test`. This route is development-only. A normal URL still opens the original entrance. The BigTest module is lazy loaded and excluded from production builds.

## Read-only inspection findings

- Model: `Mode/Big.glb`. `MainScene.jsx` owns one Three.js canvas, GLTFLoader, original camera framing/material presets, OrbitControls, raycast hover/click, focus/reset, and cleanup. App owns portal transitions and the introduction-card stack. BigTest reuses these systems.
- Registry: `ball`, `globe` (meshes prefixed `globe-`), `telescope`, `book-close1`, and `book-open1` are existing portal IDs. `bookink` is also a portal but deliberately omitted from the maintenance list.
- Squares: `Art/Big/Big-decoration/Big-squares.PNG` is a transparent 3024 × 1728 composition. Existing `BigSquares` animates the whole raster. `BigSquareField` uses other JPG assets; BigTest does not use them. BigTest crops the original PNG into its existing square positions for independent floating, as non-interactive decoration behind the model. Documents attach transparent hit regions to the existing large corner geometry: left stripes → Letter, left blue → Diary, right teal → Notes. No new visible square group is created.
- Round: `Art/Big/Big-decoration/Big-round1.PNG` is the large off-white circular foundation, not the five colored list dots. It remains the central foundation. List dots crop and tint the same source alpha silhouette; no substitute asset or redrawn circle is used.
- Grid: `Art/Big/Big-decoration/Big-grid.png` exists and is used directly, aligned with the source composition.
- Reference: `reference/Big-rereference.png`. The title bar, corner geometry, grid, square arrangement, central model and right dot stack follow this reference. The unrequested title icon and chair speech bubble are omitted.
- Existing document entrance: `BigLeftside` uses `LayoutEditor` and `ExpandedDocumentView` to compose seven image-based document layouts. There is no reusable title/body data for a two-column panel. They remain intact; BigTest uses English placeholder data and the existing `expanded-document-open` event to suspend OrbitControls.
- TEXT: `useEditableText`, `textEditorStore`, `TextEditor`, and `TextDraftLayer` form the existing shared editor. Content, font family/size/weight, color, x/y, rotation, alignment and dimensions are supported. Previously settings survived mode changes in memory and could be copied as JSON, but did not survive refresh. BigTest enables isolated automatic persistence through the same store.
- Routing: App's existing development query route previously handled `t-comic`; BigTest extends that mechanism. Return from portals in a BigTest session goes back to BigTest. Normal sessions return to the original Big page.
- Existing decoration components include BigCircles, BigHanging and BigSquareField. Their additional imagery and continuous animation are inappropriate for this static reference, so they are not mounted by BigTest. No extra editor or dependency was added.

## Files changed for this task

- `src/App.jsx`: lazy development entry and return routing.
- `src/components/MainScene.jsx`: optional presentation, navigation, children and viewport aspect. With these props absent, the original background, navigation and viewport behavior remain unchanged. Rendering and interaction implementations are shared.
- `src/dev/textEditorStore.js`: opt-in isolated persistence. Existing pages do not enable it.
- `src/components/bigTest/BigTest.jsx`: composition and persistence lifecycle.
- `src/components/bigTest/Background.jsx`: source background and configurable generated geometry; supports uniform dots, stripes and grid.
- `src/components/bigTest/AssetCrop.jsx`: proportional raster cropping and alpha-preserving tint overlay.
- `src/components/bigTest/Maintenance.jsx`: a single `isMaintenanceExpanded` boolean controls all five circles and clipped labels synchronously. Clicking any circle toggles the entire list; no navigation is attached.
- `src/components/bigTest/Documents.jsx`: original-square buttons and three persistent, independently editable overlay panels. Close button, Escape, scrim and focus return are supported.
- `src/components/bigTest/EditableText.jsx`: stable `big-test-` IDs using the existing hook.
- `src/components/bigTest/config.js`: geometry, source crops, document mapping, hover colors, maintenance list, patterns and motion timings.
- `src/components/bigTest/BigTest.css`: scoped presentation and transition styles, including reduced-motion support.
- `docs/BigTest.md`: inspection and integration handoff.

Pre-existing uncommitted work and all original assets were retained. `Big-grid.png` and the reference were already untracked before this task; they were not created or modified here. `npm run build` also regenerates the existing ignored `dist` output.

## TEXT and animation

The current 22 text elements register with the existing TEXT editor, including the three corner hover labels, collapsed list labels, all three panels and the optional Enter button. The three hover labels retain their existing IDs (`square-pink-bottom`, `square-teal-bottom`, `square-yellow-top`) and saved settings. Data for the seven removed, incorrectly interactive decoration labels is retained in the store/storage; it is not cleared. Hidden panel text stays registered so it can be selected without first opening each document. Use the editor's dropdown to select it; open the corresponding panel to see its layout.

Changes save automatically to `genesis:text-editor:big-test:v1` in the current origin's localStorage. No other keys are cleared or changed. BigTest drafts are saved too. Ports/hostnames have different localStorage origins; keep the same development URL to retain adjustments. Copy Config remains available for exporting values.

Editor translation/rotation belong to the inner text element. Reveal/entry animations belong to outer wrappers. Source images share a centered, contained 7:4 artboard; images never stretch. The canvas covers the viewport, with an opt-in perspective FOV adjustment preserving the artboard projection scale while rendering the surrounding margins. The existing portrait orientation prompt remains unchanged.

## Current viewport, layer and floating refinement

- Modified `BigTest.jsx`, `Background.jsx`, `Documents.jsx`, `Maintenance.jsx`, `config.js`, `BigTest.css`, `MainScene.jsx`, and this handoff. Added `FloatingSquares.jsx` and `viewportFraming.js`.
- Teal bar height is 72 design units instead of 100, with a 32px minimum. It is in the foreground interface alongside the unchanged editable title. Layers: background → decorative squares (20) → canvas (70) → title and interface (90) → document overlays. Non-interactive layers pass pointer events through.
- Maintenance measures saved heading text and applies a separate responsive wrapper offset to keep it inside the artboard and below the bar. It never changes saved editor values. The single expansion state and all reveal timings remain intact.
- Both square groups float with independent 4.9–8 second cycles, small responsive translations and negative phase offsets. Crop/image shape, hover scale, editor transforms and floating wrappers remain separate. Reduced-motion disables floating. Document hit regions remain stationary to avoid hover boundary jitter.
- Existing corner entrances use 1:1 aspect ratios with uniform artboard scaling. Their positions/sizes have been adjusted only to keep rotated corners, floating and hover scale inside the viewport and separated.
- `MainScene` adds an optional `fitViewport` callback, enabled only by BigTest. Resize updates full-viewport renderer dimensions and camera projection; the original bounding-sphere distance, controls and focus logic remain. Formal Big has no callback and retains its previous branch.
- Current production build passed. Chrome Desktop responsive viewport tests: 2560×1080, 1920×1080, 1440×900, 1000×1000, 1000×1080 and 1440×480. In default model framing, feet remained visible, document entrances stayed square and inside the viewport, and the title bar did not overlap maintenance. These are browser viewport emulation checks, not measurements of native OS window dragging.
- Current interaction checks: whole maintenance group expanded from Globe and collapsed from Crystal Ball; Letter, Diary and Notes opened and closed; dotted panel decoration remained visible; model drag rotation and Globe portal navigation/return worked. TEXT editor retained the saved title (x=26, y=1, font size=27) after returning. No storage reset or editor implementation change was made.
- Not exhaustively retested in this refinement: every object focus/reset, card-stack combination, every portal transition, continuous native window dragging, Safari/Firefox, and editor save-after-edit. Intentional object focus zoom remains unchanged and is not the default whole-model framing test.

## Verification

- Production build passed. Output contains no BigTest module or Big-grid asset, confirming development isolation.
- Native Chrome was checked at two actual desktop window sizes. The model and supplied raster layers display; the contained canvas matches the reference's relative model scale.
- Circle expansion from Globe and collapse from Crystal Ball were exercised: all five rows moved together and retained their circular silhouette. Shared timings/easing are unchanged; revealed labels sit entirely to the right of the dots.
- All three large corner entrances opened their correct panels. Letter's existing cover, dotted decoration and title/body were visually verified. Close button and Escape worked. Hover/focus scales and tints the actual existing background shape while revealing its retained editable label.
- The original 29 IDs were verified during initial development; after correction 22 applicable IDs remain mounted. The previous title edit survived refresh and was restored to the requested placeholder. No editor or persistence code was changed by the correction.
- Layers are sibling stacking contexts: existing background (auto), complete decorative Big-squares (20), unchanged MainScene canvas (70), interface (90). Decoration has `pointer-events: none`; only the three corner hit regions are interactive. Browser checks exercised model rotation, object focus, introduction cards and empty-area reset. Overlapping geometry was visually covered by the model. BigTest uses `overflow: clip` to prevent offscreen rotated buttons from scrolling the fixed scene when focused.
- Existing model globe navigation and Back returned to BigTest. A plain URL opened the existing entrance.
- Remaining manual regression checks: exhaustively drag/focus/reset every model object, every introduction-card stacking combination, every portal transition, and the timing of each hover/exit animation. These use unchanged interaction logic but were not all exercised individually.

## Follow-up decisions and safe integration

The user confirmed that document entrances are the existing large corner color blocks, not any of the ten Big-squares decorations. Provide official document content/covers/signatures later; current covers reuse source squares. The right dot treatment still uses the named foundation circle's cropped alpha silhouette.

After visual approval, promote the presentation components through MainScene's optional props. Keep the original Big presentation until that separate instruction. Export BigTest's TEXT config and commit reviewed values as source defaults before public integration; the existing editor is development-only and localStorage is local to one browser origin. Retaining the stable IDs or explicitly migrating them preserves edits. No model-renderer copy or replacement editor is needed.

## Latest document-anchor and viewport-banner correction

This supersedes the previous refinement's corner repositioning and artboard title bar.

- Restored the pre-floating design anchors from the recorded original patch: Letter (-72,925), Diary (255,982), Notes (1694,915), in 2048×1170 coordinates. Retained square widths and 1:1 proportions. Original edge cropping is retained rather than moving the whole composition inward/upward again.
- Documents use an independent centered ±1–2px vertical / ±0.5px horizontal floating animation. Layout anchors and hit regions stay stationary; hover remains on the separate inner shape. Model-adjacent squares and their animation are unchanged.
- The banner and existing editable title now occupy a direct MainScene child anchored at top:0, left:0, right:0, height:48px. There is no aspect-ratio or artboard centering on this wrapper. Typography and stored text values are untouched. Maintenance's responsive measurement uses this viewport banner's actual lower edge.
- Changed only BigTest.jsx, BigTest.css, config.js, Background.jsx, Documents.jsx, Maintenance.jsx and this document. No MainScene/camera, editor/storage, formal page or other background shape changes.
- Build passed. Chrome Desktop responsive viewport checks at 1440×900, 1440×480 and 1000×1000 showed a top-aligned full-width banner, unscaled title glyphs and maintenance below the banner. Native Chrome display was also checked. Letter opened/closed; Diary hover revealed its text and changed color. Model drag still rotated normally.
- Not exhaustively retested: every model object, portal/card-stack combination, all document transitions, other browsers, and editor save-after-edit.

## Shared model-focus progress

BigTest alone opts into MainScene's `onFocusProgress(host, progress)` callback. The existing `focusedInteractionId` determines the destination; `focusedPortalId` only drives portal UI and is not suitable for non-portal objects. The callback runs on the existing camera animation loop, using its actual 900ms cubic-out focus and 1400ms smoothstep return. It does not change camera targets, distances, or interaction/card logic. Repeated object focus interpolates from the current normalized progress toward 1; reset interpolates toward 0, never adding offsets. Initialization resets this presentation progress to zero.

`FOCUS_MOTION` in config.js centralizes full-artboard horizontal shift (-12%), scale (grid/squares 1.08, maintenance 1.06) and origin. Duration/easing intentionally remain owned by the camera, rather than duplicated configurable timing that could drift. Three full-artboard outer wrappers consume the inherited progress CSS variable; floating and list reveal transforms remain nested. Only the grid raster moves in Background; the original circular foundation, other geometry, banner and document entrances stay fixed. Grid retains proportional image sizing and its transparent boundary, so no opaque empty edge is introduced.

Maintenance measures untransformed layout on resize even while its outer wrapper is focused. Formal Big does not pass the callback. No editor IDs, storage settings, dependencies or second render loop were added.

Modified: MainScene.jsx, BigTest.jsx, Background.jsx, FloatingSquares.jsx, Maintenance.jsx, config.js, BigTest.css and this handoff. Build and whitespace checks passed. Native Chrome chair focus/blank reset, repeat focus, small-square floating and maintenance expansion/collapse were checked. Focused resize was checked in Desktop viewport emulation at 1440×900 and 1000×1000. Original introduction cards can cover maintenance dots at their existing layer; their layer/contents were preserved. All card-stack combinations, every object/portal and other browsers were not exhaustively retested.

## Corrected focus targets: central round foundation

The user clarified that Big-round1 means the central white circular foundation, not Daily Maintenance. This supersedes the previous focus-target description. Removed maintenance's focus wrapper and its temporary untransformed-measurement code, restoring its independent pre-focus layout and unchanged expansion state. Background now wraps the original round PNG in the same focus-progress presentation wrapper as grid; config contains only round/grid/squares targets, all with -12% horizontal displacement and uniform 1.1 scale around 50% 50%. Proportional raster rendering preserves the circular silhouette. Floating remains nested under squares' group wrapper. All three use the existing camera-derived progress, with no camera/editor/formal-page changes in this correction.

Changed BigTest.jsx, Background.jsx, Maintenance.jsx, config.js and this handoff. Build and whitespace checks passed. Native Chrome checked chair focus, blank reset, repeat focus and maintenance expand/collapse; all three decorations moved/scaled while maintenance stayed anchored. Focused desktop viewport emulation checked 1440×900 and 1000×1000; no new visible raster-edge gap was observed. All object/card combinations and other browsers remain untested exhaustively.
