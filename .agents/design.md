# Design Context

## Overview

The canonical surface is the generated Hyperframes player.
It presents a warm, dark screening room around a sequence of coding scenes.
Use `src/hyperframes-css.ts` and `src/hyperframes.ts` as shipped source.
Use `docs/prototype.html` only for prototype-specific controls.

## Colors

Use the shipped Hyperframes variables:

- Canvas `--bg`: `#0a0908`.
- Raised surface `--bg-raised`: `#14120e`.
- Screen frame `--frame`: `#050403`.
- Primary ink `--ink`: `#f2ede1`.
- Muted ink `--ink-dim`: `#a89e8c`.
- Faint ink `--ink-faint`: `#6b6255`.
- Brand gold `--gold`: `#d9a94e`.
- Added or successful `--add`: `#7fae8a`.
- Removed `--remove`: `#b25a45`.
- Merge `--merge`: `#a084d6`.

Use literal browns only for frames, tracks, terminals, and borders already defined in source.

## Typography

- Use the system sans stack for player text.
- Use SF Mono and Menlo for code, durations, and time.
- Set the wordmark at `1.35rem`, weight `700`, with `-0.03em` tracking.
- Scale primary scene titles with `clamp(1.6rem, 4.4vw, 2.7rem)`.
- Scale secondary scene titles with `clamp(1.3rem, 3.4vw, 2rem)`.
- Keep technical text between `0.74rem` and `0.9rem`.

## Layout

- Center the stage within `900px`.
- Use `40px 20px 64px` page padding.
- Keep scene content centered with `8% 9%` padding.
- Render widescreen output at `16:9`.
- Size portrait output at `9:16`, within `74vh` and `760px`.
- Size square output within `74vh` and `640px`.
- Wrap player controls below `560px`.

## Elevation & Depth

- Place the player above the canvas with the existing dark border and compound shadow.
- Use the inset screen vignette to focus attention on each scene.
- Use raised backgrounds for captions and controls.
- Reserve the terminal shadow for the terminal scene.
- Do not introduce bright glass effects or dashboard-style panels.

## Shapes

- Use the `14px` root radius for the player.
- Use `10px` corners for terminal shells.
- Use `9px` corners for control buttons.
- Use full pills for badges, scene labels, and progress tracks.
- Use circles for status dots and scrubber thumbs.
- Keep confetti as small `2px`-radius rectangles.

## Components

- Topbar: wordmark, tagline, and local-status badge.
- Filmstrip: repeated sprocket pattern above the screen.
- Screen: one visible scene within the selected aspect ratio.
- Scenes: title, tasks, diff, terminal, merge, and ending.
- Captions: centered narrative text below the screen.
- Controls: play button, current time, scrubber, and total time.
- Footer: quiet local-rendering statement.
- Prototype controls: cascade, avatar, and trigger controls stay prototype-only.

## Do's and Don'ts

- Do keep each scene focused on one narrative beat.
- Do embed required data and assets in local Hyperframes output.
- Do keep animations behind `prefers-reduced-motion: no-preference`.
- Do preserve keyboard focus styles for controls.
- Do keep status colors tied to their semantic roles.
- Don't turn the player into a metrics dashboard.
- Don't load remote fonts, scripts, or assets in Hyperframes output.
- Don't present roadmap features as shipped behavior.
- Don't invent a production domain without deployment evidence.
