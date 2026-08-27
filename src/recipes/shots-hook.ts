import type { ShotRecipe } from './recipe-types.js';

export const hookRecipes: readonly ShotRecipe[] = [
// ── hook ──────────────────────────────────────────────────────────────
  {
    id: 'brand-ink-open',
    role: 'hook',
    name: 'Brand Ink Open',
    purpose: 'Stamp the brand wordmark into paper grain before any product shot — the audience memorizes the name in one quiet held beat.',
    energy: 'low',
    suggestedSeconds: 3,
    promptHints:
      'Wordmark slowly imprints into textured paper grain with a soft letterpress emboss, settles, then holds dead-still for a full breath before anything moves.',
    pitfall:
      'The held beat belongs to the wordmark settle frame, not a content card; keep opening energy low so it does not crush the later build.',
  },
  {
    id: 'magician-card-flourish',
    role: 'hook',
    name: 'Magician Card Flourish',
    purpose: 'A single hero card is conjured from a flash of light — the ritual of "making it appear" is the hook.',
    energy: 'high',
    suggestedSeconds: 4,
    promptHints:
      'A short blue star-flash, then the card launches from a tiny point at frame center, spins along a curving arc toward camera, and hard-locks dead-still front-facing at near-full-frame.',
    pitfall:
      'The flash must read as light (0.3s), the spin must land exactly front-facing with no settling tail, and the card freezes on arrival — cheap color-block light effects were repeatedly rejected.',
  },
  {
    id: 'dataviz-landscape-open',
    role: 'hook',
    name: 'Dataviz Landscape Open',
    purpose: 'A brand-level abstract open: the data world behind the product shot as a dark landscape of glowing streams converging into one trunk.',
    energy: 'low',
    suggestedSeconds: 6,
    promptHints:
      'Slow steady low-altitude camera flight over a dark field; many thin glowing streams flow in from the deep background and merge into a single bright trunk, scattered with small readable ID labels across three depth layers.',
    pitfall:
      'Use at most once per film, and do not pair with glow-flyline in an adjacent segment — two "dark glowing lines" reads as the same trick.',
  },
  {
    id: 'trailer-grammar-moves',
    role: 'hook',
    name: 'Trailer Grammar',
    purpose: 'The structural moments of a trailer — the open front-loads the three punchiest shots in 0.9s, then a black beat, then the real start.',
    energy: 'high',
    suggestedSeconds: 5,
    promptHints:
      'Three fastest, most striking shots cut back-to-back in under a second, then hard-cut to pure black and hold one silent beat before the title opens.',
    pitfall: 'The black beat must be pure black and empty — it is a breath; anything in it breaks the trailer hook.',
  },
  {
    id: 'input-trigger-moves',
    role: 'hook',
    name: 'Input Trigger',
    purpose: 'First-person grammar — the viewer is using the product, not watching it. The cursor is the hand; the trigger fires the narrative.',
    energy: 'med',
    suggestedSeconds: 5,
    promptHints:
      'An enlarged cursor with personality slides in and clicks a target; the camera pushes toward the click point then gently eases back — slow, anchored on the cursor, it comes back.',
    pitfall: 'Cap at two input-triggers per film — each should be a section-level switch; three rapid keypresses reads as a bug.',
  },

  ];
