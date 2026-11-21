// Current Codex Edition surfaces. Legacy comic artwork keeps its native editor.
export const PAGE_EDITOR_SCOPES = {
  intro: '.intro-screen',
  home: '.site-shell .edition-header, .home-content, .site-shell .site-footer',
  comic: '.comic-intro',
  'big-test': '.main-scene, .edition-lab-index, .edition-lab-documents, .big-introduction-stack',
  'globe-test': '.gt-page',
  'telescope-test': '.telescope-test',
  'natural-test': '.natural-test:not(.human-test)',
  'human-test': '.human-test',
  'ball-test': '.ball-test',
  'bottled-weather': '.wp-page',
  't-comic': '.t-comic-page',
  'ball-comic': '.b-comic-page',
}
export const PAGE_LAYOUT_TARGETS = {
  intro: '.edition-intro-orbit, .intro-squares > *, .intro-content, .intro-replay',
  home: '.edition-cover-art, .edition-cover-stamp, .edition-tool-cards > button, .edition-tool-image img, .edition-cover-copy',
  'big-test': '[data-dev-layout], [data-focus-decoration], .big-test-shape-position, .big-test-small-square, .big-test-square, .big-test-document-panel, .big-test-document-cover, .big-test-banner, .big-test-maintenance, .big-introduction-stack img',
  'globe-test': '.gt-decor > *, .gt-model, .gt-header, .gt-body-picker, .edition-observation-invitation, .gt-notes, .gt-note-dots, .gt-story-illustration, .gt-avatar, .gt-story-dialog, [role="dialog"]',
  'telescope-test': '.tt-window, .tt-mentor, .tt-character, .tt-dialogue, .tt-compass, .tt-drawer, .tt-header svg',
  'natural-test': '.nt-category, .nt-decoration, .nt-entry, .nt-entry-icon, .nt-reading, [role="dialog"]',
  'human-test': '.nt-category, .ht-landmark, .ht-diagram, .ht-pattern, .nt-entry, .nt-entry-icon, .nt-reading, [role="dialog"]',
  'ball-test': '.ball-background > *, .ball-character, .edition-character-portrait, .ball-dialogue, .ball-work-card, .ball-work, .ball-card, [role="dialog"]',
  'bottled-weather': '.wp-orbit, .wp-world-plate, .wp-potion-paper, .wp-notebook, .wp-ending-paper, .wp-potions > button, .wp-margin-note',
}
export const TEXT_CANDIDATES = 'h1,h2,h3,h4,p,span,strong,em,small,label,button,a,figcaption,summary,li,td,th'
export const EDITOR_UI = '.dev-editor-launcher, .layout-editor-panel, .text-editor-panel, .model-editor-panel, .text-draft-layer, .layout-editor-stage, .maplibregl-control-container, .tt-attribution, .wp-debug'
