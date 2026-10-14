# VibeMovie

[![npm version](https://img.shields.io/npm/v/vibemovie)](https://www.npmjs.com/package/vibemovie) [![Downloads/month](https://img.shields.io/npm/dm/vibemovie)](https://www.npmjs.com/package/vibemovie) [![License: MIT](https://img.shields.io/badge/license-MIT-blue)](https://opensource.org/license/mit)

[Package](https://www.npmjs.com/package/vibemovie) · [Setup](#install) · [API example](#library-example) · [Compare](#compare)

VibeMovie is an open-source coding-session recap generator for developers and creators.
It turns structured events into a self-contained animated HTML story through its local Hyperframes engine.
An optional cinematic engine creates narrated MP4 output through WaveSpeed AI and FFmpeg. VibeMovie belongs to the Vibe Suite.

## Install

```bash
npm install -g vibemovie
```

Requires Node.js 18 or later. Includes TypeScript declarations and two direct runtime dependencies.
The default Hyperframes engine needs no API key, browser automation, or FFmpeg installation.

## Render your first recap

Create an input file:

```bash
cat > session.json <<'JSON'
[
  {"kind":"task-done","ts":1769500000000,"agent":"claude-code","payload":{"label":"Refactor auth","durationMin":18}},
  {"kind":"tests-pass","ts":1769503600000,"payload":{"passed":42}},
  {"kind":"pr-merged","ts":1769505100000,"payload":{"pr":42,"branch":"main"}}
]
JSON
vibemovie render session.json --title "Auth recap" --out recap.html
```

The CLI prints `recap rendered` and the output path. Open `recap.html` in a browser to play the story and scrub its timeline.
No environment variables or credentials are required. The CLI does not load `.env` files.
The input describes events; VibeMovie does not inspect your coding-agent history automatically.

## How it works

```text
JSON events -> normalize and sort -> scene compiler
                                       |
                 +---------------------+---------------------+
                 v                                           v
          Hyperframes (default)                    cinematic (explicit)
       embedded HTML/CSS/JavaScript             WaveSpeed images + video + voice
                 |                                           |
        offline browser player                         FFmpeg -> MP4
```

Hyperframes rendering uses a local vibe-core runner with egress disabled.
Cinematic rendering sends derived prompts, narration text, and intermediate media to WaveSpeed AI.

## Why it exists

A terminal recording preserves activity. A recap selects tasks, test outcomes, diff totals, and pull-request milestones into a short story.
VibeMovie compiles those supplied events with fixed templates. It does not need a language model to build the default recap.
Remotion and asciinema address related video and terminal workflows with different inputs.

## Compare

Checked 2026-10-14 against [Remotion](https://www.remotion.dev/) and [asciinema CLI](https://docs.asciinema.org/manual/cli/).

| Property | VibeMovie | Remotion | asciinema |
| --- | --- | --- | --- |
| Input | Structured coding events | React video compositions | Terminal session output |
| Scope | Template-based recap stories | Programmatic video and motion graphics | Terminal recording and streaming |
| Default artifact here | Self-contained HTML | Rendered compositions or embedded player | Asciicast recording |
| Authoring | JSON, Node.js API, agent tool | React components | Recorder CLI |

## Coverage

| Integration or surface | Status | Source behavior |
| --- | --- | --- |
| Hyperframes | Implemented; local | Embedded HTML, CSS, JavaScript, and scene data |
| WaveSpeed AI | Implemented; live API pending | Hosted generation orchestration |
| ByteDance Seedream v4 | Implemented via WaveSpeed; live API pending | Hero and face reference images |
| FLUX Kontext Max | Implemented via WaveSpeed; live API pending | Keyframe image edits |
| Kling v2.5 Turbo Pro | Implemented via WaveSpeed; live API pending | Image-to-video clips |
| ElevenLabs Eleven v3 | Implemented via WaveSpeed; live API pending | Narration synthesis |
| WaveSpeed video face swap | Implemented; best-effort | Optional intermediate face consistency step |
| FFmpeg | Implemented; external executable | Normalize, concatenate, grade, and mux cinematic output |
| Claude Code / OpenAI Codex / Google Gemini CLI | Event input only | Supply normalized JSON yourself; no harness-specific log reader |
| MCP | Implemented | One stdio render tool |
| OpenAI Sora / Replicate | — | No provider adapter shipped |

The source declares two engines, three ratios, three templates, six scene kinds, and five hosted model endpoints through one API service.
Verification here covers source and local tests with injected cinematic dependencies. No paid API requests or credential checks were performed.
An implemented endpoint is not a guarantee that a provider model remains available.

## Common use cases

1. Claude Code developers: export task and test events into an offline HTML recap.
2. Codex maintainers: describe pull-request milestones in JSON for a release story.
3. Gemini CLI creators: choose portrait Hyperframes output with `--ratio 9:16`.
4. Node.js teams: call `buildScenes` and `renderHyperframes` inside an existing event pipeline.
5. MCP agents: render supplied events with the single `render` tool.
6. WaveSpeed users: opt into hosted cinematic generation with their own key and FFmpeg installation.

## Features

- **Scenes:** title, tasks, diff, terminal, merge, and end; optional scenes depend on supplied data.
- **Templates:** documentary, speedrun, and meme control captions and pacing.
- **HTML ratios:** `16:9`, `9:16`, and `1:1`.
- **Player:** play/pause, timeline scrubbing, captions, and embedded scene data.
- **Deterministic compilation:** the same events and scene options produce the same local scenes.
- **Cinematic pipeline:** generated reference images, keyframes, clips, narration, and local MP4 assembly.
- **Shot recipes:** exported recipe data and deterministic selectors for custom callers; not an automatic CLI storyboard selector.
- **Suite notification:** rendering emits a best-effort `render-done` event through vibe-core.

## Runtime surfaces

```text
vibemovie render [file.json|-] [--ratio 16:9|9:16|1:1]
  [--template documentary|speedrun|meme] [--engine hyperframes|cinematic]
  [--out path] [--title name]
vibemovie mcp
vibemovie help
vibemovie --help / -h
vibemovie --version / -v / -V
```

`render` reads a file or stdin. Input accepts an event array or `{ "events": [...] }`.
Defaults are `hyperframes`, `documentary`, `16:9`, and `./vibe-recap.html`.
Cinematic output defaults to `./vibe-recap.mp4`.

`vibemovie mcp` starts the stdio Model Context Protocol (MCP) server with one tool:

| Tool | Required input | Optional input | Result |
| --- | --- | --- | --- |
| `render` | `events` array | `ratio`, `template`, `engine`, `title`, `out` | HTML text, or a written output path |

### Library example

Install with `npm install vibemovie`. Save this as `recap.mjs` and run `node recap.mjs`:

```js
import { renderMovie } from 'vibemovie';
const result = await renderMovie([
  { kind: 'task-done', ts: 1769500000000, payload: { label: 'Ship auth' } }
], { title: 'Auth recap', out: 'recap.html' });
console.log(result.engine, result.path); // hyperframes recap.html
```

`buildScenes(events, options)` and `renderHyperframes(scenes, options)` are also exported for custom pipelines.

## Delivery and behavior limits

Hyperframes produces animated HTML, not an MP4 or GIF. It does not record your screen or stream live agent activity.
The CLI has no `--session` or `--repo` importer. Convert external recordings into the event schema before rendering.
The scene compiler displays at most five task rows, four diff filenames, and five terminal lines.
Terminal lines summarize supplied events; they are not a captured terminal transcript.
Diff totals and test results reflect input claims, not an independent Git or test-run verification.
Cinematic output is normalized to 1280×720 at 24 frames per second. HTML ratio options do not change that cinematic output size.
Cinematic prompts use a fixed character and setting. There is no user-avatar selection or dynamic soundtrack engine.
Missing `WAVESPEED_API_KEY` or FFmpeg triggers HTML fallback; recognized video filename extensions become `.html`.
Runtime provider failures do not trigger a general HTML fallback. Failed clips may be skipped; all clips failing aborts the render.
Prediction polling is bounded: normally 95 polls, narration 60, and face swap 140. Requests have no explicit network timeout.
The face-swap step can fall back to the raw cut. Temporary cinematic work files remain on disk.
Review input before rendering: hosted narration can include task labels, session names, and summary values.

## Integration guides

- Portrait HTML recap: `vibemovie render session.json --ratio 9:16 --template speedrun --out portrait.html`.
- Event pipeline: pipe a JSON array into `vibemovie render --out recap.html`.
- Hosted cinematic recap: install FFmpeg, export `WAVESPEED_API_KEY`, then run `vibemovie render session.json --engine cinematic`.
- Environment file: load variables in your shell or launcher before starting the CLI; VibeMovie does not read `.env` automatically.
- Agent setup: configure your MCP host to launch `vibemovie mcp` over stdio.

Hosted rendering uses `https://api.wavespeed.ai/api/v3`. There is no separate ElevenLabs key in this pipeline.

## Status

Version 0.2.4 is pre-1.0; APIs and generation behavior can change.
Public case studies are not yet published. No public documentation site is configured; setup guidance is self-contained here.
Source-only prototypes illustrate additional controls; they are not shipped web applications.
Use [GitHub issues](https://github.com/pooriaarab/vibemovie/issues) for support; repository access may be required.
For contributions, run `npm ci`, `npm run build`, `npm run typecheck`, `npm test`, and `git diff --check`.

## FAQ

### Which integrations are verified?

VibeMovie tests local rendering and cinematic orchestration with injected dependencies. Hosted endpoints have not been credential-checked in this rewrite.

### Does VibeMovie provide a managed video service?

VibeMovie runs as a local package. Optional hosted generation uses your WaveSpeed API key and provider account.

### How is VibeMovie different from Remotion?

VibeMovie compiles structured session events with preset scenes. Remotion provides React-based tools for custom video compositions.

### How is VibeMovie different from asciinema?

VibeMovie renders a summary from supplied events. asciinema records and streams terminal output.

### Can VibeMovie work offline?

VibeMovie renders Hyperframes HTML without remote assets or API keys. Its cinematic engine requires hosted API access.

### Does VibeMovie export MP4 without credentials?

VibeMovie defaults to HTML when no cinematic credentials are available. MP4 generation requires a WaveSpeed key and FFmpeg.

### Does VibeMovie read Claude Code or Codex logs automatically?

VibeMovie accepts JSON event input rather than scanning harness logs. Supply an event array through a file, stdin, the library, or MCP.

### Can VibeMovie use my existing Sora or Replicate account?

VibeMovie has no Sora or Replicate adapter in this version. The cinematic pipeline calls fixed WaveSpeed model endpoints.

### Are all output ratios available for cinematic MP4?

VibeMovie supports three ratios in Hyperframes HTML. Cinematic assembly currently normalizes video to 1280×720.

## License

MIT.
