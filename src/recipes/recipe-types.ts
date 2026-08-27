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
