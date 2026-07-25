# vibemovie — spec

Status: DRAFT (Opus-authored) · 2026-07-25 · depends on `@vibe/core`
Identity: vibemovie.dev (available $12/yr) · ships CLI + npm + MCP

## What it is
An agentic coding session as a short **recap video** — a story (setup → struggle →
breakthrough → ship), not a screen recording. Video counterpart to viberadio.

## Model cascade (video capability, `@vibe/core` §2)
1. agent's existing model if it does video (Sora via your OpenAI) → 2. a video-gen
key you bring (Wavespeed, Replicate, …) → 3. **Hyperframes** = pure HTML/CSS/JS
animated "video" (rendered animated web page). No gen-video model, no key, no network
— always works. The v0 default and the guaranteed floor.

## Options (all user-configurable)
- **Timing (§4c):** sync/live (scenes build as the agent works) or async (rendered
  after a turn/session).
- **Aspect ratio:** 16:9 (YouTube) · 9:16 (X/TikTok) · 1:1 (LinkedIn) · GIF.
- **Sound:** on/off — soundtrack via the viberadio engine + optional narration.
- **Subtitles/captions**, **transitions**, **templates** (documentary / tutorial /
  speedrun / meme), **thumbnail** generation.
- **Avatar narrator:** if the user set up a personal likeness/voice (HeyGen, or an
  on-device avatar), the recap is narrated by their avatar vs an abstract summary.
  Avatar generation is its own capability in the cascade (BYO HeyGen key → on-device
  stylized avatar fallback).

## Hyperframes (the fallback that carries v0)
A scene engine: session data → a timeline of animated scenes (title card, task
ticks, animated diff, terminal moment, "PR merged" celebration, end card) rendered
as deterministic HTML/CSS/JS. Scrubbable (any timestamp → correct in-between state).
Exportable to real video via headless-browser capture (Remotion/Playwright) when the
user wants an .mp4; otherwise it's a shareable self-contained page. **The prototype
is a working Hyperframes demo** — it's the real v0 renderer, not a mock.

## Triggers (`@vibe/core` §3)
PR opened · prototype finished · spec completed · session end · manual
(`vibemovie render`). Each `(timing, off|ask|auto)`.

## Surfaces
- **CLI:** `vibemovie render [--session id | --repo .] [--ratio 9:16] [--template
  speedrun] [--engine hyperframes|sora]` · `vibemovie config`.
- **npm:** `renderMovie({events, ratio, template, engine, avatar})` → page or .mp4.
- **MCP:** `vibemovie.render`, `vibemovie.preview` — agent can offer "movie of this?"
- **Web app** (post-v0): upload a repo → movie of its history.

## Cross-harness & local-first
Events via normalized `VibeEvent` (works across all harnesses, §4b). Hyperframes tier
renders 100% offline; hosted models only on explicit consent (§4). Existing repo
README's richer feature set (story arc, code highlights, stats overlay, chapters) all
sit on top of this engine.

## Open questions
- Live/sync video is expensive on gen-models — sync tier defaults to Hyperframes;
  gen-model tiers default to async render.
- Avatar likeness is a real-person surface → consent + "this is your avatar" gating;
  never fabricate a likeness the user didn't set up.
- .mp4 export needs a headless browser dependency — offer as opt-in install, keep the
  page-only path dependency-free.
