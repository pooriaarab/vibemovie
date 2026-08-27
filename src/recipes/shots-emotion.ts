import type { ShotRecipe } from './recipe-types.js';

export const emotionRecipes: readonly ShotRecipe[] = [
// ── emotion ───────────────────────────────────────────────────────────
  {
    id: 'light-play-moves',
    role: 'emotion',
    name: 'Light Play',
    purpose: 'Treat light as a fourth brush (sweep, wipe, bloom): a dark-scene title reveal by a light sweep, crown the hero card with light, or impact-flare the slam frame. Light does what motion cannot.',
    energy: 'med',
    suggestedSeconds: 5,
    promptHints:
      'Light as a fourth brushstroke: a soft light sweep reveals a title out of darkness; or a quiet bloom crowns the hero card with light (low energy, the "lit" moment is the peak); or a hard impact-flare blooms on a slam frame.',
    pitfall: 'The crown variant is deliberately low-energy — the bloom is the only peak; over-animate it and it stops being a crown and becomes a trick.',
  },
  {
    id: 'tension-camera-moves',
    role: 'emotion',
    name: 'Tension Camera',
    purpose: 'Small moves, all the force in emotional semantics — freeze-and-orbit, tilt-righted, imperceptible slow push, or pull-back-dim. Each is a direct word for "what should the audience feel here".',
    energy: 'med',
    suggestedSeconds: 5,
    promptHints:
      'Small moves, heavy emotion: A — freeze mid-motion and orbit the camera around to examine; B — a tilted uneasy angle rolls back to level on the beat; C — an imperceptibly slow push building pressure, hard-cut to release at the peak; D — pull back while surroundings extinguish layer by layer, leaving one suspended point.',
    pitfall: 'Variant C "first two seconds must be unnoticeable" is the design intent, not a flaw — judge it on full playback, not a frame pull.',
  },
  {
    id: 'collab-cursor-moves',
    role: 'emotion',
    name: 'Collab Cursor',
    purpose: 'Elevate the named collab cursor to an actor — two named cursors choreograph a handoff story in pure dark space with zero UI, or several drift as ambient particles for "the team is here" warmth.',
    energy: 'med',
    suggestedSeconds: 5,
    promptHints:
      'Named collab cursors (with identity chips) as actors: A — two named cursors move in dark empty space, their positions telling a handoff story with no UI at all; B — several cursors drift in and float as ambient particles for team presence, one stopping to type a cameo.',
    pitfall: 'Chip color equals identity code, must be consistent film-wide (blue equals Designer stays blue); a mid-film color change reads as a different person.',
  },
  {
    id: 'voice-waveform-live',
    role: 'emotion',
    name: 'Voice Waveform Live',
    purpose: 'The only functional voiceprint — the "listening to you" live receipt. Speaking towers tall, pauses shrink to a dot-row, history scrolls left. The audience reads "it is really listening" from the rise and fall alone.',
    energy: 'med',
    suggestedSeconds: 5,
    promptHints:
      'A live functional voiceprint: while "speaking" the waveform towers tall and dynamic, on "pauses" it shrinks to a dot-row, history scrolling left — the audience reads "it is genuinely listening" from the rise and fall alone, no other content needed.',
    pitfall:
      'If the film has a real narrator or voice track, the waveform envelope MUST follow that voice — the speak and pause segments align to the audio speak and pause; a one-second offset reads as fake.',
  },
];
