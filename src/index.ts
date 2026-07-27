/**
 * @pooriaarab/vibemovie — your agent coding session as a short recap video.
 *
 * Two render engines:
 *
 * - **hyperframes** (default) — a self-contained animated HTML page rendered
 *   100% on-device: no gen-video model, no API key, no network.
 * - **cinematic** (opt-in, BYO key) — a real gen-video mp4 via wavespeed.ai
 *   (Kling chained clips + face-swap identity lock + ElevenLabs VO). Requires
 *   `WAVESPEED_API_KEY` and ffmpeg; without them it falls back to Hyperframes
 *   with a clear message — it never fails hard and never egresses without a key.
 *
 * ```ts
 * import { renderMovie } from '@pooriaarab/vibemovie';
 * const { html, path } = await renderMovie(events, { ratio: '9:16', out: 'recap.html' });
 * const video = await renderMovie(events, { engine: 'cinematic', out: 'recap.mp4' });
 * ```
 */

import { createCascade, createConsentLedger, makeEvent, notify as vibeCoreNotify } from '@pooriaarab/vibe-core';
import type { LocalRunner } from '@pooriaarab/vibe-core';
import { writeFile } from 'node:fs/promises';

import { buildScenes } from './scenes.js';
import type { BuildOptions, RawEvent } from './scenes.js';
import { renderHyperframes } from './hyperframes.js';
import type { RenderOptions } from './hyperframes.js';
import { cinematicAvailable, ffmpegAvailable, renderCinematic } from './cinematic.js';
import type { CinematicOptions, Engine } from './cinematic.js';
import type { VibeEvent } from '@pooriaarab/vibe-core';

export { buildScenes, renderHyperframes };
export { cinematicAvailable, deriveBeats, deriveReferencePrompts, renderCinematic, ENGINES } from './cinematic.js';
export type { BuildOptions, RawEvent, RenderOptions };
export type { Beat, CinematicDeps, CinematicOptions, CinematicResult, Engine } from './cinematic.js';
export type {
  Ratio,
  Template,
  Transition,
  Scene,
  SceneKind,
  TitleData,
  TasksData,
  TaskRow,
  DiffData,
  TerminalData,
  TermLine,
  MergeData,
  EndData,
} from './scenes.js';
export type { VibeEvent } from '@pooriaarab/vibe-core';

/** Sink for milestone notifications. Injectable so tests can capture events. */
export type NotifySink = (event: VibeEvent) => void;

export interface RenderMovieOptions extends BuildOptions, RenderOptions {
  /** When set, the output is also written to this path (HTML or mp4, per engine). */
  out?: string;
  /** Render engine. Default 'hyperframes' (offline, zero keys). */
  engine?: Engine;
  /** wavespeed key for the cinematic engine. Default: `WAVESPEED_API_KEY` from env. */
  apiKey?: string;
  /** Status/fallback messages. Default: stderr. */
  log?: (msg: string) => void;
  /** Override the notification sink (tests). Defaults to vibe-core's `notify`. */
  notify?: NotifySink;
}

export interface RenderMovieResult {
  /** The engine that actually produced the output (cinematic can fall back). */
  engine: Engine;
  /** The self-contained recap HTML — present iff `engine` is 'hyperframes'. */
  html?: string;
  /** Path the output was written to — when `opts.out` was set (always for cinematic). */
  path?: string;
}

interface HyperframesRequest {
  scenes: ReturnType<typeof buildScenes>;
  ratio?: RenderOptions['ratio'];
  title?: string;
}

/**
 * Tier-3 'video' runner: the Hyperframes renderer. Always available — it is
 * pure string generation, so "available" reduces to true. Never egresses.
 */
function createHyperframesRunner(): LocalRunner {
  return {
    capability: 'video',
    available: () => Promise.resolve(true),
    generate: <TReq, TOut>(req: TReq): Promise<TOut> => {
      const r = req as HyperframesRequest;
      return Promise.resolve(renderHyperframes(r.scenes, { ratio: r.ratio, title: r.title }) as TOut);
    },
  };
}

/**
 * Compile events → scenes → a recap via the selected engine.
 *
 * `hyperframes` (default) goes through the vibe-core cascade with egress
 * disabled and an in-memory consent ledger, so it always resolves to the local
 * Hyperframes runner — offline with zero keys. `cinematic` is opt-in egress:
 * it renders only when a wavespeed key is present (and ffmpeg runs); otherwise
 * it logs why and falls back to the Hyperframes tier — never a hard failure,
 * never data out without a key.
 *
 * When `opts.out` is set the output is also written to disk. Cinematic output
 * is always a file (default `./vibe-recap.mp4` when `out` is omitted); if the
 * cinematic engine falls back, a video-looking `out` extension is rewritten to
 * `.html` so the artifact matches its contents.
 *
 * A successful render (either engine, including a cinematic → hyperframes
 * fallback) fires ONE best-effort `render-done` vibenotify event via the
 * injectable sink (`opts.notify`, default vibe-core's `notify`). A failed
 * render fires nothing.
 */
export async function renderMovie(
  events: readonly (VibeEvent | RawEvent)[],
  opts: RenderMovieOptions = {},
): Promise<RenderMovieResult> {
  const scenes = buildScenes(events, opts);
  const log = opts.log ?? ((msg: string) => process.stderr.write(`${msg}\n`));
  const sink: NotifySink = opts.notify ?? vibeCoreNotify;
  let out = opts.out;

  if ((opts.engine ?? 'hyperframes') === 'cinematic') {
    if (cinematicAvailable() && ffmpegAvailable()) {
      const cinOut = out ?? './vibe-recap.mp4';
      const cinOpts: CinematicOptions = { out: cinOut, log };
      if (opts.apiKey !== undefined) cinOpts.apiKey = opts.apiKey;
      const cin = await renderCinematic(scenes, cinOpts);
      const result: RenderMovieResult = { engine: 'cinematic', path: cin.path };
      notifyRenderDone(sink, result);
      return result;
    }
    const why = !cinematicAvailable()
      ? 'WAVESPEED_API_KEY is not set'
      : 'ffmpeg is not on PATH';
    log(`vibemovie: cinematic engine unavailable (${why}) — falling back to hyperframes (offline, zero keys)`);
    // The fallback artifact is HTML — don't write it under a video filename.
    if (out !== undefined) {
      const htmlOut = out.replace(/\.(mp4|mov|webm|mkv)$/i, '.html');
      if (htmlOut !== out) {
        log(`vibemovie: writing the hyperframes HTML to ${htmlOut}`);
        out = htmlOut;
      }
    }
  }

  const cascade = createCascade({
    consent: createConsentLedger(),
    pickLocal: (capability) => Promise.resolve(capability === 'video' ? createHyperframesRunner() : null),
  });
  const resolved = await cascade.resolve({ capability: 'video', allowEgress: false });

  const provider = resolved.provider;
  if (resolved.tier !== 'local' || !('capability' in provider)) {
    // Unreachable in v0 (no tier-1/2 providers are registered), but the cascade
    // contract allows adapters — refuse rather than render through one silently.
    throw new Error('vibemovie v0 renders via the local Hyperframes tier only');
  }
  const req: HyperframesRequest = { scenes };
  if (opts.ratio !== undefined) req.ratio = opts.ratio;
  if (opts.title !== undefined) req.title = opts.title;
  const html = await provider.generate<HyperframesRequest, string>(req);

  if (out !== undefined) {
    await writeFile(out, html, 'utf8');
    const result: RenderMovieResult = { engine: 'hyperframes', html, path: out };
    notifyRenderDone(sink, result);
    return result;
  }
  const result: RenderMovieResult = { engine: 'hyperframes', html };
  notifyRenderDone(sink, result);
  return result;
}

/**
 * Fire the `render-done` milestone. Best-effort: a throwing sink (e.g. an
 * unwritable notify channel) must never turn a successful render into a
 * failure, so errors are swallowed here.
 */
function notifyRenderDone(sink: NotifySink, result: RenderMovieResult): void {
  try {
    sink(
      makeEvent('render-done', 'vibemovie', process.cwd(), {
        summary: `rendered ${result.engine} recap${result.path !== undefined ? ` → ${result.path}` : ''}`,
        outputPath: result.path ?? null,
      }),
    );
  } catch {
    /* best effort */
  }
}
