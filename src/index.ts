/**
 * @pooriaarab/vibemovie — your agent coding session as a short recap video.
 *
 * v0 ships the Hyperframes tier of the vibe-core video cascade: a recap "movie"
 * is a self-contained animated HTML page rendered 100% on-device — no gen-video
 * model, no API key, no network. The cascade seam is real: gen-video providers
 * (Sora, Wavespeed, …) can later be registered as tier-1/2 providers without
 * touching this API; the consent ledger gates their egress.
 *
 * ```ts
 * import { renderMovie } from '@pooriaarab/vibemovie';
 * const { html, path } = await renderMovie(events, { ratio: '9:16', out: 'recap.html' });
 * ```
 */

import { createCascade, createConsentLedger } from '@pooriaarab/vibe-core';
import type { LocalRunner } from '@pooriaarab/vibe-core';
import { writeFile } from 'node:fs/promises';

import { buildScenes } from './scenes.js';
import type { BuildOptions, RawEvent } from './scenes.js';
import { renderHyperframes } from './hyperframes.js';
import type { RenderOptions } from './hyperframes.js';
import type { VibeEvent } from '@pooriaarab/vibe-core';

export { buildScenes, renderHyperframes };
export type { BuildOptions, RawEvent, RenderOptions };
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

export interface RenderMovieOptions extends BuildOptions, RenderOptions {
  /** When set, the HTML is also written to this path. */
  out?: string;
}

export interface RenderMovieResult {
  /** The self-contained recap HTML (always returned, whether or not `out` was set). */
  html: string;
  /** Absolute or relative path the HTML was written to — only when `opts.out` was set. */
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
 * Compile events → scenes → a self-contained animated HTML recap.
 *
 * Rendering goes through the vibe-core cascade with egress disabled and an
 * in-memory consent ledger, so it always resolves to the local Hyperframes
 * runner — this call works offline with zero keys. (The cascade is the seam
 * for future gen-video tiers; they are not registered in v0.)
 *
 * When `opts.out` is set the HTML is also written to disk (the only IO here).
 */
export async function renderMovie(
  events: readonly (VibeEvent | RawEvent)[],
  opts: RenderMovieOptions = {},
): Promise<RenderMovieResult> {
  const scenes = buildScenes(events, opts);

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

  if (opts.out !== undefined) {
    await writeFile(opts.out, html, 'utf8');
    return { html, path: opts.out };
  }
  return { html };
}
