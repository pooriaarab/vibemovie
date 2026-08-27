import type { Ratio } from './scenes.js';

function cssPrefix(): string {
  return `
  :root{
    --bg: #0a0908; --bg-raised: #14120e; --frame: #050403;
    --ink: #f2ede1; --ink-dim: #a89e8c; --ink-faint: #6b6255;
    --gold: #d9a94e; --add: #7fae8a; --remove: #b25a45; --merge: #a084d6;
    --ease: cubic-bezier(0.16, 1, 0.3, 1); --radius: 14px;
  }
  *{ box-sizing: border-box; }
  html,body{ margin:0; padding:0; min-height:100%; background: var(--bg); color: var(--ink);
    font-family: -apple-system, "SF Pro Text", "Segoe UI", Roboto, system-ui, sans-serif;
    -webkit-font-smoothing: antialiased; }
  body{ padding: 40px 20px 64px; display:flex; justify-content:center; }
  .stage{ width:100%; max-width: 900px; }
  .topbar{ display:flex; align-items:baseline; justify-content:space-between; margin-bottom: 22px; flex-wrap: wrap; gap: 10px; }
  .wordmark{ font-size: 1.35rem; font-weight: 700; letter-spacing: -0.03em; }
  .wordmark b{ font-weight: 700; color: var(--gold); }
  .tagline{ display:block; font-size: 0.78rem; color: var(--ink-faint); margin-top: 2px; }
  .badge-local{ display:inline-flex; align-items:center; gap:7px; font-size: 0.72rem; font-weight: 600;
    color: var(--ink-dim); background: var(--bg-raised); border: 1px solid #262019;
    padding: 6px 12px; border-radius: 999px; white-space: nowrap; }
  .badge-local .dot{ width:7px; height:7px; border-radius:50%; background: #7fc98a; }
  @media (prefers-reduced-motion: no-preference){
    .badge-local .dot{ animation: pulse-dot 2.4s var(--ease) infinite; }
  }
  @keyframes pulse-dot{ 0%{ box-shadow: 0 0 0 0 rgba(127,201,138,0.45);} 70%{ box-shadow: 0 0 0 6px rgba(127,201,138,0);} 100%{ box-shadow: 0 0 0 0 rgba(127,201,138,0);} }
  .player{ position: relative; background: var(--frame); border-radius: var(--radius);
    box-shadow: 0 24px 60px -20px rgba(0,0,0,0.75), 0 2px 0 rgba(255,255,255,0.02) inset;
    overflow: hidden; border: 1px solid #201a12; }
  .filmstrip{ height: 12px; background-color: #171009;
    background-image: radial-gradient(circle 3.2px at 12px 6px, var(--bg) 3.2px, transparent 3.6px);
    background-size: 24px 12px; background-repeat: repeat-x; }
  `;
}

function cssAfter1(): string {
  return `
    background: radial-gradient(120% 100% at 50% 0%, #171008 0%, #0a0705 60%, #050302 100%); }
  .screen::before{ content:""; position:absolute; inset:0; pointer-events:none; z-index: 5;
    box-shadow: inset 0 0 90px 20px rgba(0,0,0,0.55); }
  .scene{ position:absolute; inset:0; display:none; flex-direction:column; align-items:center;
    justify-content:center; text-align:center; padding: 8% 9%; will-change: transform, opacity; }
  .scene.is-live{ display:flex; }
  .reel{ position:absolute; top:8%; right:6%; width: 90px; height: 90px; opacity: .16; }
  @media (prefers-reduced-motion: no-preference){ .reel{ animation: spin 26s linear infinite; } }
  @keyframes spin{ to{ transform: rotate(360deg); } }
  .session-title{ font-size: clamp(1.6rem, 4.4vw, 2.7rem); font-weight: 700; letter-spacing: -0.03em; margin: 0 0 10px; }
  .session-sub{ font-family: "SF Mono", "Menlo", monospace; font-size: clamp(1rem, 2.6vw, 1.35rem);
    color: var(--gold); font-weight: 600; letter-spacing: -0.01em; }
  .session-caption{ margin-top: 14px; font-size: 0.82rem; color: var(--ink-faint); }
  .tasks-head{ font-size: clamp(1.3rem, 3.4vw, 2rem); font-weight: 700; letter-spacing: -0.03em; margin-bottom: 22px; }
  .tasks-head b{ color: var(--gold); font-size: 1.25em; }
  .task-list{ width: min(440px, 84%); display:flex; flex-direction:column; gap: 12px; }
  .task-row{ display:flex; align-items:center; gap: 12px; text-align:left; padding: 10px 4px; border-bottom: 1px solid #201a12; }
  .task-row:last-child{ border-bottom: none; }
  .task-row .tick{ flex: none; }
  .task-row .label{ flex:1; font-size: 0.92rem; color: var(--ink); }
  .task-row .dur{ font-family: "SF Mono", Menlo, monospace; font-size: 0.74rem; color: var(--ink-faint); }
  .task-more{ font-size: 0.8rem; color: var(--ink-faint); text-align:left; padding: 6px 4px 0 32px; }
  .diff-head{ font-size: clamp(1.3rem, 3.4vw, 2rem); font-weight: 700; letter-spacing: -0.03em; margin-bottom: 20px; }
  .diff-bar-wrap{ width: min(440px, 84%); }
  .diff-bar{ height: 14px; border-radius: 7px; overflow:hidden; display:flex; background: #1a140d; }
  .diff-bar .add{ background: var(--add); height:100%; width:0%; }
  .diff-bar .remove{ background: var(--remove); height:100%; width:0%; }
`;
}

function cssAfter2(): string {
  return `  .diff-stats{ margin-top: 10px; font-family: "SF Mono", Menlo, monospace; font-size: 0.9rem; display:flex; gap: 16px; justify-content:center; }
  .diff-stats .plus{ color: var(--add); }
  .diff-stats .minus{ color: var(--remove); }
  .diff-files{ margin-top: 18px; display:flex; flex-direction:column; gap: 6px; align-items:center; }
  .diff-files .f{ font-family: "SF Mono", Menlo, monospace; font-size: 0.74rem; color: var(--ink-dim); opacity: 0; transform: translateY(8px); }
  .terminal{ width: min(460px, 88%); background: #0d0b08; border: 1px solid #241d14; border-radius: 10px;
    overflow:hidden; text-align:left; box-shadow: 0 14px 34px -16px rgba(0,0,0,0.7); }
  .terminal-bar{ display:flex; align-items:center; gap:6px; padding: 8px 10px; background: #161109; border-bottom: 1px solid #241d14; }
  .terminal-bar span{ width:9px; height:9px; border-radius:50%; background:#3a3024; }
  .terminal-bar .name{ margin-left: 8px; font-size: 0.7rem; color: var(--ink-faint); font-family: "SF Mono", Menlo, monospace; }
  .terminal-body{ padding: 14px 16px; font-family: "SF Mono", Menlo, monospace; font-size: 0.78rem;
    line-height: 1.7; min-height: 108px; color: var(--ink-dim); }
  .terminal-body .ok{ color: var(--add); }
  .terminal-body .cursor{ display:inline-block; width: 6px; height: 12px; background: var(--gold); vertical-align: -2px; margin-left: 2px; }
  @media (prefers-reduced-motion: no-preference){ .terminal-body .cursor.blink{ animation: blink 1s steps(1) infinite; } }
  @keyframes blink{ 50%{ opacity: 0; } }
  .merge-badge{ width: 74px; height: 74px; margin-bottom: 14px; color: var(--merge); }
  .merge-head{ font-size: clamp(1.3rem, 3.4vw, 2rem); font-weight:700; letter-spacing:-0.03em; }
  .merge-sub{ margin-top: 6px; font-size: 0.85rem; color: var(--ink-dim); }
  .confetti{ position:absolute; inset:0; pointer-events:none; overflow:hidden; }
  .confetti i{ position:absolute; top:-10%; width: 7px; height: 12px; opacity:0; border-radius: 2px; }
  .confetti.is-firing i{ animation: fall 1.8s ease-in forwards; }
  @keyframes fall{ 0%{ opacity: 1; transform: translateY(0) rotate(0deg);} 100%{ opacity: 0; transform: translateY(220px) rotate(300deg);} }
  .end-mark{ font-size: clamp(1.4rem, 3.6vw, 2.2rem); font-weight:700; letter-spacing:-0.03em; }
  .end-mark b{ color: var(--gold); }
  .end-sub{ margin-top: 8px; font-size: 0.8rem; color: var(--ink-faint); }
  .loop-icon{ width: 26px; height: 26px; margin-top: 16px; color: var(--ink-faint); }
  @media (prefers-reduced-motion: no-preference){ .loop-icon{ animation: spin 3.5s linear infinite; } }
`;
}

function cssAfter3(): string {
  return `  .scene-title{ position:absolute; left: 20px; bottom: 18px; z-index: 6; font-size: 0.72rem; font-weight: 600;
    letter-spacing: 0.02em; color: var(--ink-dim); background: rgba(5,4,3,0.55); backdrop-filter: blur(6px);
    padding: 6px 11px; border-radius: 999px; border: 1px solid rgba(255,255,255,0.06);
    opacity: 0; transform: translateY(6px); transition: opacity .35s var(--ease), transform .35s var(--ease); }
  .scene-title.is-shown{ opacity: 1; transform: translateY(0); }
  .captions{ position: relative; z-index: 6; background: var(--bg-raised); border-top: 1px solid #201a12;
    color: var(--ink); font-size: 0.86rem; padding: 12px 18px; min-height: 20px; text-align:center; }
  .controls{ display:flex; align-items:center; gap: 12px; padding: 12px 16px;
    background: var(--bg-raised); border-top: 1px solid #201a12; }
  .icon-btn{ flex: none; width: 34px; height: 34px; border-radius: 9px; display:flex; align-items:center;
    justify-content:center; background: #201a12; border: 1px solid #2c2417; color: var(--ink); cursor: pointer;
    transition: background .16s var(--ease); }
  .icon-btn:hover{ background: #2c2417; }
  .icon-btn svg{ width: 15px; height: 15px; }
  .icon-btn:focus-visible{ outline: 2px solid var(--gold); outline-offset: 2px; }
  .time{ font-family: "SF Mono", Menlo, monospace; font-size: 0.76rem; color: var(--ink-faint); flex: none; width: 38px; }
  .time.total{ text-align: right; }
  .scrubber{ flex: 1; position: relative; height: 22px; display:flex; align-items:center; cursor: pointer; }
  .scrubber-track{ position:absolute; left:0; right:0; top: 50%; height: 4px; transform: translateY(-50%);
    background: #241d14; border-radius: 999px; overflow: hidden; }
  .scrubber-fill{ position:absolute; left:0; top:0; bottom:0; width: 0%; background: var(--gold); border-radius: 999px; }
  .scrubber-markers{ position:absolute; inset:0; }
  .scrubber-markers i{ position:absolute; top:50%; width:1px; height: 10px; background: rgba(0,0,0,0.5); transform: translate(0, -50%); }
  .scrubber-thumb{ position:absolute; top:50%; width: 11px; height:11px; border-radius:50%;
    background: var(--ink); transform: translate(-50%, -50%); box-shadow: 0 2px 6px rgba(0,0,0,0.5); }
  .foot{ margin-top: 18px; text-align:center; font-size: 0.74rem; color: var(--ink-faint); }
  @media (max-width: 560px){ .controls{ flex-wrap: wrap; } }
`;
}

function screenSizingCss(ratio: Ratio): string {
  if (ratio === '16:9') return '.screen{position:relative;aspect-ratio:16/9;overflow:hidden;';
  if (ratio === '9:16') return '.screen{position:relative;height:min(74vh,760px);width:calc(min(74vh,760px) * 9 / 16);max-width:100%;margin:0 auto;overflow:hidden;';
  return '.screen{position:relative;height:min(74vh,640px);width:calc(min(74vh,640px));max-width:100%;margin:0 auto;overflow:hidden;';
}

export function css(ratio: Ratio): string {
  return cssPrefix() + screenSizingCss(ratio) + cssAfter1() + cssAfter2() + cssAfter3();
}
