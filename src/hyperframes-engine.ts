export function engineHeader(): string {
  return `
(function(){
"use strict";
var SCENES = `;
}

export function engineChunk1(): string {
  return `;
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
`;
}

export function engineChunk2(): string {
  return `    return ((t ^ t >>> 14) >>> 0) / 4294967296;
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
`;
}

export function engineChunk3(): string {
  return `    document.getElementById('diffRemove').style.width = (p * (total > 0 ? dels/total : 0) * 100) + '%';
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
`;
}

export function engineChunk4(): string {
  return `  var inWin = Math.min(560, dur*0.28);
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
`;
}

export function engineChunk5(): string {
  return `    sceneTitleEl.textContent = scene.kind.replace(/^\\w/, function(c){ return c.toUpperCase(); });
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

export function engineJs(scenesJson: string): string {
  return engineHeader() + scenesJson + engineChunk1() + engineChunk2() + engineChunk3() + engineChunk4() + engineChunk5();
}
