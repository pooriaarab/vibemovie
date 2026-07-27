import { mkdtempSync, readFileSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import { afterEach, describe, expect, it, vi } from 'vitest';
import type { VibeEvent } from '@pooriaarab/vibe-core';

import { buildScenes } from './scenes.js';
import {
  cinematicAvailable,
  deriveBeats,
  deriveReferencePrompts,
  renderCinematic,
} from './cinematic.js';
import { renderMovie } from './index.js';

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

afterEach(() => {
  vi.unstubAllEnvs();
});

describe('deriveBeats', () => {
  const beats = deriveBeats(buildScenes(session));

  it('compiles a full session into one beat per scene, in montage order', () => {
    expect(beats.map((b) => b.kind)).toEqual(['title', 'tasks', 'diff', 'terminal', 'merge', 'end']);
  });

  it('empty input still yields title + end beats', () => {
    const empty = deriveBeats(buildScenes([]));
    expect(empty.map((b) => b.kind)).toEqual(['title', 'end']);
  });

  it('every keyframe carries the LOCK string, the STYLE anchor, and on-task eyeline', () => {
    for (const b of beats) {
      expect(b.keyframe).toContain('Identical woman and identical office');
      expect(b.keyframe).toContain('cinematic 1980s film still');
      expect(b.keyframe).toContain('not at the camera');
      expect(b.motion).toContain('cinematic 1980s film still');
    }
  });

  it('varies the camera across keyframes (no two shots the same)', () => {
    const shots = new Set(beats.map((b) => b.keyframe));
    expect(shots.size).toBe(beats.length);
    expect(beats[0]?.keyframe).toContain('Wide establishing');
    expect(beats[1]?.keyframe).toContain('Close-up side profile');
    expect(beats[2]?.keyframe).toContain('Over-the-shoulder');
    expect(beats[3]?.keyframe).toContain('Three-quarter');
    expect(beats[4]?.keyframe).toContain('Low-angle');
    expect(beats[5]?.keyframe).toContain('dutch-angle');
  });

  it('VO lines narrate the real session numbers', () => {
    const byKind = new Map(beats.map((b) => [b.kind, b]));
    expect(byKind.get('title')?.vo).toContain('demo');
    expect(byKind.get('title')?.vo).toContain('2h 14m');
    expect(byKind.get('tasks')?.vo).toContain('3 tasks');
    expect(byKind.get('tasks')?.vo).toContain('Refactor auth middleware');
    expect(byKind.get('diff')?.vo).toContain('12 files');
    expect(byKind.get('diff')?.vo).toContain('plus 352');
    expect(byKind.get('diff')?.vo).toContain('minus 91');
    expect(byKind.get('terminal')?.vo).toContain('GREEN');
    expect(byKind.get('merge')?.vo).toContain('pull request number 42');
    expect(byKind.get('merge')?.vo).toContain('main');
    expect(byKind.get('end')?.vo).toContain("That's the session. Run it back.");
  });

  it('VO lines carry eleven-v3 emotion tags', () => {
    for (const b of beats) {
      expect(b.vo).toMatch(/^\[(energetically|excited|shouting|warmly)\]/);
    }
  });

  it('terminal VO stays generic when no tests passed', () => {
    const noTests = deriveBeats(buildScenes([session[0] as VibeEvent]));
    expect(noTests.map((b) => b.kind)).toEqual(['title', 'tasks', 'terminal', 'end']);
    const terminal = noTests.find((b) => b.kind === 'terminal');
    expect(terminal?.vo).toContain('The commands tell the story');
  });

  it('template tone flows into the end VO', () => {
    const meme = deriveBeats(buildScenes(session, { template: 'meme' }));
    expect(meme[meme.length - 1]?.vo).toContain('same time tomorrow?');
  });

  it('is deterministic', () => {
    expect(JSON.stringify(deriveBeats(buildScenes(session)))).toBe(JSON.stringify(beats));
  });
});

describe('deriveReferencePrompts', () => {
  it('hero is a wide reference; face is a crisp headshot; both share the STYLE anchor', () => {
    const { hero, face } = deriveReferencePrompts();
    expect(hero).toContain('Wide reference');
    expect(face).toContain('headshot portrait');
    for (const p of [hero, face]) {
      expect(p).toContain('cinematic 1980s film still');
      expect(p).toContain('software developer');
    }
  });
});

describe('cinematicAvailable', () => {
  it('is true only for a non-blank key', () => {
    expect(cinematicAvailable({ WAVESPEED_API_KEY: 'sk-test' })).toBe(true);
    expect(cinematicAvailable({})).toBe(false);
    expect(cinematicAvailable({ WAVESPEED_API_KEY: '   ' })).toBe(false);
  });
});

describe('renderMovie engine selection', () => {
  it('defaults to the hyperframes engine', async () => {
    const result = await renderMovie(session);
    expect(result.engine).toBe('hyperframes');
    expect(result.html).toContain('<!DOCTYPE html>');
  });

  it('cinematic without WAVESPEED_API_KEY falls back to hyperframes with a clear message', async () => {
    vi.stubEnv('WAVESPEED_API_KEY', '');
    const messages: string[] = [];
    const result = await renderMovie(session, { engine: 'cinematic', log: (m) => messages.push(m) });
    expect(result.engine).toBe('hyperframes');
    expect(result.html).toContain('<!DOCTYPE html>');
    expect(messages.join('\n')).toContain('WAVESPEED_API_KEY');
    expect(messages.join('\n')).toContain('falling back to hyperframes');
  });

  it('fallback rewrites a video-looking out path to .html so the artifact matches its contents', async () => {
    vi.stubEnv('WAVESPEED_API_KEY', '');
    const dir = mkdtempSync(join(tmpdir(), 'vibemovie-fallback-'));
    const result = await renderMovie(session, {
      engine: 'cinematic',
      out: join(dir, 'recap.mp4'),
      log: () => {},
    });
    expect(result.engine).toBe('hyperframes');
    expect(result.path).toBe(join(dir, 'recap.html'));
    expect(readFileSync(result.path as string, 'utf8')).toContain('<!DOCTYPE html>');
  });
});

describe('renderMovie notifications', () => {
  it('emits render-done exactly once on a successful render', async () => {
    const events: VibeEvent[] = [];
    const dir = mkdtempSync(join(tmpdir(), 'vibemovie-notify-'));
    const out = join(dir, 'recap.html');
    const result = await renderMovie(session, { out, notify: (e) => events.push(e) });
    expect(result.path).toBe(out);

    expect(events).toHaveLength(1);
    const e = events[0];
    expect(e?.kind).toBe('render-done');
    expect(e?.payload?.['outputPath']).toBe(out);
    expect(String(e?.payload?.['summary'])).toContain('hyperframes');
  });

  it('emits on success even without an out path', async () => {
    const events: VibeEvent[] = [];
    const result = await renderMovie(session, { notify: (e) => events.push(e) });
    expect(result.engine).toBe('hyperframes');
    expect(events).toHaveLength(1);
    expect(events[0]?.payload?.['outputPath']).toBeNull();
  });

  it('does not emit when the render fails', async () => {
    const events: VibeEvent[] = [];
    await expect(
      renderMovie(session, {
        out: join(tmpdir(), 'vibemovie-no-such-dir-xyz', 'recap.html'),
        notify: (e) => events.push(e),
      }),
    ).rejects.toThrow();
    expect(events).toHaveLength(0);
  });

  it('a throwing sink never breaks a successful render', async () => {
    const result = await renderMovie(session, {
      notify: () => {
        throw new Error('notify channel exploded');
      },
    });
    expect(result.engine).toBe('hyperframes');
    expect(result.html).toContain('<!DOCTYPE html>');
  });
});

describe('renderCinematic', () => {
  it('refuses to run without a key — no egress without BYO key', async () => {
    vi.stubEnv('WAVESPEED_API_KEY', '');
    await expect(renderCinematic(buildScenes(session), { out: 'x.mp4' })).rejects.toThrow(/WAVESPEED_API_KEY/);
  });

  it('runs the validated pipeline: models, params, chain order, per-beat VO', async () => {
    const posts: { url: string; body: Record<string, unknown> }[] = [];
    let uploads = 0;
    let counter = 0;

    // Mocked wavespeed API: submit → job-N, poll → completed with a deterministic URL.
    const fetchFn = (async (input: unknown, init?: { method?: string; body?: unknown }) => {
      const url = String(input);
      const method = init?.method ?? 'GET';
      if (method === 'POST' && url.includes('/media/upload/binary')) {
        uploads += 1;
        return { json: async () => ({ data: { download_url: 'https://cdn.example/uploaded/base_raw.mp4' } }) };
      }
      if (method === 'POST') {
        posts.push({ url, body: JSON.parse(String(init?.body)) as Record<string, unknown> });
        const id = `job-${counter++}`;
        return { json: async () => ({ data: { id } }) };
      }
      if (url.includes('/predictions/')) {
        const id = url.split('/predictions/')[1]?.split('/result')[0] ?? 'job-x';
        return { json: async () => ({ data: { status: 'completed', outputs: [`https://cdn.example/media/${id}.mp4`] } }) };
      }
      return { arrayBuffer: async () => new Uint8Array([1, 2, 3]).buffer };
    }) as unknown as typeof fetch;

    const execCalls: { file: string; args: string[] }[] = [];
    const execFn = (file: string, args: readonly string[]): void => {
      execCalls.push({ file, args: [...args] });
      // fake ffmpeg: every pipeline invocation writes its output to the last arg
      const outPath = args[args.length - 1];
      if (typeof outPath === 'string') writeFileSync(outPath, '');
    };
    const sleepFn = (): Promise<void> => Promise.resolve();

    const out = join(mkdtempSync(join(tmpdir(), 'vibemovie-cinematic-test-')), 'recap.mp4');
    const scenes = buildScenes(session);
    const result = await renderCinematic(scenes, {
      out,
      apiKey: 'sk-test',
      log: () => {},
      deps: { fetchFn, execFn, sleepFn },
    });

    expect(result.path).toBe(out);
    expect(result.beats).toHaveLength(6);

    // The full submit sequence, in pipeline order.
    const seq = posts.map((p) => p.url.split('/api/v3/')[1]);
    expect(seq).toEqual([
      'bytedance/seedream-v4',
      'bytedance/seedream-v4',
      ...Array(6).fill('wavespeed-ai/flux-kontext-max'),
      ...Array(5).fill('kwaivgi/kling-v2.5-turbo-pro/image-to-video'),
      'wavespeed-ai/video-face-swap',
      ...Array(6).fill('elevenlabs/eleven-v3'),
    ] as string[]);

    // seedream hero + face at 1080p.
    for (const p of posts.slice(0, 2)) {
      expect(p.body['size']).toBe('1920*1080');
    }

    // flux keyframes are image-conditioned on the hero (job-0) with the LOCK string.
    const edits = posts.slice(2, 8);
    for (const p of edits) {
      expect(p.body['image']).toBe('https://cdn.example/media/job-0.mp4');
      expect(p.body['prompt']).toContain('Identical woman and identical office');
    }

    // Kling clips chain keyframe N → N+1 (image + last_image), 5s, strong negative prompt.
    const clips = posts.slice(8, 13);
    expect(clips).toHaveLength(5);
    clips.forEach((p, i) => {
      expect(p.body['image']).toBe(`https://cdn.example/media/job-${2 + i}.mp4`);
      expect(p.body['last_image']).toBe(`https://cdn.example/media/job-${3 + i}.mp4`);
      expect(p.body['duration']).toBe(5);
      expect(p.body['negative_prompt']).toContain('ghosting');
    });

    // Face-swap locks identity with the headshot (job-1) over the uploaded base cut.
    expect(uploads).toBe(1);
    const swap = posts[13];
    expect(swap?.body['face_image']).toBe('https://cdn.example/media/job-1.mp4');
    expect(swap?.body['video']).toBe('https://cdn.example/uploaded/base_raw.mp4');
    expect(swap?.body['target_gender']).toBe('female');

    // One eleven-v3 line per beat, reference voice/params.
    const lines = posts.slice(14, 20);
    expect(lines).toHaveLength(6);
    lines.forEach((p, i) => {
      expect(p.body['voice_id']).toBe('George');
      expect(p.body['stability']).toBe(0.3);
      expect(p.body['similarity']).toBe(0.75);
      expect(p.body['use_speaker_boost']).toBe(true);
      expect(p.body['text']).toBe(result.beats[i]?.vo);
    });

    // ffmpeg: normalize, zoompan end card, concat, grade, per-line cleanup, mux.
    const ffmpegArgs = execCalls.filter((c) => c.file === 'ffmpeg').map((c) => c.args.join(' '));
    expect(ffmpegArgs.some((a) => a.includes('crop=1280:720'))).toBe(true);
    expect(ffmpegArgs.some((a) => a.includes('zoompan'))).toBe(true);
    expect(ffmpegArgs.some((a) => a.includes('concat'))).toBe(true);
    expect(ffmpegArgs.some((a) => a.includes('colorbalance'))).toBe(true);
    expect(ffmpegArgs.some((a) => a.includes('acompressor'))).toBe(true);

    // Mux: each VO line delayed to its 5s beat, mixed over a room-tone bed.
    const mux = ffmpegArgs[ffmpegArgs.length - 1] ?? '';
    expect(mux).toContain('adelay=0|0');
    expect(mux).toContain('adelay=5000|5000');
    expect(mux).toContain('adelay=25000|25000');
    expect(mux).toContain('anoisesrc=color=pink');
    expect(mux).toContain('amix=inputs=7:duration=longest');
    expect(execCalls[execCalls.length - 1]?.args.at(-1)).toBe(out);
  });
});
