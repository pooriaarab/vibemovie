import { formatMinutes } from './scenes.js';
import type { Scene } from './scenes.js';

export function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

const TICK_SVG =
  '<svg class="tick" width="20" height="20" viewBox="0 0 20 20" fill="none">' +
  '<circle cx="10" cy="10" r="9" stroke="#3a3024" stroke-width="1.4"/>' +
  '<path d="M5.5 10.2l3 3 6-6.4" stroke="#7fae8a" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" pathLength="1" stroke-dasharray="1" stroke-dashoffset="1"/>' +
  '</svg>';

function titleHtml(scene: Extract<Scene, { kind: 'title' }>): string {
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

function tasksHtml(scene: Extract<Scene, { kind: 'tasks' }>): string {
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

function diffHtml(scene: Extract<Scene, { kind: 'diff' }>): string {
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

function terminalHtml(scene: Extract<Scene, { kind: 'terminal' }>): string {
  return (
    `<section class="scene" id="${scene.id}">` +
    '<div class="terminal">' +
    '<div class="terminal-bar"><span></span><span></span><span></span><span class="name">vibe — zsh</span></div>' +
    '<div class="terminal-body" id="termBody"></div>' +
    '</div>' +
    '</section>'
  );
}

function mergeHtml(scene: Extract<Scene, { kind: 'merge' }>): string {
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

function endHtml(scene: Extract<Scene, { kind: 'end' }>): string {
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

export function sceneHtml(scene: Scene): string {
  switch (scene.kind) {
    case 'title':
      return titleHtml(scene);
    case 'tasks':
      return tasksHtml(scene);
    case 'diff':
      return diffHtml(scene);
    case 'terminal':
      return terminalHtml(scene);
    case 'merge':
      return mergeHtml(scene);
    case 'end':
      return endHtml(scene);
  }
}
