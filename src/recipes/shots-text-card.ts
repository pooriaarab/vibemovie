import type { ShotRecipe } from './recipe-types.js';

export const textCardRecipes: readonly ShotRecipe[] = [
// ── text-card ─────────────────────────────────────────────────────────
  {
    id: 'paper-title-card',
    role: 'text-card',
    name: 'Paper Title Card',
    purpose: 'Give the audience one sentence of breath between two product beats — say "what is next and why it matters". Letterpress emboss keeps the card in the same world as the paper-and-ink visuals.',
    energy: 'low',
    suggestedSeconds: 2,
    promptHints:
      'A single short phrase embossed into textured paper with a letterpress press, holds for one breath between two scenes — concrete copy naming the feature and its payoff, never abstract metaphor.',
    pitfall:
      'Copy must be concrete (feature name plus specific payoff) — abstract metaphor words get rewritten; place a guiding card before an important feature, it is a chapter signpost not decoration.',
  },
  {
    id: 'cel-flash-stomp',
    role: 'text-card',
    name: 'Cel Flash Stomp',
    purpose: 'Stomp-typography alone is just weight; background color-flash alone is just flash. Welded: the word slam-frame is the flash ignition — subject still, world quaking in peripheral vision. The opposite of screenshake.',
    energy: 'high',
    suggestedSeconds: 5,
    promptHints:
      'Each word slams down dead-still onto frame; on each slam-frame the solid background color hard-flashes to a new hue and back. Subject rock-still, only the world flashes — peripheral-vision impact. Three words, three beats.',
    pitfall: 'Sound-dependent — each word-slam needs a kick and the flash must align to the beat; without the kick it is just a janky strobe.',
  },
  {
    id: 'gradient-word-sweep',
    role: 'text-card',
    name: 'Gradient Word Sweep',
    purpose: '"Energize" one keyword in an otherwise-neutral line — a gradient color sweep zips across the chars like an injection; the wavefront is brightest, then it settles to a steady glow with linking sparks.',
    energy: 'high',
    suggestedSeconds: 3,
    promptHints:
      'One keyword in an otherwise-neutral line gets electrified: a bright gradient color sweep zips across the characters left-to-right in 15 to 20 frames (the wavefront brightest, trailing off), then settles to a steady glow with thin linking sparks between chars breathing.',
    pitfall:
      'Fill-process must NOT follow a light dot; sparks appear only after fill; glow stays restrained. A slow sweep reads as a progress bar — keep it 15 to 20 frames.',
  },
  {
    id: 'letterspace-materialize',
    role: 'text-card',
    name: 'Letterspace Materialize',
    purpose: 'The wordmark does not fade or type — it "crystallizes": all letters strokes begin growing simultaneously and converge to the word in one synchronized breath (wide-tracked caps).',
    energy: 'low',
    suggestedSeconds: 4,
    promptHints:
      'All letters of a wide-tracked uppercase wordmark begin drawing their strokes at once and converge to the complete word in a single synchronized breath — like an invisible hand writing all letters simultaneously, every letter starting and finishing on the same frames.',
    pitfall:
      'Strokes must be continuous (no mask-halves — a half-then-rest reads as fake) AND synchronized (staggered letters read as typewriter semantics, not whole-word ritual).',
  },
  {
    id: 'split-flap-title',
    role: 'text-card',
    name: 'Split-Flap Title',
    purpose: 'The wordmark as a station-board "broadcast" with mechanical announcing cadence — for countdowns, ship-dates, metric reveals, or retro-mechanical texture.',
    energy: 'med',
    suggestedSeconds: 5,
    promptHints:
      'A title rendered as a split-flap station departure board: a stretch of scrambled flapping, then characters cascade-flip left-to-right to settle on the real title, holding dead-still. Mechanical announcing cadence.',
    pitfall: 'Sound-dependent — the mechanical flap-click on each settle is half the effect; without it the cascade is lifeless.',
  },
  {
    id: 'type-rhythm-sync',
    role: 'text-card',
    name: 'Type Rhythm Sync',
    purpose: 'Bind the title hard to the audio track — beat-bound (drum hits) or speech-bound (narrator word-by-word). The title or slogan synced tight to the music bed.',
    energy: 'high',
    suggestedSeconds: 5,
    promptHints:
      'Title or slogan bound tight to the audio: variant A — each syllable or weight-pulse hits on a drum beat in a short decay window (dance feel); variant B — each word lights up following the narrator cadence (follow-along feel).',
    pitfall: 'Strong sound dependency — the pulse must really land on the beat; unsynced pulses over a silent track read as broken.',
  },

  ];
