/**
 * @pooriaarab/vibemovie — your agent coding session as a short recap video.
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
export { shotRecipes, SHOT_ROLES, ENERGY_LEVELS, pickRecipes, recipesForArc } from './recipes/index.js';
export type { ShotRecipe, Role, Energy } from './recipes/index.js';
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

export type NotifySink = (event: VibeEvent) => void;

export interface RenderMovieOptions extends BuildOptions, RenderOptions {
  out?: string;
  engine?: Engine;
  apiKey?: string;
  log?: (msg: string) => void;
  notify?: NotifySink;
}

export interface RenderMovieResult {
  engine: Engine;
  html?: string;
  path?: string;
}

interface HyperframesRequest {
  scenes: ReturnType<typeof buildScenes>;
  ratio?: RenderOptions['ratio'];
  title?: string;
}

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

function rewriteOutForFallback(out: string | undefined, log: (msg: string) => void): string | undefined {
  if (out === undefined) return undefined;
  const htmlOut = out.replace(/\.(mp4|mov|webm|mkv)$/i, '.html');
  if (htmlOut !== out) {
    log(`vibemovie: writing the hyperframes HTML to ${htmlOut}`);
    return htmlOut;
  }
  return out;
}

async function tryCinematic(opts: {
  scenes: ReturnType<typeof buildScenes>;
  renderOpts: RenderMovieOptions;
  log: (msg: string) => void;
  sink: NotifySink;
  out: string | undefined;
}): Promise<RenderMovieResult | null> {
  if ((opts.renderOpts.engine ?? 'hyperframes') !== 'cinematic') return null;
  if (cinematicAvailable() && ffmpegAvailable()) {
    const cinOut = opts.out ?? './vibe-recap.mp4';
    const cinOpts: CinematicOptions = { out: cinOut, log: opts.log };
    if (opts.renderOpts.apiKey !== undefined) cinOpts.apiKey = opts.renderOpts.apiKey;
    const cin = await renderCinematic(opts.scenes, cinOpts);
    const result: RenderMovieResult = { engine: 'cinematic', path: cin.path };
    notifyRenderDone(opts.sink, result);
    return result;
  }
  const why = !cinematicAvailable() ? 'WAVESPEED_API_KEY is not set' : 'ffmpeg is not on PATH';
  opts.log(`vibemovie: cinematic engine unavailable (${why}) — falling back to hyperframes (offline, zero keys)`);
  return null;
}

async function renderViaHyperframes(
  scenes: ReturnType<typeof buildScenes>,
  opts: RenderMovieOptions,
  out: string | undefined,
  sink: NotifySink,
): Promise<RenderMovieResult> {
  const cascade = createCascade({
    consent: createConsentLedger(),
    pickLocal: (capability) => Promise.resolve(capability === 'video' ? createHyperframesRunner() : null),
  });
  const resolved = await cascade.resolve({ capability: 'video', allowEgress: false });
  const provider = resolved.provider;
  if (resolved.tier !== 'local' || !('capability' in provider)) {
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

export async function renderMovie(
  events: readonly (VibeEvent | RawEvent)[],
  opts: RenderMovieOptions = {},
): Promise<RenderMovieResult> {
  const scenes = buildScenes(events, opts);
  const log = opts.log ?? ((msg: string) => process.stderr.write(`${msg}\n`));
  const sink: NotifySink = opts.notify ?? vibeCoreNotify;
  let out = opts.out;
  const cinResult = await tryCinematic({ scenes, renderOpts: opts, log, sink, out });
  if (cinResult !== null) return cinResult;
  if ((opts.engine ?? 'hyperframes') === 'cinematic') {
    out = rewriteOutForFallback(out, log);
  }
  return renderViaHyperframes(scenes, opts, out, sink);
}

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
