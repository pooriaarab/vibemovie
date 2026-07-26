import { describe, expect, it } from 'vitest';
import type { VibeEvent } from '@pooriaarab/vibe-core';

import { buildScenes } from './scenes.js';
import { renderHyperframes } from './hyperframes.js';

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
      files: ['app/theme/toggle.tsx'],
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

const html = renderHyperframes(buildScenes(session));

describe('renderHyperframes', () => {
  it('emits a complete standalone document', () => {
    expect(html.startsWith('<!DOCTYPE html>')).toBe(true);
    expect(html).toContain('<title>vibemovie — demo</title>');
    expect(html).toContain('</html>');
  });

  it('contains every scene marker plus player chrome', () => {
    for (const id of ['scene-title', 'scene-tasks', 'scene-diff', 'scene-terminal', 'scene-merge', 'scene-end']) {
      expect(html).toContain(`id="${id}"`);
    }
    for (const chrome of ['id="scrubber"', 'id="playBtn"', 'id="captions"', 'id="sceneTitle"', 'id="termBody"', 'id="confetti"']) {
      expect(html).toContain(chrome);
    }
  });

  it('renders the session data into the scenes', () => {
    expect(html).toContain('PR #42 merged');
    expect(html).toContain('Refactor auth middleware');
    expect(html).toContain('+340');
    expect(html).toContain('−88');
    expect(html).toContain('12 files changed');
    expect(html).toContain('✓ 42 passed');
  });

  it('is fully self-contained — no external URLs, one inline script, no links/imports', () => {
    expect(/https?:\/\//.test(html)).toBe(false);
    expect(html.match(/<script/g)).toHaveLength(1);
    expect(html).not.toContain('<link');
    expect(html).not.toContain('@import');
    expect(html).not.toMatch(/<script[^>]*\ssrc=/);
  });

  it('is deterministic — same scenes, byte-identical HTML', () => {
    expect(renderHyperframes(buildScenes(session))).toBe(html);
  });

  it('escapes HTML in event data', () => {
    const evil: VibeEvent[] = [
      { kind: 'task-done', agent: 'kimi', cwd: '/repo/x', ts: T0, payload: { label: '<img src=x onerror=alert(1)>' } },
    ];
    const out = renderHyperframes(buildScenes(evil));
    expect(out).toContain('&lt;img src=x onerror=alert(1)&gt;');
    expect(out).not.toContain('<img src=x');
  });

  it('escapes `</script>` inside the embedded scene JSON', () => {
    const evil: VibeEvent[] = [
      { kind: 'error', agent: 'kimi', cwd: '/repo/x', ts: T0, payload: { message: '</script><script>alert(1)</script>' } },
    ];
    const out = renderHyperframes(buildScenes(evil));
    expect(out).not.toContain('</script><script>alert(1)');
    expect(out).toContain('\\u003c/script>');
  });

  it('honors the aspect ratio option', () => {
    expect(renderHyperframes(buildScenes(session), { ratio: '16:9' })).toContain('aspect-ratio:16/9');
    expect(renderHyperframes(buildScenes(session), { ratio: '9:16' })).toContain('* 9 / 16');
    expect(renderHyperframes(buildScenes(session), { ratio: '1:1' })).toContain('min(74vh,640px)');
  });

  it('embeds scene durations so the engine can lay out the timeline', () => {
    const scenes = buildScenes(session);
    for (const s of scenes) {
      expect(html).toContain(`"id":"${s.id}"`);
      expect(html).toContain(`"duration":${s.duration}`);
    }
  });
});
