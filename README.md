# VibeMovie

**Your vibe coding session, as a movie.**

Transforms your AI-assisted coding activity into a cinematic, narrated video — complete with chapters, a storyline, dramatic music, and visual effects. Not a screen recording. A movie.

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

## Distribution

- **CLI** — `vibemovie render --session <id>` or `vibemovie render --repo .`
- **npm package** — `npm install -g vibemovie`
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

## Relationship to VibeReplay

- **VibeReplay** = raw capture + timelapse (quick, functional)
- **VibeMovie** = cinematic, narrated, story-driven (polished, shareable)
- VibeMovie can use VibeReplay recordings as input

## Revenue Potential

- Free tier: 1 movie/month, watermarked, 720p
- Pro: unlimited, 4K, custom branding, all templates
- Studio: team movies, custom narration voice, API access
