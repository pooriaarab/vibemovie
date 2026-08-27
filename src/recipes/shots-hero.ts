import type { ShotRecipe } from './recipe-types.js';

export const heroRecipes: readonly ShotRecipe[] = [
// ── hero ──────────────────────────────────────────────────────────────
  {
    id: 'spotlight-hero-card',
    role: 'hero',
    name: 'Spotlight Hero Card',
    purpose: 'The single-protagonist open: a wandering spotlight locks onto one card, the camera pushes in on an angle, the card rises, hovers, is scanned by a contour beam, then reseats.',
    energy: 'med',
    suggestedSeconds: 5,
    promptHints:
      'A roaming spotlight narrows and locks onto one card in a grid; camera pushes from a flat full-page to a tilted close-up (left-side angle), the card rises with overshoot, hovers with a gentle bob, a glowing rounded-rect contour beam traces it twice (fast-bright then slow-dim), then it reseats.',
    pitfall:
      'Open with a SINGLE card and one complete action arc — a multi-card dance cannot carry a first impression; slow the rise-to-reseat toward three seconds, first drafts are always too fast.',
  },
  {
    id: 'crash-zoom-punch',
    role: 'hero',
    name: 'Crash Zoom Punch',
    purpose: 'One beat slams from a wide to a target close-up — "look at THIS". Land with an overshoot bounce (spring) or a hard impact shake (weight), by emphasis.',
    energy: 'high',
    suggestedSeconds: 3,
    promptHints:
      'In about six frames, crash-zoom from a wide framing to an extreme close-up on the target card filling 60 to 75 percent of frame; either overshoot and rebound 3 to 6 percent (spring) or land hard with a high-frequency impact shake that decays in six frames.',
    pitfall:
      'Do not mix the two landings (rebound plus shake reads as a glitch); cap at two crash-zooms per film, and the landing target must be high-res or text blurs.',
  },
  {
    id: 'runway-ground-skim',
    role: 'hero',
    name: 'Runway Ground Skim',
    purpose: 'Treat the UI as a runway: low-angle, cards hang at staggered heights then rain down in an overlapping fast volley, landing dead with zero bounce, then the whole page stands up to vertical.',
    energy: 'high',
    suggestedSeconds: 4,
    promptHints:
      'Strong low-angle perspective, page lying flat like a runway; UI cards suspended at staggered heights then drop in an overlapping rain (small stagger, gravity acceleration), each landing dead-still with no bounce; once all are down the whole page rotates up to vertical and the camera pulls to center.',
    pitfall:
      'The drop feel is crisp: zero bounce (the squish was rejected), a short drop frame count (longer was rejected as slow), and overlapping parallelism (waiting for one to land before starting the next was rejected).',
  },
  {
    id: 'segmented-thumb-hero',
    role: 'hero',
    name: 'Segmented Thumb Hero',
    purpose: 'A mode switch told entirely by the segmented control thumb sliding eight frames — "we moved from A to B" with no page context; the control is the stage.',
    energy: 'med',
    suggestedSeconds: 4,
    promptHints:
      'Extreme close-up of a segmented control; cursor slides in, presses with a ripple, the thumb slider glides eight frames to the other segment, and a new icon pops in — four beats: arrival, decision, response, reward.',
    pitfall: 'All four beats are required — drop the cursor and the UI looks self-animated; drop the icon pop and the switch feels unrewarded.',
  },
  {
    id: 'space-camera-moves',
    role: 'hero',
    name: 'Space Camera',
    purpose: 'Treat the flat page as a real 3D object the camera flies around — exploded-view (parts blow out along Z then reassemble) or drone-dive (god-view plunges to a hero close-up).',
    energy: 'high',
    suggestedSeconds: 5,
    promptHints:
      'Either the whole page tilts in 3D and its components blow out along the Z-axis, hover, then reassemble in reverse with an impact shake; or a near-vertical overhead hover, then a hard dive that air-cushions to a stop on a hero-card close-up, motion-blurred through the dive.',
    pitfall:
      'Both variants need real layered or high-res screenshots — one flat page cannot explode, and the dive lands on a close-up that blurs without hires rasterization; cap at two of these big moves per film.',
  },

  ];
