# VibeMovie

**Your vibe coding session, as a movie.**

Transforms your AI-assisted coding activity into a cinematic, narrated video — complete with chapters, a storyline, dramatic music, and visual effects. Not a screen recording. A movie.

## Install

```bash
npm i -g vibemovie-cli
# or run it directly
npx vibemovie-cli --help
```

## Quick start

```bash
# render a session recap from a JSON events file (or stdin)
vibemovie render session.json
# → writes ./vibe-recap.html — open it in any browser

vibemovie render session.json --ratio 9:16 --template speedrun --out recap.html
cat session.json | vibemovie render

# opt into the gen-video engine (BYO key — see "Cinematic engine" below)
vibemovie render session.json --engine cinematic
# → writes ./vibe-recap.mp4

# expose the render tool to your agent
vibemovie mcp
```

The default engine is **Hyperframes**: the recap is a self-contained animated
HTML page rendered fully **offline** — **zero API keys**, no network, nothing
leaves your machine. The **cinematic** engine is opt-in and BYO-key (below);
local-first stays the default.

## Cinematic engine (BYO key)

`--engine cinematic` turns the session into a real gen-video mp4: a cinematic
character short of your session, narrated beat-by-beat. The pipeline (per the
validated `launch-video-generation` recipe):

1. one storyboard beat per scene — keyframe prompt + motion prompt + VO line
2. `seedream-v4` wide hero + crisp face headshot (identity anchors)
3. `flux-kontext-max` keyframes, LOCK'd to the hero for character/set consistency
4. `kling-v2.5-turbo-pro` chained clips — each clip's first frame is the previous
   clip's last frame, so cuts are seamless
5. `video-face-swap` identity lock over the whole cut, then one unified color grade
6. ElevenLabs `eleven-v3` voiceover, one line per beat, mixed over a room-tone bed

Requirements:

- **`WAVESPEED_API_KEY`** in the environment (ElevenLabs runs through wavespeed
  too, so the one key covers everything). Nothing is sent out without it.
- **`ffmpeg`** on PATH (normalize / concat / grade / mux) and node ≥ 18.

If either is missing, vibemovie prints why and **falls back to Hyperframes** —
never a hard failure, never egress without a key. Cost is pay-as-you-go on your
own wavespeed account (~$2–3 per ~30s video at the time of writing).

Input is a JSON array of events (or `{ "events": [...] }`):

```json
[
  { "kind": "task-done", "ts": 1769500000000, "agent": "claude-code", "cwd": "/repo/demo",
    "payload": { "label": "Refactor auth middleware", "durationMin": 18 } },
  { "kind": "tests-pass", "ts": 1769503600000, "payload": { "passed": 42 } },
  { "kind": "pr-merged", "ts": 1769505100000, "payload": { "pr": 42, "branch": "main" } }
]
```

Library usage:

```ts
import { renderMovie } from 'vibemovie-cli';

const { html, path } = await renderMovie(events, {
  ratio: '16:9',            // '16:9' | '9:16' | '1:1'
  template: 'documentary',  // 'documentary' | 'speedrun' | 'meme'
  out: 'recap.html',        // optional — omit to just get the HTML string
});

// gen-video tier (needs WAVESPEED_API_KEY + ffmpeg; falls back to HTML otherwise)
const video = await renderMovie(events, { engine: 'cinematic', out: 'recap.mp4' });
// video.engine tells you which engine actually ran
```

`buildScenes(events)` (events → scene list) and `renderHyperframes(scenes)` (scene list → HTML) are pure and exported for custom pipelines; `deriveBeats(scenes)` exposes the cinematic storyboard (keyframe/motion/VO prompts) without spending anything.

## Why Build This

- VibeReplay captures sessions — VibeMovie turns them into stories
- "I built a SaaS in 4 hours" is interesting — a cinematic version of it is unforgettable
- Content creators spend hours editing coding videos — this automates the entire pipeline
- Every VibeMovie shared is a viral ad for the tool
- Think: AI-generated documentary of your coding process

## Features

- **Story arc** — AI analyzes your session and creates a narrative: setup, struggle, breakthrough, deploy
- **Cinematic editing** — Automatic cuts, zooms, transitions, and focus on the interesting parts
- **AI narration** — Generated voiceover that explains the journey: "At minute 23, everything broke..."
- **Dynamic soundtrack** — Music that matches the emotional arc (powered by VibeRadio engine)
- **Code highlights** — Key code snippets rendered beautifully with syntax highlighting and annotations
- **Stats overlay** — Lines of code, files changed, tokens used, time elapsed
- **Chapters** — Auto-generated based on git commits and milestones
- **Multiple formats** — YouTube (16:9), X/TikTok (9:16), LinkedIn (1:1), GIF summary
- **Thumbnail generation** — AI-generated thumbnail optimized for clicks
- **Templates** — Documentary, tutorial, speedrun, meme

## Generation engine (cascade)

Video generation follows the shared `@vibe/core` cascade so it always works:

1. **Your existing model** — if your agent's provider does video (e.g. Sora via your
   OpenAI), use it.
2. **A video-gen key you bring** — shipped: the **cinematic** engine on wavespeed
   (`--engine cinematic`, `WAVESPEED_API_KEY`). Replicate or similar can slot in here.
3. **Hyperframes fallback** — pure HTML/CSS/JS animated "video" (a rendered,
   animated web page). No generative-video model, no key, no network — always
   available. (The prototype below _is_ a working Hyperframes recap.)

Options across all tiers: **sync/live** (scenes build as the agent works) or
**async** (rendered after a turn/session) — user-configurable per hook · **aspect
ratios** 16:9 / 9:16 / 1:1 / GIF · **sound on/off** (soundtrack via the VibeRadio
engine + optional narration) · **subtitles/captions** · **transitions & templates**
(documentary, tutorial, speedrun, meme) · **avatar narrator** — if you've set up a
personal likeness/voice (e.g. HeyGen, or an on-device avatar), the recap can be
narrated by your avatar instead of an abstract summary.

## Distribution

- **CLI** — `vibemovie render session.json` (today) · `--session <id>` / `--repo .` (planned)
- **npm package** — `npm install -g vibemovie-cli`
- **MCP server** — `vibemovie mcp` exposes a `render` tool your agent can call
- **Claude Code skill** — `/vibemovie` to render your last session
- **skills.sh** — Listed on skills.sh marketplace
- **Web app** — Upload a git repo, get a movie of its entire history

## Tech Stack

- Node.js + TypeScript
- Remotion (video rendering)
- Claude API (narrative generation, story arc)
- ElevenLabs (voiceover)
- Tone.js (soundtrack — shared with VibeRadio)
- FFmpeg (post-processing)

## Prototype

Interactive, self-contained UX prototype (no build, no network): open
[`docs/prototype.html`](docs/prototype.html) in a browser — it plays a real
Hyperframes recap with a working scrubber, the cascade selector, and an avatar
narrator toggle.

## Local-first

Runs on your own machine. The Hyperframes tier renders fully offline; nothing leaves
your machine unless you opt into a hosted video model. Enforced by the `@vibe/core`
consent model.

## Vibe Suite

Part of the **Vibe Suite** — companion tools for agentic coding CLIs (Claude Code,
Codex, Cursor, Gemini, Grok, pi, Kimi, and other harnesses). Ships as **CLI + npm
package + MCP server**.

## Relationship to VibeReplay

- **VibeReplay** = raw capture + timelapse (quick, functional)
- **VibeMovie** = cinematic, narrated, story-driven (polished, shareable)
- VibeMovie can use VibeReplay recordings as input

## Revenue Potential

- Free tier: 1 movie/month, watermarked, 720p
- Pro: unlimited, 4K, custom branding, all templates
- Studio: team movies, custom narration voice, API access
