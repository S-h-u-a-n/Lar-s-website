# Historical hover labels

All 18 original PNGs were visually checked in a numbered contact sheet and their
reference x positions checked (people-1 rightmost, people-18 leftmost). The supplied
chronological themes happen to match the numbered sequence after inspection.
Visual cues: bipedal ape; fire/stone tools; crop basket and fork; Sumerian regalia;
Egyptian headdress; classical toga; turban and book; Chinese official and scroll;
medieval crusader armor; fur hat, bow and saber; Renaissance dress; navigator and
compass; powdered wig/quill/book; cap and wrench; WWI spiked helmet; WWII uniform;
space suit; modern phone. The specific Song attribution for people-8 could not be
established from clothing alone and was explicitly confirmed by the user before
implementation. No mapping remains pending after that confirmation. Labels use
the user's supplied wording/dates, not independently researched historical claims.

The prior lower-body proposal had not been implemented when interrupted. The new
label has only upper-right, upper-left and above candidates. It uses original PNG
alpha bounds plus the existing maximum hover envelope. Neighboring foreground
character envelopes are considered; selected artwork overlap is heavily penalized.
It cannot guarantee avoiding every line of the large background illustrations,
which fill much of the panorama; it avoids the selected character and prioritizes
neighboring foreground silhouettes. Title text, replay control and the visible
Into the World hint are also excluded. Fixed viewport placement prevents rotation,
scale, clipping by the moving world, and layout shifts. There is one label node,
no separate hover system, and no animation/placement/art values were changed.

Verification in Chrome on the official root:
- All 18 IDs individually alpha-hit and displayed their correct two-line text.
- Every measured label stayed inside the viewport; only one label existed.
- Most cases used upper-right. A deliberately right-edge people-4 case used
  upper-left (x=1119.33,y=370.669); when neighboring artwork prevented both sides,
  people-1 used above instead. No lower-body candidate exists.
- people-18 settled at original scale=1.1000; paper remained an unrotated overlay.
- Leaving produced a measured intermediate fade opacity 0.0732, then 0; aria-hidden
  became true and pointer-events remained none.
- Scrolling to camera=0 retained intro/idle until a fresh forward gesture. Title
  replay still worked; fresh scroll entered comic and unmounted the label. No
  console errors/warnings were captured.
- Production build passed; all 15 history tests passed, including upper-right/
  upper-left placement, neighbor avoidance and stable anchor during sway/scale.

Changed: HistoryTest.jsx; added labels.js, labelPosition.js, HistoryLabel.jsx,
historyLabel.css, labels.test.mjs. README/report and screenshot updated/added.
All text is editable in labels.js; positioning/fade values in LABEL_STYLE and the
position candidate function; paper styling in historyLabel.css.

## Current close-placement revision (supersedes the initial positioning above)

The previous maximum-sway bounding box and obstacle scoring placed labels too far
from the active person. Both have been removed. The existing alpha mask supplies
left/right contour points from the upper 18% of each visible silhouette, so lower
arms/weapons and transparent PNG padding do not drag the label anchor sideways.
The unrotated, steady 1.10 hover pose supplies the screen anchor; paper itself does
not rotate/scale. Its lower-left corner sits diagonally 14px from that right-side
point. Only viewport constraints may use the matching left contour or clamp it.
No other person or title may displace the label through automatic avoidance.

Appearance: #fefdf9; border-radius:12px 0 12px 0. Border, text hierarchy, 18 labels,
alpha hover detection, entrance/parallax/scroll, character animation and paper
fade implementation remain unchanged. Label-only title layout measurements and
per-frame neighbor-envelope calculations have also been removed.

Actual Chrome check: people-1 through people-10 hovered in sequence, each label ID
matched its active person. At settled scale=1.1000, corner-to-contour distances
ranged 13.9978–14.0026 CSS px. All ten used upper-right in the sampled views.
Computed background was rgb(254,253,249), radius shorthand 12px 0px (the required
alternating corners). Screenshot: history-label-close.png. All 15 history tests
passed, now covering tight gap, viewport-only correction, transparent padding/
weapon rejection and stable anchors during existing motion.

Revision files: labelPosition.js, HistoryTest.jsx, HistoryLabel.jsx,
historyLabel.css, labels.test.mjs; README/report and screenshot.
