import { readFileSync, writeFileSync } from 'node:fs';
import { basename } from 'node:path';

const API_BASE = 'https://api.wavespeed.ai/api/v3';
const MODEL_T2I = 'bytedance/seedream-v4';
const MODEL_EDIT = 'wavespeed-ai/flux-kontext-max';
const MODEL_I2V = 'kwaivgi/kling-v2.5-turbo-pro/image-to-video';
const MODEL_TTS = 'elevenlabs/eleven-v3';
const MODEL_FACE_SWAP = 'wavespeed-ai/video-face-swap';
const T2I_SIZE = '1920*1080';
const CLIP_SECONDS = 5;
const NEGATIVE_PROMPT =
  'morphing, warping, distorted face, changing outfit, extra fingers, flicker, ' +
  'duplicated objects, ghosting, double image, cloned furniture';

export { API_BASE, MODEL_T2I, MODEL_EDIT, MODEL_I2V, MODEL_FACE_SWAP, MODEL_TTS, T2I_SIZE, CLIP_SECONDS, NEGATIVE_PROMPT };

interface Prediction {
  data?: { id?: string };
}
interface PredictionResult {
  data?: { status?: string; outputs?: string[] };
}

const sleep = (ms: number) => new Promise<void>((r) => setTimeout(r, ms));
export { sleep };

export function apiHeaders(apiKey: string): Record<string, string> {
  return { Authorization: `Bearer ${apiKey}` };
}

export async function apiPost(
  fetchFn: typeof fetch,
  headers: Record<string, string>,
  model: string,
  body: Record<string, unknown>,
): Promise<string> {
  const res = await fetchFn(`${API_BASE}/${model}`, {
    method: 'POST',
    headers: { ...headers, 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  const j = (await res.json()) as Prediction;
  const id = j.data?.id;
  if (id === undefined) throw new Error(`cinematic: ${model} did not return a prediction id`);
  return id;
}

export async function apiPoll(opts: {
  fetchFn: typeof fetch;
  headers: Record<string, string>;
  sleepFn: (ms: number) => Promise<void>;
  id: string;
  maxTicks?: number;
  intervalMs?: number;
}): Promise<string> {
  const maxTicks = opts.maxTicks ?? 95;
  const intervalMs = opts.intervalMs ?? 3000;
  for (let i = 0; i < maxTicks; i++) {
    const res = await opts.fetchFn(`${API_BASE}/predictions/${opts.id}/result`, { headers: opts.headers });
    const j = (await res.json()) as PredictionResult;
    const status = j.data?.status;
    const out = j.data?.outputs?.[0];
    if (status === 'completed' && out !== undefined) return out;
    if (status === 'failed') throw new Error(`cinematic: prediction ${opts.id} failed`);
    await opts.sleepFn(intervalMs);
  }
  throw new Error(`cinematic: prediction ${opts.id} timed out`);
}

export async function apiDownload(fetchFn: typeof fetch, url: string, path: string): Promise<void> {
  const res = await fetchFn(url);
  writeFileSync(path, Buffer.from(await res.arrayBuffer()));
}

export async function apiUpload(fetchFn: typeof fetch, headers: Record<string, string>, path: string): Promise<string> {
  const form = new FormData();
  form.append('file', new Blob([readFileSync(path)]), basename(path));
  const res = await fetchFn(`${API_BASE}/media/upload/binary`, { method: 'POST', headers, body: form });
  const j = (await res.json()) as { data?: { download_url?: string } };
  const url = j.data?.download_url;
  if (url === undefined) throw new Error('cinematic: media upload failed');
  return url;
}

export async function t2i(
  fetchFn: typeof fetch,
  headers: Record<string, string>,
  sleepFn: (ms: number) => Promise<void>,
  prompt: string,
): Promise<string> {
  const id = await apiPost(fetchFn, headers, MODEL_T2I, { prompt, size: T2I_SIZE });
  return apiPoll({ fetchFn, headers, sleepFn, id });
}

export async function editImage(opts: {
  fetchFn: typeof fetch;
  headers: Record<string, string>;
  sleepFn: (ms: number) => Promise<void>;
  prompt: string;
  image: string;
}): Promise<string> {
  const id = await apiPost(opts.fetchFn, opts.headers, MODEL_EDIT, { prompt: opts.prompt, image: opts.image });
  return apiPoll({ fetchFn: opts.fetchFn, headers: opts.headers, sleepFn: opts.sleepFn, id });
}

export async function klingClip(opts: {
  fetchFn: typeof fetch;
  headers: Record<string, string>;
  sleepFn: (ms: number) => Promise<void>;
  first: string;
  last: string;
  motion: string;
}): Promise<string> {
  const id = await apiPost(opts.fetchFn, opts.headers, MODEL_I2V, {
    image: opts.first,
    last_image: opts.last,
    prompt: opts.motion,
    duration: CLIP_SECONDS,
    negative_prompt: NEGATIVE_PROMPT,
  });
  return apiPoll({ fetchFn: opts.fetchFn, headers: opts.headers, sleepFn: opts.sleepFn, id });
}

export async function ttsLine(opts: {
  fetchFn: typeof fetch;
  headers: Record<string, string>;
  sleepFn: (ms: number) => Promise<void>;
  voiceId: string;
  text: string;
}): Promise<string> {
  const id = await apiPost(opts.fetchFn, opts.headers, MODEL_TTS, {
    text: opts.text,
    voice_id: opts.voiceId,
    stability: 0.3,
    similarity: 0.75,
    use_speaker_boost: true,
  });
  return apiPoll({ fetchFn: opts.fetchFn, headers: opts.headers, sleepFn: opts.sleepFn, id, maxTicks: 60, intervalMs: 2500 });
}
