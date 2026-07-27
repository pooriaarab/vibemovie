import { describe, expect, it } from 'vitest';

import { ENERGY_LEVELS, SHOT_ROLES, shotRecipes } from './shots.js';
import type { Energy, Role, ShotRecipe } from './shots.js';
import { pickRecipes, recipesForArc } from './index.js';

const ROLE_SET = new Set<Role>(SHOT_ROLES);
const ENERGY_SET = new Set<Energy>(ENERGY_LEVELS);

describe('shotRecipes data integrity', () => {
  it('is a non-empty curated library', () => {
    expect(shotRecipes.length).toBeGreaterThanOrEqual(30);
    expect(shotRecipes.length).toBeLessThanOrEqual(60);
  });

  it('has unique ids', () => {
    const ids = shotRecipes.map((r) => r.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('every recipe has a valid role', () => {
    for (const r of shotRecipes) {
      expect(ROLE_SET.has(r.role)).toBe(true);
    }
  });

  it('every recipe has a valid energy', () => {
    for (const r of shotRecipes) {
      expect(ENERGY_SET.has(r.energy)).toBe(true);
    }
  });

  it('every recipe has non-empty core fields and a positive duration', () => {
    for (const r of shotRecipes) {
      const shot: ShotRecipe = r;
      expect(shot.id.trim().length).toBeGreaterThan(0);
      expect(shot.name.trim().length).toBeGreaterThan(0);
      expect(shot.purpose.trim().length).toBeGreaterThan(0);
      expect(shot.promptHints.trim().length).toBeGreaterThan(0);
      expect(shot.pitfall.trim().length).toBeGreaterThan(0);
      expect(shot.suggestedSeconds).toBeGreaterThan(0);
      expect(Number.isInteger(shot.suggestedSeconds)).toBe(true);
    }
  });

  it('prompt hints are prompt-oriented, not Remotion/React code', () => {
    // promptHints must be natural-language motion/camera phrases, not code.
    const codeSignals = [/\bconst\b/, /\breturn\b/, /\bfunction\b/, /=>/, /<\/?[A-Z]/, /\{.*\}/];
    for (const r of shotRecipes) {
      for (const re of codeSignals) {
        expect(re.test(r.promptHints), `${r.id} promptHints looks like code: ${r.promptHints}`).toBe(false);
      }
    }
  });

  it('covers every narrative role', () => {
    const present = new Set(shotRecipes.map((r) => r.role));
    for (const role of SHOT_ROLES) {
      expect(present.has(role), `missing recipes for role ${role}`).toBe(true);
    }
  });
});

describe('pickRecipes', () => {
  it('returns only recipes of the requested role', () => {
    const heroes = pickRecipes('hero', 3);
    expect(heroes.every((r) => r.role === 'hero')).toBe(true);
  });

  it('returns at most n, never more', () => {
    expect(pickRecipes('transition', 2).length).toBeLessThanOrEqual(2);
    expect(pickRecipes('transition', 100).length).toBe(
      shotRecipes.filter((r) => r.role === 'transition').length,
    );
  });

  it('returns exactly n when the role has that many', () => {
    expect(pickRecipes('feature', 4).length).toBe(4);
  });

  it('is deterministic (same call → same result)', () => {
    expect(pickRecipes('action', 3)).toEqual(pickRecipes('action', 3));
  });

  it('returns [] for non-positive n without throwing', () => {
    expect(pickRecipes('hero', 0)).toEqual([]);
    expect(pickRecipes('hero', -1)).toEqual([]);
  });

  it('returns the first-n in library order', () => {
    const firstHero = shotRecipes.find((r) => r.role === 'hero');
    expect(pickRecipes('hero', 1)[0]?.id).toBe(firstHero?.id);
  });
});

describe('recipesForArc', () => {
  it('returns one recipe per role in arc order', () => {
    const arc = ['hook', 'feature', 'close'] as const;
    const out = recipesForArc(arc);
    expect(out.map((r) => r.role)).toEqual(['hook', 'feature', 'close']);
    expect(out.length).toBe(3);
  });

  it('dedupes repeated roles', () => {
    const out = recipesForArc(['hook', 'hook', 'hook']);
    expect(out.length).toBe(1);
  });

  it('keeps the first occurrence order for a repeated role', () => {
    const out = recipesForArc(['close', 'hook', 'close']);
    expect(out.map((r) => r.role)).toEqual(['close', 'hook']);
  });

  it('is deterministic', () => {
    const arc = ['establish', 'reveal', 'transition', 'hero'] as const;
    expect(recipesForArc(arc)).toEqual(recipesForArc(arc));
  });

  it('returns [] for an empty arc', () => {
    expect(recipesForArc([])).toEqual([]);
  });

  it('yields a valid default film arc', () => {
    const arc = ['hook', 'establish', 'feature', 'text-card', 'close'] as const;
    const out = recipesForArc(arc);
    expect(out.length).toBe(arc.length);
    // total runtime lands in a plausible short-film range
    const total = out.reduce((sum, r) => sum + r.suggestedSeconds, 0);
    expect(total).toBeGreaterThan(0);
  });
});
