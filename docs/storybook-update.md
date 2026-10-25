# Storybook controls and book alignment

Only Storybook presentation and the book registration were changed.

- EditionChrome: remove the lower-left chapter label and lower-right keyboard hint;
  rename the same home-navigation button to exactly `前往WorlD`. With the preceding
  label removed, the existing flex layout places the button at the original label
  position (actual Chrome x=75.59375 at 1512px width). Button CSS/callback unchanged.
- Exclude only screen=comic from the shared bottom-right edition-navigation.
  Home and all other page conditions remain unchanged.
- ComicIntro/ComicIntro.css and storybookBookLayout.js: derive APNG placement from
  current openbook layout, including loaded editor drafts. No image files changed.

## Registration evidence

Original openbook is 3815×1122, opaque bounds (83,107)-(3751,1057).
Original book-anime is a 3798×1795 APNG, 8 frames at 185ms each (1480ms total).
Its first-frame opaque bounds are (73,755)-(3741,1705). Comparing the matching
3668×950 alpha regions found exact equality. Animation source coordinates therefore
map to openbook source coordinates with (+10,-648).

The existing separate animation placement put its book silhouette approximately
15.4 CSS px too high in the measured view. Registration now derives its x/y/width
from openbook's current width and stage percentages, and uses the same rotation
around the same physical center. Different transparent canvas sizes are retained;
forcing the two full image rectangles to have identical bounds would be incorrect.

Actual Chrome post-fix silhouette registration residual: x=-0.001955px,
y=0.003954px. Observed first page → APNG turning → second page ready, with one
aligned book outline. Timing/state handlers were not altered. The math regression
test checks corresponding source points across two stages and three rotations.
Production build and the registration test passed (existing chunk-size warnings).
New button navigation reached home, whose edition-navigation was still present.
Screenshot: storybook-update.png. Preview: /?edition=story.

## Editor persistence, from current code

LayoutEditor only in DEV restores localStorage key
`layout-editor:storybook-intro-layout-v5`. While the editor is open, dirty drag/
resize/property edits merge into this key automatically. Refresh/server restart
retains them for the same browser profile and origin (scheme/host/port), until
storage is cleared/reset. Private browsing/new origin/another browser does not
share them. The source config and deployed defaults are not updated.

Copy config serializes current layout values and copies JSON to the clipboard
(with a textarea fallback); it does not write project files. Shared permanent
changes require incorporating that config into source. Text editor persistence
is separate (`genesis:text-editor:<pageId>:v1`); this report's DEV-only restore rule
specifically describes the Storybook image LayoutEditor.
