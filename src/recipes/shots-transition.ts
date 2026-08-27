import type { ShotRecipe } from './recipe-types.js';

export const transitionRecipes: readonly ShotRecipe[] = [
// ── transition ────────────────────────────────────────────────────────
  {
    id: 'wipe-transitions',
    role: 'transition',
    name: 'Wipe Transitions',
    purpose: 'The geometric-wipe family — both pages stay still while one geometric boundary sweeps across to hand off. Clock-wipe = "dashboard refreshed a screen of data"; blinds-slice = "flip the page".',
    energy: 'med',
    suggestedSeconds: 5,
    promptHints:
      'Old and new pages both still; a geometric boundary sweeps across to reveal the new — either a clock-hand radar sweep from center (data-refresh feel) or vertical blinds flipping in a staggered wave (page-turn feel). The wipe edge carries bright highlight lines so it does not read as a slideshow transition.',
    pitfall:
      'The wipe boundary MUST carry highlight or glow lines — a line-less wipe reads as a PowerPoint transition; light lines need a dark edge-stroke on light areas and a bright white core on dark.',
  },
  {
    id: 'card-flip-reveal',
    role: 'transition',
    name: 'Card Flip Reveal',
    purpose: 'A semantic flip — a card front (feature UI) and back (the number it produced) are a cause-and-effect pair; the flip answers "so what?". Three staggered cards read as "results roll in".',
    energy: 'high',
    suggestedSeconds: 5,
    promptHints:
      'A row of cards each flips over; the front is the feature UI, the back is the result number it produced — the flip answers "so what?". Three cards flip in a stagger, reading as consecutive results.',
    pitfall:
      'Same technique root as a grid wave-flip but different semantics — that is batch entrance, this is cause-to-result; do not conflate.',
  },
  {
    id: 'bubble-swarm-takeover',
    role: 'transition',
    name: 'Bubble Swarm Takeover',
    purpose: '"Curtain" thinking — a swarm of brand objects drifts into foreground, swells to fill the frame hiding a hard cut, then drifts apart to reveal the new scene. Longer transitions mean more brand exposure, not slow.',
    energy: 'high',
    suggestedSeconds: 4,
    promptHints:
      'A swarm of brand objects (bubbles, petals, icons) drifts in and swells to completely fill or occlude the frame (hard cut hidden at peak occlusion), then drifts apart to reveal a new scene.',
    pitfall:
      'The peak MUST truly occlude the full frame or the cut shows; the hidden-cut variant is the one-to-three-frame "invisible scissors" — pick by how long you want the brand on screen.',
  },
  {
    id: 'line-carry-transition',
    role: 'transition',
    name: 'Line Carry Transition',
    purpose: 'The scene never changes — a single line carries you across. A progress bar fills, its tip extends off the card edge; the camera follows it panning into the new world, the line dog-legs to frame the next card.',
    energy: 'med',
    suggestedSeconds: 5,
    promptHints:
      'A progress bar fills and its tip extends into a long line off the card edge; the camera follows the line panning sideways into a new scene, the line dog-legs to draw the next card frame, the frame closes and content fades in — the eye never leaves the line.',
    pitfall: 'Graphic continuity IS the transition — do not cross-fade; the line belongs to the whole cut, not to one element.',
  },
  {
    id: 'color-block-step-wipe',
    role: 'transition',
    name: 'Color-Block Step Wipe',
    purpose: 'Zero interpolation, zero easing — color blocks grow like retro pixel-game tiles, every step a hard cut, stillness between steps. The stutter itself is the rhythm.',
    energy: 'high',
    suggestedSeconds: 3,
    promptHints:
      'Brand color blocks grow in hard discrete steps with no easing and no interpolation — each step is a hard cut, fully still between steps (retro pixel-game tile growth). Three to five steps total; a content card can ride each step.',
    pitfall: 'Distinct from the smooth clock and blinds wipes — this is the stuttered no-tween pixel feel; do not smooth it out.',
  },
  {
    id: 'brand-frame-snap',
    role: 'transition',
    name: 'Brand Frame Snap',
    purpose: 'Wrap real screen recordings in a thick brand-color picture frame — the frame appears first, then its color becomes the chapter code. On a chapter switch the whole frame hard-flips color in one frame.',
    energy: 'med',
    suggestedSeconds: 4,
    promptHints:
      'A thick brand-color picture frame draws around a screen recording (frame first, content second — ritual); on a chapter switch the entire frame hard-flips to a new brand color in a single frame (no gradient), the window content and corner badges swapping in the same frame.',
    pitfall:
      'The flip MUST be same-frame across frame, window content, and badge text — even two frames apart and the gear-shift scatters into three small animations; keep the color code consistent film-wide.',
  },

  ];
