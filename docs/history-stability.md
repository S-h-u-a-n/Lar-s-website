# History panorama stability audit — 2026-10-25

Preview: http://127.0.0.1:5186/history-test.html (`npm run dev`).
Optional invisible diagnostics: append `?profile=1`; inspect the main element's
`data-diagnostics` JSON. This is off by default and adds no page controls.

## Actual findings

1. Reproduced rectangular missing portions of people-4's torso and layer-1/other
   background figures in Chrome at 1512 × 805. All corresponding images had loaded,
   reported correct intrinsic dimensions, and no mask/clip-path. Their full source
   alpha extents were intact. The viewport's overflow clips the screen edges only;
   it cannot explain holes in an interior torso. See history-stability-before.png.
2. All 35 original files exist with exact uppercase `.PNG` paths and decode with
   Pillow. Browser resource audit returned HTTP 200 for all 35 image requests;
   `complete`, natural dimensions and decode states were valid. No real 404 or
   decode error was reproduced. Failure handling was nevertheless defective: one
   rejected decode in the old Promise.all kept the entire world invisible forever.
3. Old rendering combined a 12524 × 2620 ancestor surface scaled down, nested
   filtered images with permanent backface hiding, and perspective transforms
   even after springs stopped at tiny nonzero angles. These are unnecessary large
   compositing/filter surfaces. Removing that path eliminated the reproduced holes.
   Raster/compositor pressure is strongly indicated; actual GPU OOM/driver failure
   cannot be proved from the available browser API, so it is not reported as a
   measured GPU-memory diagnosis.
4. All images originally began loading/decoding simultaneously, with no right-edge
   priority. Every spring frame also rewrote the world/layer transforms, even when
   only character sway changed. React was already not re-rendering per frame;
   this was not a React-state bottleneck.
5. During resize testing a frame could combine new item sizes with the old camera
   translation. Layout changes and translation now occur together in the same RAF.

## Source size and memory

See history-assets-audit.json for every file's bytes, dimensions and SHA-256.

| Group | Count | Original dimensions | Total compressed MiB | RGBA MiB per image |
| --- | ---: | --- | ---: | ---: |
| people | 18 | 2109 × 2984 | 22.28 | 24.01 |
| map | 14 | 3255 × 3255 | 49.53 | 40.42 |
| layer | 3 | 11166 × 2620 | 12.87 | 111.60 |

Total files: 84.69 MiB. Full RGBA expansion: 1332.75 MiB before filter surfaces,
texture copies or mipmaps. This is a pixel-count estimate, not measured browser
resident memory. Chrome exposed JS heap of approximately 12.8 MiB in a test sample;
JS heap excludes native image decode buffers and GPU allocations. Actual process/GPU
resident memory was not accessible. No source resolution was reduced, no source
files were rewritten, and no image derivatives or combined illustration were kept.

## Final implementation

- Coordinates remain in placements.json; config.js remains byte-identical. At
  resize, multiply coordinates/dimensions, title font size, shadow distances and
  perspective distance by the same scene scale. Render directly at final CSS size;
  the ancestor translates without scaling. This preserves the reference geometry
  and physical motion while avoiding reference-sized filtered ancestor surfaces.
- Each immutable original image lives in a persistent wrapper. The wrapper rotates
  about the same original head pivot; the image handles the same contour shadow.
  Maps still have no filter. No backface hiding or blanket will-change is used.
- Only the viewport and a generous prepaint margin are visible to the renderer.
  Source URLs and DOM nodes stay assigned once; leaving the viewport does not
  unmount, clear src, or explicitly reload anything. Browser decode cache eviction
  remains browser-controlled. Hidden springs advance numerically, and nearby
  characters retain their original response on return.
- Spring, parallax and wheel direction/gain parameters are unchanged. Snap only
  already-settled numerical residuals to zero and remove the idle 3D transform.
  Camera/parallax style writes happen only when camera or dimensions change.
- A two-slot loader bounds outstanding request/decode work, prioritizes the initial
  right viewport and upcoming content, and reschedules queued assets around the
  current destination. Each source has queued/loading/ready/failed state.
- Position uses manifest geometry, never decoded dimensions, so loading cannot
  shift layout. Initial viewport waits for its own decoded sources, not the whole
  strip. A cold destination is held until its required sources settle; this can
  briefly pause movement on first load, rather than showing missing imagery.
  Failures are terminal and logged with asset ID/URL; they do not hide other art
  or trigger a retry loop. Failure cannot make a genuinely unavailable asset appear.
- One RAF loop handles input, geometry, camera, parallax and springs. ResizeObserver
  marks layout dirty; event callbacks do not run image loops or force layout.
  RAF stops after settling; listeners/observer/load callbacks clean up on unmount.

## Verification and remaining limits

- Three loader tests pass: right-edge priority/concurrency and no duplicate src;
  single-image failure isolation/progression; disposal with in-flight requests.
  Command: `node --test src/dev/history/imageLoader.test.mjs`.
- Separate Vite test-entry build passed. This remains a development-only HTML
  entry; no routing or production build configuration was changed.
- Chrome full sweep in six overlapping steps, then reverse, plus rapid alternating
  endpoint jumps: no missing rectangles reproduced after repair. All 35 images
  decoded; source sizes unchanged. Screenshots cover the entire illustration.
- DOM comparison: every asset's scaled x/y/width/height agrees with placements
  within 0.01 CSS pixel. Maps have no shadows; resting 3D transforms count is zero.
- Nonzero rotateX/rotateZ values were observed during wheel input. Background
  offsets were independently observed at -4.58194 / -2.54552 / -1.01821 CSS pixels
  mid-scroll, consistent with unchanged 18/10/4 reference-pixel amplitudes.
- Resize checks covered 390 × 844 and 1280 × 900; title remained complete at left
  and bounds/normalized camera recovered correctly. The transient mismatched resize
  frame led to the final atomic RAF update.
- Representative automated sweep sample: 217 consecutive active frame gaps,
  median 8.3 ms, p95 10.4 ms; JS update p95 0.3 ms. Worst gap was 425 ms and long
  tasks were still recorded during abrupt transitions/capture. These are local
  instrumented observations, not a controlled before/after FPS benchmark. Capture,
  automation overhead and browser native raster/decode work are included in gaps.
  Therefore extreme jump stutter is NOT claimed completely solved.
- A runtime shadow-canvas experiment increased long-frame frequency and was
  removed. Final implementation retains normal alpha drop-shadow on the original
  image, separated from its animated wrapper; no canvas cache ships.
- Browser startup, first-load network throttling, physical trackpad feel, Safari,
  Firefox, low-memory GPUs and other device-pixel ratios still need device testing.
  The original 1.3 GiB potential decode footprint remains material. Future asset
  optimization could use lossless alpha-bound crops with exact coordinate/pivot
  compensation or lossless compression, preserving every art pixel. This is a
  recommendation only; no such derivatives were made in this task.
- Official homepage was opened and showed the existing IntroScreen/entrance
  controls. SHA-256 before/after confirmed unchanged original PNGs, placements,
  config, App.jsx, main.jsx and IntroScreen JSX/CSS. Existing unrelated workspace
  edits were preserved.

## File inventory for this update

Modified: src/dev/history/entry.jsx, history.css, README.md.
Added: src/dev/history/imageLoader.js, imageLoader.test.mjs, diagnostics.js;
docs/history-assets-audit.json, history-stability.md,
history-stability-before.png and history-stability-after.png.
No original artwork, title position, route, App, IntroScreen or config changed.
