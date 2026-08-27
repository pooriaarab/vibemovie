import type { ShotRecipe } from './recipe-types.js';

export const revealRecipes: readonly ShotRecipe[] = [
// ── reveal ────────────────────────────────────────────────────────────
  {
    id: 'neon-frame-orbit-drop',
    role: 'reveal',
    name: 'Neon Frame Orbit Drop',
    purpose: 'A grand one-off reveal: a neon frame traces itself then orbits from the left side to the right while all components drop in from above simultaneously and snap into place.',
    energy: 'high',
    suggestedSeconds: 4,
    promptHints:
      'A neon outline frame traces itself, then the camera arcs continuously from the page left side to its right while every component and text drops from above at once, each snapping dead with its shadow vanishing on contact — a single simultaneous whole-page arrival.',
    pitfall:
      '"Simultaneous" is the grammar — all components start, land, and shed shadows on the same frames; stagger it and it stops being a unified reveal (that is the runway-rain variant instead).',
  },
  {
    id: 'spotlight-sweep-moves',
    role: 'reveal',
    name: 'Spotlight Sweep',
    purpose: 'In the dark the audience only sees what the light shows — light is illumination and editing: where it sweeps, panels appear; when it leaves, they exit.',
    energy: 'med',
    suggestedSeconds: 4,
    promptHints:
      'Near-black scene; a purple-edged spotlight glow creeps along UI panel edges and logos (lit, slightly blurred — light stroking the interface, not a stroke animation). Move and expand strictly at constant linear speed; a panel lights up where the light touches and dims as it passes.',
    pitfall: 'Constant linear speed is the命门 — easing makes the light feel intentional; only linear reads as a mechanical searchlight sweep.',
  },
  {
    id: 'stroke-segment-build',
    role: 'reveal',
    name: 'Stroke Segment Build',
    purpose: 'An Alien-titles reveal: the title "develops" — discrete stroke segments light up out of order, unreadable for most of the time, then the last segments land and the word suddenly reads. Recognition is the hook.',
    energy: 'med',
    suggestedSeconds: 5,
    promptHints:
      'Title broken into discrete stroke segments; segments light up out of order over the first part (mysterious fragments), then the final key segments land and the full word suddenly reads — recognition is the beat.',
    pitfall: 'The hook strength depends on how long the unreadable period holds and how late the key segment lands — do not blow the reveal early.',
  },

  ];
