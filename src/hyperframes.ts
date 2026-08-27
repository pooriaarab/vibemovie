/**
 * hyperframes.ts — pure scene-list → self-contained animated HTML renderer.
 *
 * The output is a single .html file with all CSS + JS inline: no CDN, no fonts,
 * no network calls, no external URLs of any kind. Playback is driven entirely by
 * scene timing (every animation is a pure function of the local scene clock), so
 * scrubbing to any timestamp lands on the exact in-between state — and rendering
 * is deterministic: the same scenes always produce byte-identical HTML.
 *
 * The scene engine (timeline, transitions, scrubber, per-scene animators) is
 * adapted from docs/prototype.html.
 */

import type { Ratio, Scene } from './scenes.js';
import { css } from './hyperframes-css.js';
import { engineJs } from './hyperframes-engine.js';
import { escapeHtml, sceneHtml } from './hyperframes-scene.js';

export type { Ratio } from './scenes.js';

export interface RenderOptions {
  /** Player aspect ratio. Default '16:9'. */
  ratio?: Ratio;
  /** Document <title>. Default: the session name from the title scene. */
  title?: string;
}

export { escapeHtml };

function embedJson(value: unknown): string {
  return JSON.stringify(value)
    .replace(/</g, '\\u003c')
    .replace(/\u2028/g, '\\u2028')
    .replace(/\u2029/g, '\\u2029');
}

/**
 * Render a scene list into a self-contained animated HTML document.
 * PURE and deterministic: identical input → identical output string.
 */
export function renderHyperframes(scenes: readonly Scene[], opts: RenderOptions = {}): string {
  const ratio: Ratio = opts.ratio ?? '16:9';
  const titleScene = scenes.find((s): s is Extract<Scene, { kind: 'title' }> => s.kind === 'title');
  const docTitle = opts.title ?? titleScene?.data.sessionName ?? 'session recap';

  const scenesJson = embedJson(scenes);
  const body = scenes.map(sceneHtml).join('\n      ');

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>vibemovie — ${escapeHtml(docTitle)}</title>
<style>${css(ratio)}</style>
</head>
<body>
<div class="stage">

  <div class="topbar">
    <div>
      <div class="wordmark">vibe<b>movie</b></div>
      <span class="tagline">${escapeHtml(docTitle)}</span>
    </div>
    <div class="badge-local"><span class="dot"></span>local · no data out</div>
  </div>

  <div class="player">
    <div class="filmstrip"></div>
    <div class="screen" id="screen">
      ${body}
      <div class="scene-title" id="sceneTitle"></div>
    </div>
    <div class="captions" id="captions"></div>
    <div class="controls">
      <button class="icon-btn" id="playBtn" aria-label="Pause">
        <svg id="playIcon" viewBox="0 0 16 16" fill="currentColor"><rect x="3" y="2" width="4" height="12" rx="1"/><rect x="9" y="2" width="4" height="12" rx="1"/></svg>
      </button>
      <div class="time" id="timeCurrent">0:00</div>
      <div class="scrubber" id="scrubber">
        <div class="scrubber-track"><div class="scrubber-fill" id="scrubberFill"></div></div>
        <div class="scrubber-markers" id="scrubberMarkers"></div>
        <div class="scrubber-thumb" id="scrubberThumb"></div>
      </div>
      <div class="time total" id="timeTotal">0:00</div>
    </div>
  </div>

  <div class="foot">hyperframes · rendered offline — no keys, no network, no data out</div>

</div>
<script>${engineJs(scenesJson)}</script>
</body>
</html>
`;
}
