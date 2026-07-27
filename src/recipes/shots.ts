/**
 * shots.ts — the shot-recipe library, distilled from video-shotcraft.
 *
 * Each recipe is a camera/shot move translated into a **prompt-based** stack
 * (wavespeed image/video models + ffmpeg), not Remotion/React animation code.
 * `promptHints` is a short motion/framing phrase a keyframe or image-to-video
 * prompt can splice in next to a shared LOCK/STYLE anchor (see `cinematic.ts`).
 *
 * Source: github.com/Vincentwei1021/video-shotcraft — ~104 shot recipe cards
 * organized in 10 functional categories (camera, data, effects, interaction,
 * opening, outro, rhythm, transition, typography, ui-entrance). The ~52 cards
 * below are the strongest, most distinct moves re-tagged by *narrative role*
 * so the cinematic engine can draw a shot list for any energy arc
 * (hook → establish → feature → … → close). Recipe `id`s keep the original
 * kebab-case card names for provenance.
 *
 * Recipe-card metadata (purpose, energy, suggested duration, the motion core,
 * and the single load-bearing pitfall) is summarized from the cards' Chinese
 * frontmatter + body; timings are rounded to whole seconds at 30fps.
 */

/** Where a recipe sits in a film's narrative arc. */
export type Role =
  | 'hook' // grab attention in the opening beats
  | 'establish' // set the scene / world before the action
  | 'reveal' // unveil a subject or piece of content
  | 'feature' // demonstrate a single feature in action
  | 'transition' // move between two scenes
  | 'hero' // make one subject the protagonist
  | 'text-card' // a typography / title / breathing beat
  | 'close' // outro / finale / sign-off
  | 'action' // a high-energy rhythm or stunt beat
  | 'emotion'; // a small move whose whole job is a feeling

/** Kinetic intensity — the energy-curve axis from video-shotcraft. */
export type Energy = 'low' | 'med' | 'high';

export const SHOT_ROLES: readonly Role[] = [
  'hook',
  'establish',
  'reveal',
  'feature',
  'transition',
  'hero',
  'text-card',
  'close',
  'action',
  'emotion',
];

export const ENERGY_LEVELS: readonly Energy[] = ['low', 'med', 'high'];

export interface ShotRecipe {
  /** kebab-case id; matches the originating video-shotcraft card name. */
  id: string;
  /** Narrative role in the arc. */
  role: Role;
  /** Human-readable name (original card name). */
  name: string;
  /** One sentence: what this move is *for*. */
  purpose: string;
  /** Low/med/high energy — where it sits on the arc curve. */
  energy: Energy;
  /** Representative whole-second duration at 30fps (action + holds). */
  suggestedSeconds: number;
  /** Short motion/framing phrase for a keyframe or image-to-video prompt. */
  promptHints: string;
  /** The single load-bearing pitfall to avoid. */
  pitfall: string;
}

/**
 * The curated library. Ordered roughly by arc role (hook → establish → reveal
 * → feature → transition → hero → text-card → close → action → emotion) so a
 * naive slice reads as a sane film.
 */
export const shotRecipes: readonly ShotRecipe[] = [
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

  // ── feature ───────────────────────────────────────────────────────────
  {
    id: 'deck-deal-flyin',
    role: 'feature',
    name: 'Deck Deal Fly-In',
    purpose: 'Show "there is a LOT here, pouring in" — cards deal themselves flying into their grid slots with urgency; build information density as the first impression.',
    energy: 'high',
    suggestedSeconds: 4,
    promptHints:
      'A stack teases (what is this pile?), then dozens of cards deal out and fly into the page, each slamming into its slot with urgency — the audience feels things pouring in.',
    pitfall:
      'Abstract "flood" multi-round non-convergence was rejected; find a physical metaphor (dealing) before writing motion — group motion needs a metaphor before code.',
  },
  {
    id: 'row-embed',
    role: 'feature',
    name: 'Row Embed',
    purpose: 'Detail-page rows do not "appear", they "grow in" — each row drops from above and slots precisely into the layout; the accent seam at embed is the click of it snapping shut.',
    energy: 'med',
    suggestedSeconds: 2,
    promptHints:
      'Structured rows drop from above one by one and slot precisely into the page layout; on each embed a thin accent-colored seam flashes at the join — the visual foley of it snapping shut.',
    pitfall: 'Fly-in targets MUST be real layout slots that embed on landing — floating above the grid without landing reads as fake.',
  },
  {
    id: 'document-typewriter-reveal',
    role: 'feature',
    name: 'Document Typewriter Reveal',
    purpose: 'The whole real-typeset document writes itself out behind a caret, sidebar entries drop into the rail — the densest info beat; the whole persuasion is "this document is real".',
    energy: 'med',
    suggestedSeconds: 4,
    promptHints:
      'A full page of real typeset document writes itself out left-to-right behind a single accent caret riding the reveal edge; sidebar history entries drop into the rail in sequence; camera holds on the page with both columns in frame.',
    pitfall:
      'Mock content must be publish-grade (native layout, full text, complete sidebar) — a slapdash screenshot-plus-slogan document forces a full reshoot; never put real customer or member names in mock data.',
  },
  {
    id: 'type-and-filter',
    role: 'feature',
    name: 'Type And Filter',
    purpose: 'Let the viewer "do it once" — see what is typed, how the page responds, where they clicked. The one lens that simulates real human operation, so it must move like a hand, not a script.',
    energy: 'med',
    suggestedSeconds: 3,
    promptHints:
      'Simulated real-speed human operation: type a few characters, the list filters and re-settles, the cursor clicks into a target card that lands in its real grid slot.',
    pitfall: 'First drafts are always too fast — type at about three frames per character; a filtered target card that floats above the grid instead of landing in a real slot reads as fake.',
  },
  {
    id: 'before-after-slider-scrub',
    role: 'feature',
    name: 'Before/After Slider Scrub',
    purpose: 'The standard AI-product comparison: same frame, before (flat) overlaid with after (crisp); the divider whips to 70 percent with overshoot, holds, then crawls back to prove where the change is. Fast-sweep then slow-scan is the rhythm.',
    energy: 'med',
    suggestedSeconds: 5,
    promptHints:
      'Two overlaid versions of the same frame (before: flat low-contrast; after: crisp) split by a vertical divider with a round handle; the handle whips hard from the left edge to about 70 percent with overshoot, holds one beat, then crawls back at a fifth of the speed so the difference is readable.',
    pitfall:
      'Both versions must share identical layout and camera — different layouts read as two pages and the comparison fails; use real screenshots for both.',
  },
  {
    id: 'integration-hub-map',
    role: 'feature',
    name: 'Integration Hub Map',
    purpose: '"One product connects everything" — the page flips over to become a hub, icons appear, then light tubes connect to them in two beats and breathe the flow.',
    energy: 'high',
    suggestedSeconds: 5,
    promptHints:
      'Old page flips a full 180 degrees to become a new hub page (one fast continuous flip with a brief edge flash at the 90-degree profile, no stop); icons appear all at once, then glowing light tubes connect out to them across two beats and pulse softly to keep flowing.',
    pitfall: 'The flip must be complete and continuous with no 90-degree-profile pause — a stop there was rejected; "constant speed" here means no pauses, not literal linear.',
  },
  {
    id: 'command-palette-summon',
    role: 'feature',
    name: 'Command Palette Summon',
    purpose: 'The signature ritual: a soft chime, the whole UI dims aside, the command palette drops from upper-center, candidates stagger in; type two letters and the list narrows live.',
    energy: 'med',
    suggestedSeconds: 5,
    promptHints:
      'A soft chime, the whole UI world dims to make way, a command palette drops from upper-center, candidate rows stagger in; two characters typed at human speed and the list narrows live — the squeeze comes from row-height collapse, not fade.',
    pitfall: 'Type at real human speed (at least 12 frames between the two keys); the narrowing squeeze must come from row-height collapse, not opacity fade.',
  },
  {
    id: 'list-stack-press',
    role: 'feature',
    name: 'List Stack Press',
    purpose: '"Stacking has weight" — each new card lands and presses the whole pile down before it springs back; the counter ticks in lockstep to nail the quantity.',
    energy: 'med',
    suggestedSeconds: 3,
    promptHints:
      'Feed or inbox cards stack one by one; each new card lands and presses the whole settled pile down, which springs back up; a counter ticks up in lockstep with each landing.',
    pitfall:
      'Stack and list info lenses must be shot head-on — even in a fully stylized film this lens was rolled back to front-view individually; validate camera per lens, do not apply globally.',
  },

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
