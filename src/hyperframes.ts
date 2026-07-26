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

import { formatMinutes } from './scenes.js';
import type { Ratio, Scene } from './scenes.js';

export interface RenderOptions {
  /** Player aspect ratio. Default '16:9'. */
  ratio?: Ratio;
  /** Document <title>. Default: the session name from the title scene. */
  title?: string;
}

/** Escape text interpolated into HTML markup. */
export function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

/** JSON that is safe to embed inside a <script> block (no `<`, no U+2028/29). */
function embedJson(value: unknown): string {
  return JSON.stringify(value)
    .replace(/</g, '\\u003c')
    .replace(/\u2028/g, '\\u2028')
    .replace(/\u2029/g, '\\u2029');
}

const TICK_SVG =
  '<svg class="tick" width="20" height="20" viewBox="0 0 20 20" fill="none">' +
  '<circle cx="10" cy="10" r="9" stroke="#3a3024" stroke-width="1.4"/>' +
  '<path d="M5.5 10.2l3 3 6-6.4" stroke="#7fae8a" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" pathLength="1" stroke-dasharray="1" stroke-dashoffset="1"/>' +
  '</svg>';

function sceneHtml(scene: Scene): string {
  switch (scene.kind) {
    case 'title': {
      const d = scene.data;
      return (
        `<section class="scene" id="${scene.id}">` +
        '<svg class="reel" viewBox="0 0 100 100" fill="none" stroke="currentColor" stroke-width="2">' +
        '<circle cx="50" cy="50" r="46"/>' +
        '<circle cx="50" cy="20" r="9"/><circle cx="76" cy="65" r="9"/><circle cx="24" cy="65" r="9"/>' +
        '<circle cx="50" cy="50" r="6" fill="currentColor" stroke="none"/>' +
        '</svg>' +
        `<div class="session-title">${escapeHtml(d.sessionName)}</div>` +
        '<div class="session-sub" id="titleCounter">0h 00m</div>' +
        `<div class="session-caption">${escapeHtml(d.subtitle)}</div>` +
        '</section>'
      );
    }
    case 'tasks': {
      const d = scene.data;
      const rows = d.tasks
        .map((t) => {
          const dur = t.durationMin !== undefined ? `<span class="dur">${escapeHtml(formatMinutes(t.durationMin))}</span>` : '';
          return `<div class="task-row">${TICK_SVG}<span class="label">${escapeHtml(t.label)}</span>${dur}</div>`;
        })
        .join('');
      const more = d.total > d.tasks.length ? `<div class="task-more">+${d.total - d.tasks.length} more</div>` : '';
      return (
        `<section class="scene" id="${scene.id}">` +
        `<div class="tasks-head"><b>${d.total}</b> ${d.total === 1 ? 'task' : 'tasks'} completed</div>` +
        `<div class="task-list">${rows}${more}</div>` +
        '</section>'
      );
    }
    case 'diff': {
      const d = scene.data;
      const files = d.files.map((f) => `<div class="f">${escapeHtml(f)}</div>`).join('');
      const more = d.filesChanged > d.files.length ? `<div class="f">+${d.filesChanged - d.files.length} more</div>` : '';
      return (
        `<section class="scene" id="${scene.id}">` +
        `<div class="diff-head">${d.filesChanged} ${d.filesChanged === 1 ? 'file' : 'files'} changed</div>` +
        '<div class="diff-bar-wrap">' +
        '<div class="diff-bar"><div class="add" id="diffAdd"></div><div class="remove" id="diffRemove"></div></div>' +
        `<div class="diff-stats"><span class="plus">+${d.additions}</span><span class="minus">−${d.deletions}</span></div>` +
        '</div>' +
        `<div class="diff-files" id="diffFiles">${files}${more}</div>` +
        '</section>'
      );
    }
    case 'terminal': {
      return (
        `<section class="scene" id="${scene.id}">` +
        '<div class="terminal">' +
        '<div class="terminal-bar"><span></span><span></span><span></span><span class="name">vibe — zsh</span></div>' +
        '<div class="terminal-body" id="termBody"></div>' +
        '</div>' +
        '</section>'
      );
    }
    case 'merge': {
      const d = scene.data;
      const head = d.pr !== null ? `PR #${d.pr} ${d.merged ? 'merged' : 'opened'}` : `PR ${d.merged ? 'merged' : 'opened'}`;
      const sub = `into ${escapeHtml(d.branch)}` + (d.reviewers !== null ? ` · reviewed by ${d.reviewers}` : '');
      return (
        `<section class="scene" id="${scene.id}">` +
        '<svg class="merge-badge" id="mergeBadge" viewBox="0 0 48 48" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round">' +
        '<circle cx="14" cy="12" r="4"/><circle cx="14" cy="36" r="4"/><circle cx="34" cy="12" r="4"/>' +
        '<path d="M14 16v12a8 8 0 0 0 8 8h4"/><path d="M34 16v4"/>' +
        '</svg>' +
        `<div class="merge-head">${escapeHtml(head)}</div>` +
        `<div class="merge-sub">${sub}</div>` +
        '<div class="confetti" id="confetti"></div>' +
        '</section>'
      );
    }
    case 'end': {
      const d = scene.data;
      return (
        `<section class="scene" id="${scene.id}">` +
        '<div class="end-mark">vibe<b>movie</b></div>' +
        `<div class="end-sub">${escapeHtml(d.tagline)}</div>` +
        '<svg class="loop-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round">' +
        '<path d="M17 2l4 4-4 4"/><path d="M3 12v-2a4 4 0 0 1 4-4h14"/>' +
        '<path d="M7 22l-4-4 4-4"/><path d="M21 12v2a4 4 0 0 1-4 4H3"/>' +
        '</svg>' +
        '</section>'
      );
    }
  }
}

function css(ratio: Ratio): string {
  const screenSizing =
    ratio === '16:9'
      ? '.screen{position:relative;aspect-ratio:16/9;overflow:hidden;'
      : ratio === '9:16'
        ? '.screen{position:relative;height:min(74vh,760px);width:calc(min(74vh,760px) * 9 / 16);max-width:100%;margin:0 auto;overflow:hidden;'
        : '.screen{position:relative;height:min(74vh,640px);width:calc(min(74vh,640px));max-width:100%;margin:0 auto;overflow:hidden;';
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
  ${screenSizing}
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
  .diff-stats{ margin-top: 10px; font-family: "SF Mono", Menlo, monospace; font-size: 0.9rem; display:flex; gap: 16px; justify-content:center; }
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
  .scene-title{ position:absolute; left: 20px; bottom: 18px; z-index: 6; font-size: 0.72rem; font-weight: 600;
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

/**
 * The playback engine, serialized into the page. Written in ES5-style JS with
 * string concatenation only (no template literals) so it can live inside the
 * TypeScript template literal below without escaping hazards.
 */
function engineJs(scenesJson: string): string {
  return `
(function(){
"use strict";
var SCENES = ${scenesJson};
var offsets = []; var acc = 0; var i;
for (i = 0; i < SCENES.length; i++) { offsets.push(acc); acc += SCENES[i].duration; }
var TOTAL = acc;

var els = {};
for (i = 0; i < SCENES.length; i++) { els[SCENES[i].id] = document.getElementById(SCENES[i].id); }

var sceneTitleEl = document.getElementById('sceneTitle');
var captionsEl   = document.getElementById('captions');
var playBtn      = document.getElementById('playBtn');
var playIcon     = document.getElementById('playIcon');
var scrubber     = document.getElementById('scrubber');
var scrubberFill = document.getElementById('scrubberFill');
var scrubberThumb= document.getElementById('scrubberThumb');
var scrubberMarkers = document.getElementById('scrubberMarkers');
var timeCurrent  = document.getElementById('timeCurrent');
var timeTotal    = document.getElementById('timeTotal');

for (i = 1; i < SCENES.length; i++) {
  var m = document.createElement('i');
  m.style.left = (offsets[i] / TOTAL * 100) + '%';
  scrubberMarkers.appendChild(m);
}

function fmt(ms){
  var s = Math.floor(ms/1000);
  var m = Math.floor(s/60); s = s%60;
  return m + ':' + (s<10?'0':'') + s;
}
timeTotal.textContent = fmt(TOTAL);

function esc(s){
  return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}
function easeOutExpo(x){ return x >= 1 ? 1 : 1 - Math.pow(2, -10*x); }
function easeOutBack(x){ var c1 = 1.7, c3 = c1+1; return 1 + c3*Math.pow(x-1,3) + c1*Math.pow(x-1,2); }
function clamp(v,a,b){ return Math.max(a, Math.min(b, v)); }

/* deterministic PRNG so confetti is identical on every play */
function mulberry32(a){
  return function(){
    a |= 0; a = a + 0x6D2B79F5 | 0;
    var t = Math.imul(a ^ a >>> 15, 1 | a);
    t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
    return ((t ^ t >>> 14) >>> 0) / 4294967296;
  };
}
var rand = mulberry32(12648430);
var confettiColors = ['#d9a94e','#7fae8a','#b25a45','#a084d6'];
function buildConfetti(){
  var c = document.getElementById('confetti');
  if (!c) return;
  c.innerHTML = '';
  for (var j = 0; j < 16; j++) {
    var el = document.createElement('i');
    el.style.left = (8 + rand()*84) + '%';
    el.style.background = confettiColors[j % confettiColors.length];
    el.style.animationDelay = (rand()*0.5) + 's';
    el.style.transform = 'rotate(' + Math.floor(rand()*360) + 'deg)';
    c.appendChild(el);
  }
}
buildConfetti();

var CPS = 34; /* terminal typing speed, chars per second */

var renderers = {
  title: function(scene, localT){
    var el = document.getElementById('titleCounter');
    var totalMin = Math.round(scene.data.totalMinutes * easeOutExpo(clamp(localT/2400, 0, 1)));
    var h = Math.floor(totalMin/60), m = totalMin%60;
    el.textContent = h + 'h ' + (m<10?'0':'') + m + 'm';
  },
  tasks: function(scene, localT){
    var rows = els[scene.id].querySelectorAll('.task-row');
    for (var j = 0; j < rows.length; j++) {
      var start = 450 + j*380;
      var p = easeOutExpo(clamp((localT-start)/420, 0, 1));
      var row = rows[j];
      row.style.opacity = p;
      row.style.transform = 'translateY(' + ((1-p)*14) + 'px)';
      row.querySelector('.tick path').setAttribute('stroke-dashoffset', String(1-p));
    }
  },
  diff: function(scene, localT){
    var adds = scene.data.additions, dels = scene.data.deletions;
    var total = adds + dels;
    var p = easeOutExpo(clamp((localT-350)/900, 0, 1));
    document.getElementById('diffAdd').style.width = (p * (total > 0 ? adds/total : 0) * 100) + '%';
    document.getElementById('diffRemove').style.width = (p * (total > 0 ? dels/total : 0) * 100) + '%';
    var files = document.getElementById('diffFiles').querySelectorAll('.f');
    for (var j = 0; j < files.length; j++) {
      var start = 500 + j*160;
      var fp = easeOutExpo(clamp((localT-start)/300, 0, 1));
      files[j].style.opacity = fp;
      files[j].style.transform = 'translateY(' + ((1-fp)*8) + 'px)';
    }
  },
  terminal: function(scene, localT){
    var lines = scene.data.lines;
    var out = '';
    var t0 = 250;
    for (var j = 0; j < lines.length; j++) {
      var elapsed = localT - t0;
      t0 += (lines[j].text.length / CPS) * 1000 + 260;
      if (elapsed <= 0) continue;
      var chars = Math.min(lines[j].text.length, Math.floor(elapsed/1000*CPS));
      var shown = esc(lines[j].text.slice(0, chars));
      var typing = chars < lines[j].text.length;
      var cls = lines[j].cls ? ' class="' + lines[j].cls + '"' : '';
      out += '<div' + cls + '>' + shown + (typing ? '<span class="cursor blink"></span>' : '') + '</div>';
    }
    document.getElementById('termBody').innerHTML = out;
  },
  merge: function(scene, localT, justEntered){
    var p = easeOutBack(clamp(localT/480, 0, 1));
    var badge = document.getElementById('mergeBadge');
    badge.style.transform = 'scale(' + Math.max(0,p) + ') rotate(' + ((1-clamp(localT/480,0,1))*-10) + 'deg)';
    if (justEntered) {
      var c = document.getElementById('confetti');
      c.classList.remove('is-firing');
      void c.offsetWidth;
      c.classList.add('is-firing');
    }
  },
  end: function(){}
};

function sceneIndexAt(time){
  for (var j = SCENES.length-1; j >= 0; j--) { if (time >= offsets[j]) return j; }
  return 0;
}

function applyTransition(el, type, localT, dur){
  var inWin = Math.min(560, dur*0.28);
  var outWin = Math.min(560, dur*0.28);
  var opacity = 1, tf = 'none';
  if (localT < inWin) {
    var p = easeOutExpo(localT/inWin);
    if (type==='fade'){ opacity=p; tf = 'scale(' + (0.98+0.02*p) + ')'; }
    else if (type==='slide'){ opacity=p; tf = 'translateX(' + ((1-p)*44) + 'px)'; }
    else if (type==='scale'){ opacity=p; tf = 'scale(' + (0.9+0.1*p) + ')'; }
    else if (type==='rise'){ opacity=p; tf = 'translateY(' + ((1-p)*40) + 'px)'; }
  } else if (localT > dur-outWin) {
    var p2 = easeOutExpo((localT-(dur-outWin))/outWin);
    var q = 1-p2;
    if (type==='fade'){ opacity=q; tf = 'scale(' + (1-0.02*p2) + ')'; }
    else if (type==='slide'){ opacity=q; tf = 'translateX(' + (-p2*44) + 'px)'; }
    else if (type==='scale'){ opacity=q; tf = 'scale(' + (1-0.1*p2) + ')'; }
    else if (type==='rise'){ opacity=q; tf = 'translateY(' + (-p2*40) + 'px)'; }
  }
  el.style.opacity = opacity;
  el.style.transform = tf;
}

var isPlaying = true;
var t = 0;
var lastSceneIdx = -1;
var lastFrame = null;

function render(){
  var idx = sceneIndexAt(t);
  var scene = SCENES[idx];
  var localT = t - offsets[idx];
  var justEntered = idx !== lastSceneIdx;

  for (var j = 0; j < SCENES.length; j++) {
    var el = els[SCENES[j].id];
    if (j === idx) {
      el.classList.add('is-live');
      applyTransition(el, SCENES[j].transition, localT, SCENES[j].duration);
    } else {
      el.classList.remove('is-live');
    }
  }

  renderers[scene.kind](scene, localT, justEntered);

  if (justEntered) {
    sceneTitleEl.textContent = scene.kind.replace(/^\\w/, function(c){ return c.toUpperCase(); });
    sceneTitleEl.classList.add('is-shown');
    captionsEl.textContent = scene.caption;
  }
  lastSceneIdx = idx;

  var pct = (t/TOTAL*100);
  scrubberFill.style.width = pct + '%';
  scrubberThumb.style.left = pct + '%';
  timeCurrent.textContent = fmt(t);
}

function loop(ts){
  if (lastFrame === null) lastFrame = ts;
  var dt = ts - lastFrame;
  lastFrame = ts;
  if (isPlaying) { t += dt; if (t >= TOTAL) t = t % TOTAL; }
  render();
  requestAnimationFrame(loop);
}
requestAnimationFrame(loop);

function setPlaying(v){
  isPlaying = v;
  playBtn.setAttribute('aria-label', v ? 'Pause' : 'Play');
  playIcon.innerHTML = v
    ? '<rect x="3" y="2" width="4" height="12" rx="1"/><rect x="9" y="2" width="4" height="12" rx="1"/>'
    : '<path d="M4 2l10 6-10 6z"/>';
}
playBtn.addEventListener('click', function(){ setPlaying(!isPlaying); });

function seekFromEvent(e){
  var rect = scrubber.getBoundingClientRect();
  var x = (e.touches ? e.touches[0].clientX : e.clientX) - rect.left;
  var p = clamp(x/rect.width, 0, 1);
  t = p * TOTAL;
  lastSceneIdx = -1;
  render();
}
var dragging = false;
scrubber.addEventListener('pointerdown', function(e){
  dragging = true; scrubber.setPointerCapture(e.pointerId); seekFromEvent(e);
});
scrubber.addEventListener('pointermove', function(e){ if (dragging) seekFromEvent(e); });
scrubber.addEventListener('pointerup', function(){ dragging = false; });
})();
`;
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
