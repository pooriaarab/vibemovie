import type { ShotRecipe } from './recipe-types.js';

export const establishRecipes: readonly ShotRecipe[] = [
// ── establish ─────────────────────────────────────────────────────────
  {
    id: 'crane-rise-reveal',
    role: 'establish',
    name: 'Crane Rise Reveal',
    purpose: 'Establish from detail to whole: start glued to one real data row, then a crane arm rises and pulls back so rows flow in until the full dashboard fills frame.',
    energy: 'high',
    suggestedSeconds: 5,
    promptHints:
      'Camera locked on a tight close-up of a single data row, then rises vertically along Y and pulls back on a decelerating ease, rows streaming in from below as the full dashboard fills the frame and settles to a true still.',
    pitfall:
      'The starting detail is stared at 3.2x zoom — rasterize it hires first or text blurs; pick rise XOR dive per film (do not pair with a drone-dive).',
  },
  {
    id: 'overhead-camera-moves',
    role: 'establish',
    name: 'Overhead Camera',
    purpose: 'The tilt angle itself tells the story: the page lies flat, the camera "looks up" to right it, content rows flowing into view like unrolling a blueprint.',
    energy: 'med',
    suggestedSeconds: 5,
    promptHints:
      'Page lies flat at a steep tilt showing only a thin perspective band of its top edge; the camera tilts up toward level, rows of content flowing into view one by one until the full page reads flat.',
    pitfall: 'Pick this OR crane-rise-reveal for an establishing open — two "reveal opens" in one film reads as the same trick.',
  },
  {
    id: 'icon-field-colorize',
    role: 'establish',
    name: 'Icon Field Colorize',
    purpose: 'Lay out the full capability surface as a field of grey icons, then wash it with brand-color waves — "look how much this does", lit up at once.',
    energy: 'med',
    suggestedSeconds: 4,
    promptHints:
      'Over a hundred small grey icons stagger into frame and fill it as background texture, hold one beat, then brand color sweeps across as fast descending horizontal waves (blue first, then orange/green/red in lower bands).',
    pitfall:
      'The color pass must NOT be a same-frame hard flip — it is multiple color waves sweeping down over about half a second; a hard flip reads as a swapped image.',
  },
  {
    id: 'morph-from-primitive',
    role: 'establish',
    name: 'Morph From Primitive',
    purpose: 'The subject grows in place rather than flying in — a stroked circle takes a breath, then its outline continuously morphs into a rounded card as content fades in.',
    energy: 'med',
    suggestedSeconds: 5,
    promptHints:
      'A simple stroked circle at center breathes (scale 1 to 1.12 to 1) in anticipation, then its outline smoothly morphs into a rounded-rect card while the content fades in.',
    pitfall: 'The breath is the anticipation beat — without it the morph reads as a pop; it is the reverse direction from UI-to-primitive.',
  },
  {
    id: 'skeleton-reveal',
    role: 'establish',
    name: 'Skeleton Reveal',
    purpose: 'Stage the product UI arrival as three fidelity jumps: hand sketch to grey skeleton bars to real content — the "becoming real" arc.',
    energy: 'med',
    suggestedSeconds: 6,
    promptHints:
      'UI arrives in three jumps: a quick hand-drawn sketch, a fast swap to grey skeleton bars rolling in, then a slow push as the skeleton resolves into the real filled product UI.',
    pitfall: 'Each "becomes real" swap is a beat — the two fidelity transitions are the whole point; rushing them kills the arc.',
  },

  ];
