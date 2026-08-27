import type { ShotRecipe } from './recipe-types.js';

export const actionRecipes: readonly ShotRecipe[] = [
// ── action ────────────────────────────────────────────────────────────
  {
    id: 'beat-cut-moves',
    role: 'action',
    name: 'Beat Cut',
    purpose: 'In highlight or sprint segments, make the CUT itself the drumbeat — trailer-style accelerating approach (rapid cuts into a held freeze) or awards-ceremony consecutive-flash ritual.',
    energy: 'high',
    suggestedSeconds: 4,
    promptHints:
      'The cut itself is the beat: variant A — trailer-style accelerating approach, several ever-faster cuts building to a dead-still hold; variant B — awards-ceremony, live footage punctuated by hard flashes then a long held freeze.',
    pitfall: 'Density-type high energy — sub-second beats, several channels jumping together; without an audio bed of kicks it reads as chaotic, not rhythmic.',
  },
  {
    id: 'speed-ramp-freeze',
    role: 'action',
    name: 'Speed Ramp Freeze',
    purpose: 'Uniform flow reads as a slideshow. Two time-remap moves on one motion: speed-ramp (fast to gaze to fast, blur on the fast parts only) and freeze-annotate (flow to freeze, marker-pen circle the target to unfreeze).',
    energy: 'high',
    suggestedSeconds: 5,
    promptHints:
      'On one continuous motion: variant speed-ramp — fast, then a slow gaze window, then fast again, with motion blur only on the fast segments (fast-blurred and slow-sharp contrast is half the effect); variant freeze — flow hard-freezes, a marker-pen circle strokes around the target, then it unfreezes and accelerates to catch up.',
    pitfall:
      'The slow or freeze window needs enough frames or the gaze does not land; the fast-to-slow slope contrast needs about tenfold or "slowed down" is not readable.',
  },
  {
    id: 'montage-rhythm-moves',
    role: 'action',
    name: 'Montage Rhythm',
    purpose: 'Paragraph-level rhythm design — charge-burst (blackout hold then explode), flow-sketch (three ultra-close mechanical clicks then whip to the result), or chain-open (a momentum-handoff opening chain).',
    energy: 'high',
    suggestedSeconds: 5,
    promptHints:
      'Paragraph-level rhythm shapes: A — pure black silent hold for one beat then explode open (EDM blackout); B — three ultra-close mechanical detail shots then whip-pan to the lit result; C — a chain of momentum handoffs opening the film.',
    pitfall: 'Variant A is at most one per film and MUST be sound-designed (the blackout frame cuts audio to dead silence, the explode frame is the audio boom) — unsynced it reads as broken.',
  },
  {
    id: 'slam-entrance-moves',
    role: 'action',
    name: 'Slam Entrance',
    purpose: 'The top of the entrance-vocabulary force scale — "slam". Directional (fisheye whip-in), weight (drop with ring-plus-dust-plus-shake), or conduction (the shockwave shoves neighbors aside).',
    energy: 'high',
    suggestedSeconds: 4,
    promptHints:
      'Card slams in with weight: A — fisheye-exaggerated perspective whip-in along the lens snapping flat; B — card drops at oversized scale, a ring burst plus dust plus impact shake all igniting on the same frame; C — the shockwave visibly shoves neighbor cards aside and they rebound.',
    pitfall: 'All three carry screenshake — do not stack shake-family cards in the same shot; one screenshake event per beat.',
  },
  {
    id: 'scroll-brake-moves',
    role: 'action',
    name: 'Scroll Brake',
    purpose: 'A whole year of updates scrolls past as a fast blur-band, then an exponential-deceleration hard-brake stops dead on today release, which lifts off highlighted while the rest dims. Density says "always shipping"; the stop says "today is the big one".',
    energy: 'high',
    suggestedSeconds: 5,
    promptHints:
      'A long vertical list scrolls past fast (blurring into a color band), then an exponential-deceleration hard-brake stops dead on one entry — that entry lifts off the surface and highlights while the rest dims; variant B snaps four L-brackets onto the stopped entry on the exact brake frame.',
    pitfall: 'The high-speed band does not need real readable text (it is a blur) — placeholder grey blocks are fine; reserve real text for the braked entry.',
  },

  ];
