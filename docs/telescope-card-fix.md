# Home “遠方的地球” card diagnosis

## Reproduced failure

On the actual dev root /?edition=main, after the existing five-step reveal and
scrolling to ExploreSection, the telescope icon loaded (naturalWidth=1000), the
card was 211.805×372.305px, pointer-events:auto, and its center hit the icon inside
the correct button. However the title h3 had empty textContent and height=0 while
remaining display:block, visibility:visible, opacity:1, font-size:20px.

The DOM adapter had applied the editor record
`codex-home-dom-h3-f6qawo`, selector `[data-dev-scope="tool-telescope"] > h3:nth-of-type(1)`.
The existing Text Editor's Copy Config UI confirmed that exact record's text was
an empty string; other title style values were normal. This is an empty text draft
overriding the source label, not missing artwork, an invisible blocker, or a route
failure. The record also drops out of the adapter's mounted text selection once
its text becomes blank, because the DOM adapter scans only nonempty text.

## Minimal fix

Only ExploreSection.jsx changes: the telescope h3 uses its existing explicit text
editor registration, keeping the same legacy ID/style draft. Whitespace/empty
values fall back to the tool's original name. Valid nonempty text drafts continue
to work. Explicit registration also prevents the DOM adapter from taking control
of that same heading. No storage is cleared/reset or rewritten by a migration;
other cards retain their original rendering. No CSS, route, App state, transition,
telescope page or historical entrance code was changed.

## Trace and actual checks

Unchanged event chain: ExploreSection.onTool('telescope') → App.editionTool →
editionNavigate('telescope') → existing paper curve covering/covered/revealing →
PortalPageArrival → TelescopeTest. The card already reached the correct telescope
page before the fix. The existing BACK deliberately returns to the research room;
existing research-index “世界封面” returns home. That navigation design is preserved.

After fix:
- Title rendered 遠方的地球, height=23.5px, same editor ID and original heading CSS.
- Hover was true with the existing translated/rotated CSS matrix.
- Clicking reached screen=telescope; BACK and LOG enabled. Both persistent curve
  overlays returned to idle, pointer-events:none, with SVGs parked below viewport.
  No stuck transition, white frame or navigation failure was observed in these runs.
- Returned via research room/index → home; title remained present. Clicking the
  card again reached telescope and returned both curtains to idle.
- Home's natural-research card reached natural-test with idle curtains, unchanged.
- Full reload plus original five-step reveal retained the fixed title/23.5px height;
  all six card images loaded. Other five title texts remained unchanged.
- Console inspection showed no captured warnings/errors; production build passed
  with the existing bundle-size warnings.

Screenshot: telescope-card-fixed.png. The only reproduced bug was this local
editor-draft heading disappearance. Other device/browser-specific click/transition
issues were not reproduced; this report does not claim an exhaustive device test.
