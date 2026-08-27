import { copyFileSync, existsSync, mkdirSync, mkdtempSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { execFileSync } from 'node:child_process';

import { deriveBeats, deriveReferencePrompts } from './cinematic-beats.js';
import type { Beat } from './cinematic-beats.js';
import type { Scene } from './scenes.js';
import {
  CLIP_SECONDS,
  MODEL_FACE_SWAP,
  apiDownload,
  apiHeaders,
  apiPoll,
  apiPost,
  apiUpload,
  editImage,
  klingClip,
  sleep,
  t2i,
  ttsLine,
} from './cinematic-api.js';

type ExecFn = (file: string, args: readonly string[]) => void;

const defaultExec: ExecFn = (file, args) => {
  execFileSync(file, [...args], { stdio: 'ignore' });
};

export interface CinematicDeps {
  fetchFn?: typeof fetch;
  execFn?: ExecFn;
  sleepFn?: (ms: number) => Promise<void>;
}

export interface CinematicOptions {
  out: string;
  apiKey?: string;
  workDir?: string;
  voiceId?: string;
  log?: (msg: string) => void;
  deps?: CinematicDeps;
}

export interface CinematicResult {
  path: string;
  beats: Beat[];
}

interface Ctx {
  fetchFn: typeof fetch;
  headers: Record<string, string>;
  sleepFn: (ms: number) => Promise<void>;
  log: (msg: string) => void;
  workDir: string;
  execFn: ExecFn;
}

async function fetchHeroAndFace(ctx: Ctx): Promise<{ heroUrl: string; faceUrl: string }> {
  ctx.log('cinematic: hero + face ref...');
  const { hero: heroPrompt, face: facePrompt } = deriveReferencePrompts();
  const [heroUrl, faceUrl] = await Promise.all([t2i(ctx.fetchFn, ctx.headers, ctx.sleepFn, heroPrompt), t2i(ctx.fetchFn, ctx.headers, ctx.sleepFn, facePrompt)]);
  return { heroUrl, faceUrl };
}

async function fetchKeyframes(ctx: Ctx, beats: Beat[], heroUrl: string): Promise<string[]> {
  ctx.log(`cinematic: ${beats.length} keyframes (parallel)...`);
  const kfUrls = await Promise.all(beats.map((b) => editImage({ fetchFn: ctx.fetchFn, headers: ctx.headers, sleepFn: ctx.sleepFn, prompt: b.keyframe, image: heroUrl })));
  const lastKfPath = join(ctx.workDir, 'end.jpg');
  await apiDownload(ctx.fetchFn, kfUrls[kfUrls.length - 1] as string, lastKfPath);
  return kfUrls;
}

async function fetchClips(ctx: Ctx, beats: Beat[], kfUrls: string[]): Promise<string[]> {
  const clipCount = beats.length - 1;
  ctx.log(`cinematic: ${clipCount} Kling clips (parallel, first+last frame chained)...`);
  const clipPaths = await Promise.all(
    beats.slice(0, -1).map(async (b, i) => {
      const path = join(ctx.workDir, `c${i}.mp4`);
      try {
        await apiDownload(ctx.fetchFn, await klingClip({ fetchFn: ctx.fetchFn, headers: ctx.headers, sleepFn: ctx.sleepFn, first: kfUrls[i] as string, last: kfUrls[i + 1] as string, motion: b.motion }), path);
        ctx.log(`cinematic:  clip ${i}`);
        return path;
      } catch (err) {
        ctx.log(`cinematic:  clip ${i} failed (${err instanceof Error ? err.message : String(err)}) — skipping`);
        return null;
      }
    }),
  );
  const clips = clipPaths.filter((p): p is string => p !== null && existsSync(p));
  if (clips.length === 0) throw new Error('cinematic: all Kling clips failed');
  return clips;
}

function normalizeClips(ctx: Ctx, clips: string[]): { segs: string[]; baseRaw: string } {
  const segs: string[] = [];
  for (let i = 0; i < clips.length; i++) {
    const seg = join(ctx.workDir, `s${i}.mp4`);
    ctx.execFn('ffmpeg', [
      '-y', '-i', clips[i] as string, '-an',
      '-vf', 'scale=1280:720:force_original_aspect_ratio=increase,crop=1280:720,setsar=1,fps=24',
      '-c:v', 'libx264', '-pix_fmt', 'yuv420p', seg,
    ]);
    segs.push(seg);
  }
  const lastKfPath = join(ctx.workDir, 'end.jpg');
  const endCard = join(ctx.workDir, 'end.mp4');
  ctx.execFn('ffmpeg', [
    '-y', '-i', lastKfPath,
    '-vf', `zoompan=z='min(zoom+0.0008,1.06)':d=${CLIP_SECONDS * 24}:x='iw/2-(iw/zoom/2)':y='ih/2-(ih/zoom/2)':s=1280x720:fps=24,setsar=1`,
    '-an', '-c:v', 'libx264', '-pix_fmt', 'yuv420p', endCard,
  ]);
  segs.push(endCard);
  const listPath = join(ctx.workDir, 'list.txt');
  writeFileSync(listPath, segs.map((s) => `file '${s.replace(/'/g, `'\\''`)}'`).join('\n'));
  const baseRaw = join(ctx.workDir, 'base_raw.mp4');
  ctx.execFn('ffmpeg', ['-y', '-f', 'concat', '-safe', '0', '-i', listPath, '-an', baseRaw]);
  return { segs, baseRaw };
}

async function faceSwapAndGrade(ctx: Ctx, baseRaw: string, faceUrl: string): Promise<string> {
  const base = join(ctx.workDir, 'base.mp4');
  try {
    ctx.log('cinematic: face-swap identity lock...');
    const swapped = await apiPoll({
      fetchFn: ctx.fetchFn,
      headers: ctx.headers,
      sleepFn: ctx.sleepFn,
      id: await apiPost(ctx.fetchFn, ctx.headers, MODEL_FACE_SWAP, { video: await apiUpload(ctx.fetchFn, ctx.headers, baseRaw), face_image: faceUrl, target_gender: 'female' }),
      maxTicks: 140,
    });
    await apiDownload(ctx.fetchFn, swapped, base);
  } catch (err) {
    ctx.log(`cinematic: face-swap failed (${err instanceof Error ? err.message : String(err)}) — using the raw cut`);
    copyFileSync(baseRaw, base);
  }
  const graded = join(ctx.workDir, 'base_g.mp4');
  ctx.execFn('ffmpeg', [
    '-y', '-i', base,
    '-vf', 'eq=contrast=1.06:saturation=1.08:brightness=0.01,colorbalance=rs=0.05:gs=0.01:bs=-0.04:rm=0.03:bm=-0.02,setsar=1',
    '-an', '-c:v', 'libx264', '-pix_fmt', 'yuv420p', graded,
  ]);
  return graded;
}

async function synthesizeVo(ctx: Ctx, beats: Beat[], voiceId: string): Promise<string[]> {
  ctx.log(`cinematic: ${beats.length} VO lines (parallel)...`);
  const voPaths = await Promise.all(
    beats.map(async (b, i) => {
      const raw = join(ctx.workDir, `raw${i}.mp3`);
      await apiDownload(ctx.fetchFn, await ttsLine({ fetchFn: ctx.fetchFn, headers: ctx.headers, sleepFn: ctx.sleepFn, voiceId, text: b.vo }), raw);
      const processed = join(ctx.workDir, `r${i}.mp3`);
      ctx.execFn('ffmpeg', [
        '-y', '-i', raw,
        '-af', 'highpass=f=80,acompressor=threshold=-18dB:ratio=2.5,volume=2dB',
        processed,
      ]);
      ctx.log(`cinematic:  line ${i} (${voiceId})`);
      return processed;
    }),
  );
  return voPaths;
}

function muxFinal(opts: { execFn: ExecFn; graded: string; voPaths: string[]; beats: Beat[]; out: string }): void {
  const dur = opts.beats.length * CLIP_SECONDS;
  const inputs = ['-i', opts.graded];
  for (const p of opts.voPaths) inputs.push('-i', p);
  inputs.push('-f', 'lavfi', '-i', `anoisesrc=color=pink:d=${dur}:a=0.025`);
  const hissIdx = 1 + opts.voPaths.length;
  let fc = '';
  opts.voPaths.forEach((_, i) => {
    const d = i * CLIP_SECONDS * 1000;
    fc += `[${i + 1}:a]adelay=${d}|${d}[v${i}];`;
  });
  fc += `[${hissIdx}:a]highpass=f=300,lowpass=f=3000,volume=0.5[hiss];`;
  fc +=
    opts.voPaths.map((_, i) => `[v${i}]`).join('') +
    `[hiss]amix=inputs=${opts.voPaths.length + 1}:duration=longest:dropout_transition=0,volume=1.3[a]`;
  opts.execFn('ffmpeg', [
    '-y', ...inputs,
    '-filter_complex', fc,
    '-map', '0:v', '-map', '[a]',
    '-c:v', 'copy', '-c:a', 'aac', '-shortest', opts.out,
  ]);
}

function resolveApiKey(opts: CinematicOptions): string {
  const apiKey = opts.apiKey ?? process.env['WAVESPEED_API_KEY'];
  if (typeof apiKey !== 'string' || apiKey.trim().length === 0) {
    throw new Error('cinematic: WAVESPEED_API_KEY is required (set it in the environment or pass opts.apiKey)');
  }
  return apiKey;
}

function prepareCtx(apiKey: string, opts: CinematicOptions): { ctx: Ctx; voiceId: string } {
  const fetchFn = opts.deps?.fetchFn ?? fetch;
  const execFn = opts.deps?.execFn ?? defaultExec;
  const sleepFn = opts.deps?.sleepFn ?? sleep;
  const log = opts.log ?? ((msg: string) => process.stderr.write(`${msg}\n`));
  const voiceId = opts.voiceId ?? 'George';
  const workDir = opts.workDir ?? mkdtempSync(join(tmpdir(), 'vibemovie-cinematic-'));
  mkdirSync(workDir, { recursive: true });
  const headers = apiHeaders(apiKey);
  return { ctx: { fetchFn, headers, sleepFn, log, workDir, execFn }, voiceId };
}

function assertBeats(beats: { length: number }): void {
  if (beats.length < 2) throw new Error('cinematic: need at least 2 scenes to build a film');
}

export async function renderCinematic(
  scenes: readonly Scene[],
  opts: CinematicOptions,
): Promise<CinematicResult> {
  const apiKey = resolveApiKey(opts);
  const { ctx, voiceId } = prepareCtx(apiKey, opts);
  const beats = deriveBeats(scenes);
  assertBeats(beats);
  const { heroUrl, faceUrl } = await fetchHeroAndFace(ctx);
  const kfUrls = await fetchKeyframes(ctx, beats, heroUrl);
  const clips = await fetchClips(ctx, beats, kfUrls);
  const { segs, baseRaw } = normalizeClips(ctx, clips);
  const graded = await faceSwapAndGrade(ctx, baseRaw, faceUrl);
  const voPaths = await synthesizeVo(ctx, beats, voiceId);
  ctx.log(`cinematic: base cut assembled (${segs.length} segments)`);
  muxFinal({ execFn: ctx.execFn, graded, voPaths, beats, out: opts.out });
  ctx.log(`cinematic: DONE -> ${opts.out}`);
  return { path: opts.out, beats };
}
