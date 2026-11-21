# TelescopeTest

Development entry: `http://127.0.0.1:5174/?dev=telescope-test` (use the current Vite port).

Reference found: `reference/telescope-reference.jpg`; requested spelling `teltscope-reference` does not exist. Layout follows the reference, palette/motion reuse BigTest's config and existing site fonts.

## Files

- `src/components/telescopeTest/TelescopeTest.jsx`: observation composition, guide, overlay log, collection state.
- `src/components/telescopeTest/TelescopeTest.css`: scoped desktop responsive layout, true circular clip and drawer/focus animations.
- `src/components/telescopeTest/data.js`: school records, guide dialogue, shared colors/motion and collection key.
- `src/components/telescopeTest/Text.jsx`: existing TEXT hook with isolated IDs.
- `src/App.jsx`: development-only lazy route; BACK calls the existing returnFromPortal path.
- `src/components/TelescopePage.jsx`: export existing TelescopeMap; optional readiness/status/location callbacks, flyTo bridge, resize support without a LayoutEditor stage. Formal rendering/layout/assets/mode behavior retained.

## Existing map inspection and limitations

Existing MAP mode is MapLibre globe projection using OpenFreeMap Liberty. Existing VIEW is EOX satellite imagery plus Mapterhorn terrain, not Street View. STREET preserves that implementation and explicitly labels the limitation. No street-level provider, coverage lookup, API credential or street panorama exists in the project; connecting actual street imagery remains future work. External tile endpoint availability is required. Existing globe/terrain combination emits `calculateFogMatrix is not supported on globe projection`; do not mistake it for a street panorama.

A single map instance survives mode changes and drawer operations. Styles change on that instance, retaining center/zoom/bearing and per-mode pitch. flyTo requests wait for mode/style readiness (idle after style loading) when necessary. ResizeObserver updates the map and drawing buffer. Attribution stays outside the circular clip. Focus duration is 550ms minimum, and actual map idle releases the loading state; resource errors show a message. Compass reads actual map bearing.

## Storage and text

Collection: `genesis:telescope-test:collection:v1`, name/coordinates/zoom/bearing/mode/id. Read validates coordinates; failed writes report an error. Other keys are untouched.

TEXT: prefix `telescope-test-`, page `telescope-test`, persistence `genesis:text-editor:telescope-test:v1`. Existing font, color, position, alignment and save facilities remain. Static school/guide text remains mounted under hidden content for registration. User-authored names are edited in the collection input rather than registered as fixed editorial copy. Animation transforms are on containers, not editable text nodes.

Live2D is a clickable placeholder; official model, expressions, complete dialogue and illustrations are not supplied. First guide sequence is voluntary NEXT and not repeatedly forced during the session.

## Actual verification

- Production build passed; only existing large-bundle warning. Test UI text absent from production JS.
- Chrome direct test route loaded real globe and satellite tiles; circular clip and attribution visible.
- School Taipei record flyTo reached 25.0330,121.5654; drawer closes.
- Collection added, survived browser reload with correct Taipei coordinates, then the disposable QA entry was deleted.
- TEXT BACK changed to BACK QA, survived reload, restored to BACK without any reset operation.
- Chrome Desktop responsive emulation: 1440x900, 1000x1000, 1440x480; circular shape, header, guide, buttons and compass stayed in bounds, map rendered after resize. These are emulated viewport dimensions, not OS window sizes.
- Globe/satellite switching and loading reticle observed; complete reload followed by satellite-to-school-record transition reached Taipei correctly. Map wheel zoom visibly changed detail level; no runtime exception visible in Console. Existing projection fog warning observed.

Not exhaustively verified: all school entries, rapid repeated switching, every map gesture/heading angle, long user-edited content, storage quota failure, other browsers, formal Big-to-comic-to-Telescope flow end to end. Its navigation branches and comic components are unchanged by this task.
