/**
 * cinematic.ts — the BYO-key gen-video engine: session scenes → a real mp4.
 *
 * Opt-in tier above Hyperframes. Given the scene list from `buildScenes`, it
 * renders a short cinematic character video of the session via wavespeed.ai
 * and muxes an ElevenLabs voiceover with ffmpeg:
 *
 *   1. derive one beat per scene (~6): keyframe prompt + motion prompt + VO line
 *   2. `bytedance/seedream-v4` — wide hero + crisp face headshot (parallel)
 *   3. `wavespeed-ai/flux-kontext-max` — one keyframe per beat, image-conditioned
 *      on the hero with a LOCK string for character/set consistency (parallel)
 *   4. `kwaivgi/kling-v2.5-turbo-pro/image-to-video` — chained 5s clips:
 *      `image` = keyframe N, `last_image` = keyframe N+1, so cuts are seamless
 *   5. `wavespeed-ai/video-face-swap` — swap the headshot face onto the silent
 *      cut in one pass (identity lock), then one unified ffmpeg color grade
 *   6. `elevenlabs/eleven-v3` — one VO line per beat, each delayed to its beat
 *      (`adelay=i*5000`), mixed over a near-silent pink-noise room-tone bed
 *
 * The pipeline (model IDs, params, poll loop, ffmpeg filters) follows the
 * validated recipe in `launch-video-generation` ("Validated pipeline: cinematic
 * character video") and the reference scripts it was distilled from.
 *
 * Requirements: `WAVESPEED_API_KEY` in the environment (ElevenLabs is reached
 * through wavespeed, so one key covers both), `ffmpeg` on PATH, node >= 18
 * (global fetch). Nothing is sent out without a key — callers should check
 * `cinematicAvailable()` and fall back to Hyperframes when it returns false.
 */

import { execFileSync } from 'node:child_process';
import { copyFileSync, existsSync, mkdirSync, mkdtempSync, readFileSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { basename, join } from 'node:path';

import { formatMinutes } from './scenes.js';
import type { Scene, SceneKind } from './scenes.js';

export type Engine = 'hyperframes' | 'cinematic';
export const ENGINES: readonly Engine[] = ['hyperframes', 'cinematic'];

/** ------------------------------------------------------------------ */
/** Beat derivation (pure — no IO, no clock, no randomness)             */
/** ------------------------------------------------------------------ */

/**
 * One narrated shot of the film. `keyframe` and `motion` are complete prompts
 * (LOCK/STYLE baked in) for the image-edit and image-to-video models; `vo` is
 * the eleven-v3 line for the beat (may carry `[emotion]` tags).
 */
export interface Beat {
  kind: SceneKind;
  /** flux-kontext-max edit prompt: LOCK + shot description + STYLE. */
  keyframe: string;
  /** Kling motion prompt: action + STYLE. Unused on the last beat (end card). */
  motion: string;
  /** eleven-v3 narration line, played at this beat's 5s mark. */
  vo: string;
}

/** Shared visual theme — every prompt restates it so the clips read as one film. */
const STYLE =
  'cinematic 1980s film still, warm tungsten light with subtle magenta and cyan neon accents, ' +
  '35mm film grain, shallow depth of field, night';

const SET =
  'the SAME single cozy 1980s home office at night: a wooden desk front and center with a ' +
  'glowing laptop and mechanical keyboard, a steaming mug, sticky notes on the wall behind it, ' +
  'a warm desk lamp on the left, and a bookshelf with a glowing retro radio on the right';

const DEV =
  'a young woman software developer in her early twenties, big voluminous curly blonde 80s hair, ' +
  'natural makeup with soft neutral eyeshadow and red lipstick, wearing a VIBRANT colorful 80s ' +
  'outfit: a bold color-blocked cropped jacket in hot pink and electric blue over a bright teal ' +
  'tee, vibrant and colorful';

/**
 * Consistency anchor for the keyframe edits: identical woman, identical office —
 * only pose and camera change between beats.
 */
const LOCK =
  'Identical woman and identical office as the reference (same face, big curly blonde hair, ' +
  'natural red-lip makeup, vibrant hot-pink-and-blue cropped jacket, teal tee, same ' +
  'desk/laptop/lamp/sticky-notes/bookshelf). Only change pose and camera.';

/** Eyeline on the task, never the lens — staring into camera reads as an AI tell. */
const EYE = 'looking at what she is doing, not at the camera';

function plural(n: number, word: string): string {
  return `${n} ${word}${n === 1 ? '' : 's'}`;
}

/**
 * The two seedream-v4 reference prompts: a wide hero that fixes look/wardrobe/set,
 * and a crisp front-facing headshot used only as the face-swap anchor later.
 */
export function deriveReferencePrompts(): { hero: string; face: string } {
  return {
    hero: `${STYLE}. Wide reference of ${DEV}, settling in to work at ${SET}.`,
    face:
      `${STYLE}. Clean sharp front-facing headshot portrait of ${DEV}, looking straight at ` +
      'camera, evenly lit, crisp focus on her face.',
  };
}

function beatFor(scene: Scene): Beat {
  switch (scene.kind) {
    case 'title': {
      const d = scene.data;
      const dur = d.totalMinutes > 0 ? `${formatMinutes(d.totalMinutes)} in the flow` : 'a session worth replaying';
      return {
        kind: scene.kind,
        keyframe:
          `${LOCK} Wide establishing shot from across the room: she drops into her desk chair ` +
          `and flips open the glowing laptop, screen light spilling onto her face, ${EYE}. ${STYLE}`,
        motion:
          `she sits down at the desk and opens the laptop, the screen wakes and lights her ` +
          `face, smooth settle-in. ${STYLE}`,
        vo: `[energetically] ${d.sessionName} — ${dur}. Let's run it back.`,
      };
    }
    case 'tasks': {
      const d = scene.data;
      const first = d.tasks[0]?.label ?? 'the first task';
      return {
        kind: scene.kind,
        keyframe:
          `${LOCK} Close-up side profile: she types fast on the mechanical keyboard, then ` +
          `reaches up and ticks a sticky note on the wall, mid-action, ${EYE}. ${STYLE}`,
        motion:
          `she types quickly, then reaches over and checks off a sticky note, natural ` +
          `working rhythm. ${STYLE}`,
        vo:
          d.total === 1
            ? `[excited] One task landed, clean — ${first}.`
            : `[excited] ${plural(d.total, 'task')} landed, clean — kicked off by ${first}.`,
      };
    }
    case 'diff': {
      const d = scene.data;
      return {
        kind: scene.kind,
        keyframe:
          `${LOCK} Over-the-shoulder shot from behind her: she leans into the glowing laptop ` +
          `covered in code, one hand mid-scroll, screen glow catching her hair, ${EYE}. ${STYLE}`,
        motion: `she scrolls through the diff and leans in closer to the code, subtle continuous motion. ${STYLE}`,
        vo: `[excited] ${plural(d.filesChanged, 'file')} touched — plus ${d.additions}, minus ${d.deletions}.`,
      };
    }
    case 'terminal': {
      const d = scene.data;
      const hasTests = d.lines.some((l) => l.cls === 'ok' && l.text.includes('passed'));
      return {
        kind: scene.kind,
        keyframe:
          `${LOCK} Three-quarter shot from the lamp side: she throws a triumphant fist pump at ` +
          `the glowing screen, mid-cheer, ${EYE}. ${STYLE}`,
        motion: `she reads the screen, then pumps her fist in celebration, energetic. ${STYLE}`,
        vo: hasTests
          ? '[shouting] GREEN! Green across the board — every test, passing!'
          : '[excited] The commands tell the story — clean, top to bottom.',
      };
    }
    case 'merge': {
      const d = scene.data;
      const vo =
        d.pr !== null
          ? d.merged
            ? `[excited] And there it is — pull request number ${d.pr}, merged into ${d.branch}! No conflicts, no mercy!`
            : `[excited] Pull request number ${d.pr} is open on ${d.branch} — reviews incoming!`
          : d.merged
            ? `[excited] Merged into ${d.branch}! No conflicts, no mercy!`
            : `[excited] The pull request is open on ${d.branch}!`;
      return {
        kind: scene.kind,
        keyframe:
          `${LOCK} Low-angle shot from the desk surface: she hits the enter key with a flourish ` +
          `and throws both hands up, screen glow flaring, mid-celebration, ${EYE}. ${STYLE}`,
        motion: `she slams enter, throws both hands up and leans back laughing, joyful release. ${STYLE}`,
        vo,
      };
    }
    case 'end': {
      // EndData.tagline is the credits line; the caption carries the sign-off.
      return {
        kind: scene.kind,
        keyframe:
          `${LOCK} Wide slightly dutch-angle shot: she closes the laptop and leans back in her ` +
          `chair with a satisfied smile, lamplight warm on the room, ${EYE}. ${STYLE}`,
        motion: `she gently closes the laptop and leans back, smiling, calm settle. ${STYLE}`,
        vo: `[warmly] ${scene.caption} This is vibemovie.`,
      };
    }
  }
}

/**
 * Compile the scene list into the shot list: one beat per scene, in scene order
 * (title … end). A full session yields 6 beats; an empty one yields 2 (title +
 * end cards). PURE: same scenes → same prompts.
 */
export function deriveBeats(scenes: readonly Scene[]): Beat[] {
  return scenes.map(beatFor);
}

/** ------------------------------------------------------------------ */
/** Availability                                                        */
/** ------------------------------------------------------------------ */

/** True when a usable wavespeed key is present — the only egress gate. */
export function cinematicAvailable(env: NodeJS.ProcessEnv = process.env): boolean {
  const key = env['WAVESPEED_API_KEY'];
  return typeof key === 'string' && key.trim().length > 0;
}

type ExecFn = (file: string, args: readonly string[]) => void;

const defaultExec: ExecFn = (file, args) => {
  execFileSync(file, [...args], { stdio: 'ignore' });
};

/** True when `ffmpeg` runs — required for normalize/concat/grade/mux. */
export function ffmpegAvailable(execFn: ExecFn = defaultExec): boolean {
  try {
    execFn('ffmpeg', ['-version']);
    return true;
  } catch {
    return false;
  }
}

/** ------------------------------------------------------------------ */
/** The pipeline                                                        */
/** ------------------------------------------------------------------ */

const API_BASE = 'https://api.wavespeed.ai/api/v3';

/** Model IDs + params, copied from the validated reference pipeline. */
const MODEL_T2I = 'bytedance/seedream-v4';
const MODEL_EDIT = 'wavespeed-ai/flux-kontext-max';
const MODEL_I2V = 'kwaivgi/kling-v2.5-turbo-pro/image-to-video';
const MODEL_FACE_SWAP = 'wavespeed-ai/video-face-swap';
const MODEL_TTS = 'elevenlabs/eleven-v3';

const T2I_SIZE = '1920*1080';
const CLIP_SECONDS = 5;
const NEGATIVE_PROMPT =
  'morphing, warping, distorted face, changing outfit, extra fingers, flicker, ' +
  'duplicated objects, ghosting, double image, cloned furniture';

/** Injectable side-effects so tests can run the whole pipeline without network/ffmpeg. */
export interface CinematicDeps {
  fetchFn?: typeof fetch;
  execFn?: ExecFn;
  sleepFn?: (ms: number) => Promise<void>;
}

export interface CinematicOptions {
  /** Where the final mp4 is written. */
  out: string;
  /** wavespeed key. Default: `WAVESPEED_API_KEY` from the environment. */
  apiKey?: string;
  /** Scratch dir for keyframes/clips/mix parts. Default: a fresh mkdtemp. */
  workDir?: string;
  /** eleven-v3 voice. Default 'George'. */
  voiceId?: string;
  /** Progress lines. Default: stderr. */
  log?: (msg: string) => void;
  /** Test seam: override fetch/ffmpeg/sleep. */
  deps?: CinematicDeps;
}

export interface CinematicResult {
  /** The rendered mp4 (`opts.out`). */
  path: string;
  /** The shot list the film was built from. */
  beats: Beat[];
}

interface Prediction {
  data?: { id?: string };
}

interface PredictionResult {
  data?: { status?: string; outputs?: string[] };
}

const sleep = (ms: number) => new Promise<void>((r) => setTimeout(r, ms));

/**
 * Render the scene list as a gen-video mp4. Egresses to wavespeed.ai — the
 * caller is responsible for the consent gate (`cinematicAvailable`) and the
 * Hyperframes fallback. Throws on missing key, failed predictions, or ffmpeg
 * errors; a failed face-swap degrades to the un-swapped cut (logged, not fatal).
 */
export async function renderCinematic(
  scenes: readonly Scene[],
  opts: CinematicOptions,
): Promise<CinematicResult> {
  const apiKey = opts.apiKey ?? process.env['WAVESPEED_API_KEY'];
  if (typeof apiKey !== 'string' || apiKey.trim().length === 0) {
    throw new Error('cinematic: WAVESPEED_API_KEY is required (set it in the environment or pass opts.apiKey)');
  }
  const fetchFn = opts.deps?.fetchFn ?? fetch;
  const execFn = opts.deps?.execFn ?? defaultExec;
  const sleepFn = opts.deps?.sleepFn ?? sleep;
  const log = opts.log ?? ((msg: string) => process.stderr.write(`${msg}\n`));
  const voiceId = opts.voiceId ?? 'George';

  const workDir = opts.workDir ?? mkdtempSync(join(tmpdir(), 'vibemovie-cinematic-'));
  mkdirSync(workDir, { recursive: true });

  const headers = { Authorization: `Bearer ${apiKey}` };

  const post = async (model: string, body: Record<string, unknown>): Promise<string> => {
    const res = await fetchFn(`${API_BASE}/${model}`, {
      method: 'POST',
      headers: { ...headers, 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    const j = (await res.json()) as Prediction;
    const id = j.data?.id;
    if (id === undefined) throw new Error(`cinematic: ${model} did not return a prediction id`);
    return id;
  };

  const poll = async (id: string, maxTicks = 95, intervalMs = 3000): Promise<string> => {
    for (let i = 0; i < maxTicks; i++) {
      const res = await fetchFn(`${API_BASE}/predictions/${id}/result`, { headers });
      const j = (await res.json()) as PredictionResult;
      const status = j.data?.status;
      const out = j.data?.outputs?.[0];
      if (status === 'completed' && out !== undefined) return out;
      if (status === 'failed') throw new Error(`cinematic: prediction ${id} failed`);
      await sleepFn(intervalMs);
    }
    throw new Error(`cinematic: prediction ${id} timed out`);
  };

  const download = async (url: string, path: string): Promise<void> => {
    const res = await fetchFn(url);
    writeFileSync(path, Buffer.from(await res.arrayBuffer()));
  };

  const upload = async (path: string): Promise<string> => {
    const form = new FormData();
    form.append('file', new Blob([readFileSync(path)]), basename(path));
    const res = await fetchFn(`${API_BASE}/media/upload/binary`, { method: 'POST', headers, body: form });
    const j = (await res.json()) as { data?: { download_url?: string } };
    const url = j.data?.download_url;
    if (url === undefined) throw new Error('cinematic: media upload failed');
    return url;
  };

  const t2i = async (prompt: string): Promise<string> =>
    poll(await post(MODEL_T2I, { prompt, size: T2I_SIZE }));
  const edit = async (prompt: string, image: string): Promise<string> =>
    poll(await post(MODEL_EDIT, { prompt, image }));
  const kling = async (first: string, last: string, motion: string): Promise<string> =>
    poll(
      await post(MODEL_I2V, {
        image: first,
        last_image: last,
        prompt: motion,
        duration: CLIP_SECONDS,
        negative_prompt: NEGATIVE_PROMPT,
      }),
    );
  const tts = async (text: string): Promise<string> =>
    poll(
      await post(MODEL_TTS, {
        text,
        voice_id: voiceId,
        stability: 0.3,
        similarity: 0.75,
        use_speaker_boost: true,
      }),
      60,
      2500,
    );

  const beats = deriveBeats(scenes);
  if (beats.length < 2) throw new Error('cinematic: need at least 2 scenes to build a film');

  // 1) hero + crisp face ref (stronger swap lock), in parallel
  log('cinematic: hero + face ref...');
  const { hero: heroPrompt, face: facePrompt } = deriveReferencePrompts();
  const [heroUrl, faceUrl] = await Promise.all([t2i(heroPrompt), t2i(facePrompt)]);

  // 2) one keyframe per beat, LOCK'd to the hero, in parallel
  log(`cinematic: ${beats.length} keyframes (parallel)...`);
  const kfUrls = await Promise.all(beats.map((b) => edit(b.keyframe, heroUrl)));
  // the last keyframe is also downloaded — it becomes the static end card
  const lastKfPath = join(workDir, 'end.jpg');
  await download(kfUrls[kfUrls.length - 1] as string, lastKfPath);

  // 3) chained Kling clips in parallel: first = kf N, last = kf N+1 (seamless cuts)
  const clipCount = beats.length - 1;
  log(`cinematic: ${clipCount} Kling clips (parallel, first+last frame chained)...`);
  const clipPaths = await Promise.all(
    beats.slice(0, -1).map(async (b, i) => {
      const path = join(workDir, `c${i}.mp4`);
      try {
        await download(await kling(kfUrls[i] as string, kfUrls[i + 1] as string, b.motion), path);
        log(`cinematic:  clip ${i}`);
        return path;
      } catch (err) {
        log(`cinematic:  clip ${i} failed (${err instanceof Error ? err.message : String(err)}) — skipping`);
        return null;
      }
    }),
  );
  const clips = clipPaths.filter((p): p is string => p !== null && existsSync(p));
  if (clips.length === 0) throw new Error('cinematic: all Kling clips failed');

  // 4) normalize clips to one format + a 5s zoompan end card on the last keyframe
  const segs: string[] = [];
  for (let i = 0; i < clips.length; i++) {
    const seg = join(workDir, `s${i}.mp4`);
    execFn('ffmpeg', [
      '-y', '-i', clips[i] as string, '-an',
      '-vf', 'scale=1280:720:force_original_aspect_ratio=increase,crop=1280:720,setsar=1,fps=24',
      '-c:v', 'libx264', '-pix_fmt', 'yuv420p', seg,
    ]);
    segs.push(seg);
  }
  const endCard = join(workDir, 'end.mp4');
  execFn('ffmpeg', [
    '-y', '-i', lastKfPath,
    '-vf', `zoompan=z='min(zoom+0.0008,1.06)':d=${CLIP_SECONDS * 24}:x='iw/2-(iw/zoom/2)':y='ih/2-(ih/zoom/2)':s=1280x720:fps=24,setsar=1`,
    '-an', '-c:v', 'libx264', '-pix_fmt', 'yuv420p', endCard,
  ]);
  segs.push(endCard);

  const listPath = join(workDir, 'list.txt');
  writeFileSync(listPath, segs.map((s) => `file '${s.replace(/'/g, `'\\''`)}'`).join('\n'));
  const baseRaw = join(workDir, 'base_raw.mp4');
  execFn('ffmpeg', ['-y', '-f', 'concat', '-safe', '0', '-i', listPath, '-an', baseRaw]);
  log(`cinematic: base cut assembled (${segs.length} segments)`);

  // 5) identity lock: swap the headshot face onto every frame; then one unified grade
  let base = join(workDir, 'base.mp4');
  try {
    log('cinematic: face-swap identity lock...');
    const swapped = await poll(
      await post(MODEL_FACE_SWAP, { video: await upload(baseRaw), face_image: faceUrl, target_gender: 'female' }),
      140,
    );
    await download(swapped, base);
  } catch (err) {
    log(`cinematic: face-swap failed (${err instanceof Error ? err.message : String(err)}) — using the raw cut`);
    copyFileSync(baseRaw, base);
  }
  const graded = join(workDir, 'base_g.mp4');
  execFn('ffmpeg', [
    '-y', '-i', base,
    '-vf', 'eq=contrast=1.06:saturation=1.08:brightness=0.01,colorbalance=rs=0.05:gs=0.01:bs=-0.04:rm=0.03:bm=-0.02,setsar=1',
    '-an', '-c:v', 'libx264', '-pix_fmt', 'yuv420p', graded,
  ]);

  // 6) one eleven-v3 line per beat, cleaned up, each placed at its 5s mark
  log(`cinematic: ${beats.length} VO lines (parallel)...`);
  const voPaths = await Promise.all(
    beats.map(async (b, i) => {
      const raw = join(workDir, `raw${i}.mp3`);
      await download(await tts(b.vo), raw);
      const processed = join(workDir, `r${i}.mp3`);
      execFn('ffmpeg', [
        '-y', '-i', raw,
        '-af', 'highpass=f=80,acompressor=threshold=-18dB:ratio=2.5,volume=2dB',
        processed,
      ]);
      log(`cinematic:  line ${i} (${voiceId})`);
      return processed;
    }),
  );

  // mux: graded cut + delayed VO lines + a near-silent room-tone bed (NO music)
  const dur = beats.length * CLIP_SECONDS;
  const inputs = ['-i', graded];
  for (const p of voPaths) inputs.push('-i', p);
  inputs.push('-f', 'lavfi', '-i', `anoisesrc=color=pink:d=${dur}:a=0.025`);
  const hissIdx = 1 + voPaths.length;
  let fc = '';
  voPaths.forEach((_, i) => {
    const d = i * CLIP_SECONDS * 1000;
    fc += `[${i + 1}:a]adelay=${d}|${d}[v${i}];`;
  });
  fc += `[${hissIdx}:a]highpass=f=300,lowpass=f=3000,volume=0.5[hiss];`;
  fc +=
    voPaths.map((_, i) => `[v${i}]`).join('') +
    `[hiss]amix=inputs=${voPaths.length + 1}:duration=longest:dropout_transition=0,volume=1.3[a]`;
  execFn('ffmpeg', [
    '-y', ...inputs,
    '-filter_complex', fc,
    '-map', '0:v', '-map', '[a]',
    '-c:v', 'copy', '-c:a', 'aac', '-shortest', opts.out,
  ]);
  log(`cinematic: DONE -> ${opts.out}`);

  return { path: opts.out, beats };
}
