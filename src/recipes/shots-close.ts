import type { ShotRecipe } from './recipe-types.js';

export const closeRecipes: readonly ShotRecipe[] = [
// ── close ─────────────────────────────────────────────────────────────
  {
    id: 'outro-group-photo-launch',
    role: 'close',
    name: 'Outro Group Photo Launch',
    purpose: 'Recall one representative element from each feature shown for a group photo, then the wordmark enters as the climax — launch-event scale, energy pushed to the film peak.',
    energy: 'high',
    suggestedSeconds: 5,
    promptHints:
      'Representative elements from every feature shown fly in from the four edges to gather around the center for a group photo, then the brand wordmark drops in as the climax — launch-event scale, crane plus stage light plus particles, the film highest energy.',
    pitfall:
      'First drafts are almost always too conservative — start at product-launch-keynote scale with crane, stage-light, particles; structure before effects (the four-way gather is the skeleton, atmosphere comes after).',
  },
  {
    id: 'ui-strip-away-outro',
    role: 'close',
    name: 'UI Strip-Away Outro',
    purpose: 'The only "subtraction" outro — one click detonates all the UI to exit, leaving black with just the semantic focus (the clicked button). "Launch equals complexity returns to zero".',
    energy: 'med',
    suggestedSeconds: 4,
    promptHints:
      'A single click detonates the entire UI to evaporate — evaporating in order from the outer edges to the center, one layer every few frames, each layer flying outward off-frame; the black field leaves only the one clicked button.',
    pitfall:
      'Evaporation must be ordered (outer-to-center, staggered, each layer with directional motion outward) — random or same-frame-all-vanish reads as a power-outage glitch.',
  },
  {
    id: 'ui-to-brand-morph',
    role: 'close',
    name: 'UI To Brand Morph',
    purpose: 'The brand finale fourth path — a product UI element morphs itself into the brand logo ("the UI you use every day IS this brand").',
    energy: 'high',
    suggestedSeconds: 4,
    promptHints:
      'A product UI element morphs itself into the brand mark — an icon flips once and resolves into the logo, one continuous deformation telling "the daily-use UI is the brand" in a single beat.',
    pitfall:
      'It is a transformation (the reverse direction from morph-from-primitive, and distinct from a gather-without-transform group photo) — keep it one clean morph, do not pile effects.',
  },
  {
    id: 'edit-hook-moves',
    role: 'close',
    name: 'Edit Hook (Button Ending)',
    purpose: 'Rhetoric on the timeline itself — the ending that takes it back: fade to black, logo holds (audience thinks it is over), a sudden easter-egg hard-cut, cut back to logo. A trailer button-ending.',
    energy: 'med',
    suggestedSeconds: 5,
    promptHints:
      'Fade to black, the logo fades in and holds (audience assumes it is over), then a sudden short hard-cut to a UI close-up easter-egg, then hard-cut back to the logo to truly close — playing with the audience "it is finished" expectation.',
    pitfall: 'At most one per film and only at the very end — a button-ending mid-film reads as a glitch.',
  },
  {
    id: 'text-column-converge',
    role: 'close',
    name: 'Text Column Converge',
    purpose: 'Two words sit left and right like a table-of-contents standoff; only on the last word do they converge into the product name — one convergence retcons the whole rotation as suspense setup. Recap or version-reveal energy.',
    energy: 'med',
    suggestedSeconds: 6,
    promptHints:
      'Words alternate in left and right columns (perfectly still, equal margins), rotating through a feature list; only on the final word do the two halves converge once into the product name — one single convergence, no gradual shrink.',
    pitfall: 'The convergence must happen exactly once and only at the end; any gradual shrink spoils the reveal and dilutes it to a progress bar.',
  },

  ];
