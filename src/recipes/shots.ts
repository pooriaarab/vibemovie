import { hookRecipes } from './shots-hook.js';
import { establishRecipes } from './shots-establish.js';
import { revealRecipes } from './shots-reveal.js';
import { featureRecipes } from './shots-feature.js';
import { transitionRecipes } from './shots-transition.js';
import { heroRecipes } from './shots-hero.js';
import { textCardRecipes } from './shots-text-card.js';
import { closeRecipes } from './shots-close.js';
import { actionRecipes } from './shots-action.js';
import { emotionRecipes } from './shots-emotion.js';
import type { ShotRecipe } from './recipe-types.js';

export { SHOT_ROLES, ENERGY_LEVELS } from './recipe-types.js';
export type { ShotRecipe, Role, Energy } from './recipe-types.js';

export const shotRecipes: readonly ShotRecipe[] = [
  ...hookRecipes,
  ...establishRecipes,
  ...revealRecipes,
  ...featureRecipes,
  ...transitionRecipes,
  ...heroRecipes,
  ...textCardRecipes,
  ...closeRecipes,
  ...actionRecipes,
  ...emotionRecipes,
];
