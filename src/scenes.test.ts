import { describe, expect, it } from 'vitest';
import type { VibeEvent } from '@pooriaarab/vibe-core';

import { buildScenes, formatMinutes } from './scenes.js';
import type { RawEvent, Scene, SceneKind } from './scenes.js';

const T0 = 1_769_500_000_000;
const MIN = 60_000;

const session: VibeEvent[] = [
  {
    kind: 'task-done',
    agent: 'claude-code',
    cwd: '/repo/demo',
    ts: T0,
    payload: { label: 'Refactor auth middleware', durationMin: 18 },
  },
  {
    kind: 'task-done',
    agent: 'claude-code',
    cwd: '/repo/demo',
    ts: T0 + 18 * MIN,
    payload: { label: 'Fix flaky CI test', additions: 12, deletions: 3, files: ['tests/ci/flaky.spec.ts'] },
  },
  {
    kind: 'tests-pass',
    agent: 'claude-code',
    cwd: '/repo/demo',
    ts: T0 + 60 * MIN,
    payload: { passed: 42 },
  },
  {
    kind: 'task-done',
    agent: 'claude-code',
    cwd: '/repo/demo',
    ts: T0 + 90 * MIN,
    payload: {
      label: 'Ship dark mode toggle',
      additions: 340,
      deletions: 88,
      filesChanged: 12,
      files: ['app/theme/toggle.tsx', 'app/theme/palette.ts'],
    },
  },
  {
    kind: 'pr-merged',
    agent: 'claude-code',
    cwd: '/repo/demo',
    ts: T0 + 134 * MIN,
    payload: { pr: 42, branch: 'main', reviewers: 2 },
  },
];

function kinds(scenes: readonly Scene[]): SceneKind[] {
  return scenes.map((s) => s.kind);
}

function byKind<K extends SceneKind>(scenes: readonly Scene[], kind: K): Extract<Scene, { kind: K }> {
  const found = scenes.find((s): s is Extract<Scene, { kind: K }> => s.kind === kind);
  if (found === undefined) throw new Error(`scene ${kind} not found`);
  return found;
}

describe('buildScenes', () => {
  it('compiles a full session into the montage scene order', () => {
    const scenes = buildScenes(session);
    expect(kinds(scenes)).toEqual(['title', 'tasks', 'diff', 'terminal', 'merge', 'end']);
  });

  it('title card: session name from cwd, duration from first→last ts', () => {
    const title = byKind(buildScenes(session), 'title');
    expect(title.data.sessionName).toBe('demo');
    expect(title.data.totalMinutes).toBe(134);
    expect(title.data.subtitle).toContain('claude-code');
    expect(title.id).toBe('scene-title');
  });

  it('tasks scene: rows from payloads, real total', () => {
    const tasks = byKind(buildScenes(session), 'tasks');
    expect(tasks.data.total).toBe(3);
    expect(tasks.data.tasks[0]?.label).toBe('Refactor auth middleware');
    expect(tasks.data.tasks[0]?.durationMin).toBe(18);
  });

  it('caps task rows at 5 while keeping the real total', () => {
    const many: VibeEvent[] = Array.from({ length: 7 }, (_, i) => ({
      kind: 'task-done' as const,
      agent: 'kimi',
      cwd: '/repo/x',
      ts: T0 + i * MIN,
      payload: { label: `Task ${i + 1}` },
    }));
    const tasks = byKind(buildScenes(many), 'tasks');
    expect(tasks.data.total).toBe(7);
    expect(tasks.data.tasks).toHaveLength(5);
  });

  it('diff scene: aggregates additions/deletions, prefers explicit filesChanged', () => {
    const diff = byKind(buildScenes(session), 'diff');
    expect(diff.data.additions).toBe(352);
    expect(diff.data.deletions).toBe(91);
    expect(diff.data.filesChanged).toBe(12);
    expect(diff.data.files).toContain('tests/ci/flaky.spec.ts');
    expect(diff.data.files.length).toBeLessThanOrEqual(4);
  });

  it('terminal scene: types test results and the push from the PR event', () => {
    const terminal = byKind(buildScenes(session), 'terminal');
    const texts = terminal.data.lines.map((l) => l.text);
    expect(texts).toContain('$ npm test');
    expect(texts).toContain('✓ 42 passed');
    expect(texts).toContain('$ git push');
    expect(texts).toContain('→ pushed to origin/main');
  });

  it('merge scene: PR number, branch, reviewers', () => {
    const merge = byKind(buildScenes(session), 'merge');
    expect(merge.data.pr).toBe(42);
    expect(merge.data.branch).toBe('main');
    expect(merge.data.reviewers).toBe(2);
    expect(merge.data.merged).toBe(true);
  });

  it('pr-opened without a merge still yields the celebration scene, marked opened', () => {
    const scenes = buildScenes([
      { kind: 'pr-opened', agent: 'codex', cwd: '/repo/y', ts: T0, payload: { number: 7 } },
    ]);
    const merge = byKind(scenes, 'merge');
    expect(merge.data.pr).toBe(7);
    expect(merge.data.merged).toBe(false);
  });

  it('empty input yields just title + end cards', () => {
    const scenes = buildScenes([]);
    expect(kinds(scenes)).toEqual(['title', 'end']);
    expect(byKind(scenes, 'title').data.totalMinutes).toBe(0);
    expect(byKind(scenes, 'title').data.sessionName).toBe('vibe session');
  });

  it('accepts loose RawEvents (type/timestamp aliases, ISO strings)', () => {
    const raw: RawEvent[] = [
      { type: 'task-done', timestamp: '2026-01-01T12:00:00Z', payload: { label: 'Did a thing' } },
      { type: 'task-done', timestamp: '2026-01-01T12:30:00Z', payload: { label: 'Did another' } },
    ];
    const scenes = buildScenes(raw);
    expect(kinds(scenes)).toContain('tasks');
    expect(byKind(scenes, 'title').data.totalMinutes).toBe(30);
  });

  it('sorts out-of-order events by timestamp', () => {
    const shuffled = [session[4], session[0], session[2], session[1], session[3]].filter(
      (e): e is VibeEvent => e !== undefined,
    );
    expect(buildScenes(shuffled)).toEqual(buildScenes(session));
  });

  it('speedrun paces tighter than documentary', () => {
    const total = (scenes: readonly Scene[]) => scenes.reduce((a, s) => a + s.duration, 0);
    expect(total(buildScenes(session, { template: 'speedrun' }))).toBeLessThan(
      total(buildScenes(session, { template: 'documentary' })),
    );
  });

  it('template changes captions', () => {
    expect(byKind(buildScenes(session, { template: 'meme' }), 'end').caption).toBe('same time tomorrow?');
    expect(byKind(buildScenes(session), 'merge').caption).toBe('Pull request #42 merged.');
  });

  it('is deterministic', () => {
    expect(JSON.stringify(buildScenes(session))).toBe(JSON.stringify(buildScenes(session)));
  });

  it('honors an explicit title override', () => {
    const title = byKind(buildScenes(session, { title: 'my launch' }), 'title');
    expect(title.data.sessionName).toBe('my launch');
  });
});

describe('formatMinutes', () => {
  it('formats hours and minutes', () => {
    expect(formatMinutes(134)).toBe('2h 14m');
    expect(formatMinutes(47)).toBe('47m');
    expect(formatMinutes(0)).toBe('0m');
  });
});
