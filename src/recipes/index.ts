/**
 * recipes/index.ts — public surface of the shot-recipe library.
 *
 * Re-exports the data and two deterministic selectors:
 *
 * - `pickRecipes(role, n)` — up to `n` recipes of one role (array order).
 * - `recipesForArc(roles)` — one representative recipe per role in arc order
 *   (first match per role, deduped by id).
 *
 * Both are deterministic (no `Math.random`) to match the repo's "same input →
 * same output" rendering principle. A caller that wants variety should shuffle
 * upstream with a fixed seed, not inside the selectors.
 */

export { shotRecipes, SHOT_ROLES, ENERGY_LEVELS } from './shots.js';
export type { ShotRecipe, Role, Energy } from './shots.js';

import { shotRecipes } from './shots.js';
import type { Role, ShotRecipe } from './shots.js';

/**
 * Up to `n` recipes whose `role` matches, in library (array) order. Returns
 * fewer than `n` (possibly none) when the role is thinly populated — it never
 * throws. Deterministic.
 */
export function pickRecipes(role: Role, n: number): ShotRecipe[] {
  if (!Number.isInteger(n) || n <= 0) return [];
  const out: ShotRecipe[] = [];
  for (const r of shotRecipes) {
    if (out.length >= n) break;
    if (r.role === role) out.push(r);
  }
  return out;
}

/**
 * One representative recipe per role in `roles`, in the order the roles appear
 * (first match per role, deduped by id so a repeated role does not double-up).
 * Skips roles with no recipes rather than throwing. Deterministic.
 */
export function recipesForArc(roles: readonly Role[]): ShotRecipe[] {
  const out: ShotRecipe[] = [];
  const seen = new Set<string>();
  for (const role of roles) {
    const match = shotRecipes.find((r) => r.role === role);
    if (match !== undefined && !seen.has(match.id)) {
      seen.add(match.id);
      out.push(match);
    }
  }
  return out;
}
