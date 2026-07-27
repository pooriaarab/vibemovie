# WORKER BRIEF — vibemovie `cinematic` engine (BYO gen-video)

Add a second render engine to **vibemovie** so a coding session becomes a real gen-video, not just the offline Hyperframes HTML. Local-first stays the default; cinematic is opt-in and BYO-key.

## Context / reference (READ FIRST)
- The validated pipeline recipe: `pooriaarab/skills` → `launch-video-generation/SKILL.md`, section **"Validated pipeline: cinematic character video"**. Follow it exactly.
- Working reference implementation (canonical — copy the model IDs, params, ffmpeg filters, poll logic from these): `./.reference/chain.mjs` (keyframes → Kling first+last chain → face-swap → grade), `./.reference/vo-chain.mjs` (ElevenLabs V3 VO + mix), `./.reference/gemini-critique.mjs` (optional QC).
- Existing engine seam: `src/index.ts` (`renderMovie`), `src/hyperframes.ts` (the current engine), `src/scenes.ts` (`buildScenes` — session events → beats). MCP in `src/mcp.ts`, CLI in `src/cli.ts`.

## Build
1. **`src/cinematic.ts`** — new engine. Input: the scenes/beats from `buildScenes` + options. Pipeline (from the reference): derive ~6 keyframe prompts from the session beats → seedream-v4 hero + face headshot → flux-kontext-max 6 keyframes (LOCK string for consistency) → Kling 2.5 turbo pro first+last chained clips (`image`+`last_image`) → wavespeed video-face-swap identity lock → ffmpeg color grade → ElevenLabs eleven-v3 VO synced per beat → mux. Output an mp4 path.
2. **Keys / local-first**: read `WAVESPEED_API_KEY` (and ElevenLabs via wavespeed) from env. If absent, print a clear message and **fall back to Hyperframes** — never fail hard, never send data out without keys.
3. **CLI**: add `--engine hyperframes|cinematic` (default `hyperframes`) to `src/cli.ts`. Wire into `renderMovie` in `src/index.ts` and expose via `src/mcp.ts`.
4. **Tests** (vitest, matching repo style): unit-test prompt derivation + engine selection + the no-keys fallback. **Mock all network/API calls — never hit real APIs in tests.** All existing tests must still pass; `npm run build` + `npm run typecheck` must pass.

## Constraints
- TypeScript, match existing style. No secrets committed. `node`/`ffmpeg` allowed as runtime deps for cinematic (document them). Keep Hyperframes path untouched and keyless.

## Deliverable — DO NOT open or merge PRs
Branch `cinematic-engine`, implement, run tests + build, commit, `git push -u origin cinematic-engine`. Report files changed + test/build output. Leave PR/merge to the human reviewer.
