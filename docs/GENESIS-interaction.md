# GENESIS intro interaction

Only IntroScreen uses GenesisLetters. Each of the seven positions imports one
independent original PNG from 畫/IntroScreen/text-image (01-g through 07-s).
All originals are 1024 × 1024 RGBA; no artwork has been edited or converted.
Measured nontransparent bounds are recorded in GenesisLetters for uniform visible
height and natural width. The full original image is rendered without clipping.

The fixed text slots preserve the heading layout. Absolute images and translated
neighbours animate inside those slots; the subtitle and entry button do not move.
Opening runs once, followed by pointer exploration. No A/B variants, idle random
playback, background changes, or runtime image generation are used.
Reduced-motion users receive the original text. Failed image loads also retain text.
Effect cleanup supports React StrictMode and removes timers, listeners and animations.

Animation spring formula and exit timing adapted from:
https://github.com/boknowsworld/boknows-text-image-template
Revision: 72bc384dd1fbeb007dffdec8f4e7218a59338be6
MIT copyright notice and full terms ship in public/licenses/boknows-text-image-MIT.txt.
That license applies to the reused code, not the user's independent artwork.

Before-implementation website snapshot:
0dcb17447af5364fd9d0aab2e0f916616b986370

To undo only this interaction while keeping the user's new artwork/folder moves:

git restore --source=0dcb17447af5364fd9d0aab2e0f916616b986370 -- src/components/IntroScreen.jsx src/components/IntroScreen.css

GenesisLetters.jsx, this note, and public/licenses/boknows-text-image-MIT.txt
can then be removed if no longer needed. Keep the user's artwork. Rebuild with
npm run build if using dist. The restored main artwork at its old path is identical
to the original and is needed by the unchanged Home Page import.

Validation: production build and git diff --check passed. Chrome reported all
seven images decoded with seven unique URLs in the correct order and square
rendered aspect ratios. Seven mouse pointer cases and touch down/up were exercised
in the browser; entry-button bounds stayed unchanged. Native ENTER click reached
the unchanged Home Page. Console showed no interaction errors (an existing
favicon.ico 404 appeared on the first visit). Touch checks used PointerEvent
simulation, not physical mobile hardware.
