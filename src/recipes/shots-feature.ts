import type { ShotRecipe } from './recipe-types.js';

export const featureRecipes: readonly ShotRecipe[] = [
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

  ];
