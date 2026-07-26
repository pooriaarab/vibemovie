/**
 * scenes.ts — pure events → scene-list compiler.
 *
 * Takes normalized `VibeEvent`s (from vibe-core) or loose `RawEvent`s (anything a
 * harness/logger might emit) and compiles them into an ordered, fully-described
 * scene list for the Hyperframes renderer. No IO, no randomness, no clock — the
 * same events always produce the same scenes, which makes this unit-testable and
 * the rendered HTML deterministic.
 */

import type { VibeEvent } from '@pooriaarab/vibe-core';

export type Ratio = '16:9' | '9:16' | '1:1';
export type Template = 'documentary' | 'speedrun' | 'meme';
export type Transition = 'fade' | 'slide' | 'scale' | 'rise';
export type SceneKind = 'title' | 'tasks' | 'diff' | 'terminal' | 'merge' | 'end';

export const RATIOS: readonly Ratio[] = ['16:9', '9:16', '1:1'];
export const TEMPLATES: readonly Template[] = ['documentary', 'speedrun', 'meme'];

/**
 * A loosely-shaped event from any source: a harness transcript export, a JSON
 * log, a hand-written fixture. Any field may be missing; known aliases
 * (`type`/`timestamp`) are normalized.
 */
export interface RawEvent {
  kind?: string;
  type?: string;
  ts?: number;
  timestamp?: number | string;
  agent?: string;
  cwd?: string;
  payload?: Record<string, unknown>;
}

export interface BuildOptions {
  /** Accepted for API symmetry with the renderer; layout is a render-time concern. */
  ratio?: Ratio;
  /** Caption tone + pacing. Default 'documentary'. */
  template?: Template;
  /** Session name for the title card. Default: basename of the events' cwd. */
  title?: string;
}

export interface TitleData {
  sessionName: string;
  /** Total session length in whole minutes, counted up during the title scene. */
  totalMinutes: number;
  subtitle: string;
}

export interface TaskRow {
  label: string;
  durationMin?: number;
}

export interface TasksData {
  /** Real number of completed tasks (may exceed `tasks.length`). */
  total: number;
  /** Rows actually shown (capped at MAX_TASK_ROWS). */
  tasks: TaskRow[];
}

export interface DiffData {
  filesChanged: number;
  additions: number;
  deletions: number;
  /** Up to 4 representative file paths. */
  files: string[];
}

export interface TermLine {
  text: string;
  cls: 'ok' | '';
}

export interface TerminalData {
  lines: TermLine[];
}

export interface MergeData {
  pr: number | null;
  branch: string;
  reviewers: number | null;
  merged: boolean;
}

export interface EndData {
  tagline: string;
}

interface SceneBase {
  /** DOM id in the rendered page, `scene-<kind>`. */
  id: string;
  transition: Transition;
  /** Milliseconds on the timeline. */
  duration: number;
  /** Narrator caption shown while the scene is live. */
  caption: string;
}

export type Scene =
  | (SceneBase & { kind: 'title'; data: TitleData })
  | (SceneBase & { kind: 'tasks'; data: TasksData })
  | (SceneBase & { kind: 'diff'; data: DiffData })
  | (SceneBase & { kind: 'terminal'; data: TerminalData })
  | (SceneBase & { kind: 'merge'; data: MergeData })
  | (SceneBase & { kind: 'end'; data: EndData });

/** ------------------------------------------------------------------ */

interface NormEvent {
  kind: string;
  ts: number;
  agent: string | null;
  cwd: string | null;
  payload: Record<string, unknown>;
}

const MAX_TASK_ROWS = 5;
const MAX_DIFF_FILES = 4;
const MAX_TERM_LINES = 5;

/** Base scene durations (ms), per template. Documentary matches the prototype. */
const PACING: Record<Template, Record<SceneKind, number>> = {
  documentary: { title: 4200, tasks: 4200, diff: 4200, terminal: 4600, merge: 4600, end: 3400 },
  speedrun: { title: 2500, tasks: 2500, diff: 2500, terminal: 2800, merge: 2800, end: 2200 },
  meme: { title: 3600, tasks: 3600, diff: 3600, terminal: 3900, merge: 3900, end: 3000 },
};

const TRANSITIONS: Record<SceneKind, Transition> = {
  title: 'fade',
  tasks: 'slide',
  diff: 'scale',
  terminal: 'rise',
  merge: 'fade',
  end: 'fade',
};

function isRecord(v: unknown): v is Record<string, unknown> {
  return typeof v === 'object' && v !== null && !Array.isArray(v);
}

function num(v: unknown): number | null {
  return typeof v === 'number' && Number.isFinite(v) ? v : null;
}

function str(v: unknown): string | null {
  return typeof v === 'string' && v.trim().length > 0 ? v : null;
}

function strArr(v: unknown): string[] {
  return Array.isArray(v) ? v.filter((x): x is string => typeof x === 'string' && x.length > 0) : [];
}

function firstStr(payload: Record<string, unknown>, keys: readonly string[]): string | null {
  for (const k of keys) {
    const v = str(payload[k]);
    if (v !== null) return v;
  }
  return null;
}

function firstNum(payload: Record<string, unknown>, keys: readonly string[]): number | null {
  for (const k of keys) {
    const v = num(payload[k]);
    if (v !== null) return v;
  }
  return null;
}

/** Normalize VibeEvent | RawEvent into one internal shape, sorted by timestamp. */
function normalize(events: readonly (VibeEvent | RawEvent)[]): NormEvent[] {
  const out: NormEvent[] = [];
  for (const e of events) {
    if (!isRecord(e)) continue;
    const kind = str(e.kind) ?? str((e as RawEvent).type) ?? 'event';
    let ts = 0;
    if (num(e.ts) !== null) ts = num(e.ts) as number;
    else if (typeof e.timestamp === 'number' && Number.isFinite(e.timestamp)) ts = e.timestamp;
    else if (typeof e.timestamp === 'string') {
      const parsed = Date.parse(e.timestamp);
      if (!Number.isNaN(parsed)) ts = parsed;
    }
    out.push({
      kind,
      ts,
      agent: str(e.agent),
      cwd: str(e.cwd),
      payload: isRecord(e.payload) ? e.payload : {},
    });
  }
  return out.sort((a, b) => a.ts - b.ts);
}

function basename(p: string): string {
  const parts = p.split(/[\\/]/).filter((s) => s.length > 0);
  return parts.length > 0 ? (parts[parts.length - 1] as string) : p;
}

/** `134` → "2h 14m", `47` → "47m". */
export function formatMinutes(totalMinutes: number): string {
  const h = Math.floor(totalMinutes / 60);
  const m = totalMinutes % 60;
  return h > 0 ? `${h}h ${m}m` : `${m}m`;
}

function plural(n: number, word: string): string {
  return `${n} ${word}${n === 1 ? '' : 's'}`;
}

const TASK_KINDS = new Set(['task-done', 'task', 'todo-done', 'commit', 'milestone']);
const PR_OPEN_KINDS = new Set(['pr-opened', 'pull-request', 'pull-request-opened']);
const PR_MERGE_KINDS = new Set(['pr-merged', 'pull-request-merged', 'merge']);

function collectTasks(events: readonly NormEvent[]): TaskRow[] {
  const rows: TaskRow[] = [];
  for (const e of events) {
    if (!TASK_KINDS.has(e.kind)) continue;
    const label = firstStr(e.payload, ['label', 'task', 'title', 'summary', 'message']) ?? `Task ${rows.length + 1}`;
    const durationMin = firstNum(e.payload, ['durationMin', 'duration_min', 'minutes']);
    rows.push(durationMin !== null ? { label, durationMin } : { label });
  }
  return rows;
}

function collectDiff(events: readonly NormEvent[]): DiffData {
  const files = new Set<string>();
  let additions = 0;
  let deletions = 0;
  let filesChanged = 0;
  for (const e of events) {
    for (const f of strArr(e.payload['files'])) files.add(f);
    additions += firstNum(e.payload, ['additions', 'adds', 'added']) ?? 0;
    deletions += firstNum(e.payload, ['deletions', 'dels', 'removed']) ?? 0;
    const fc = firstNum(e.payload, ['filesChanged', 'files_changed']);
    if (fc !== null) filesChanged = Math.max(filesChanged, fc);
  }
  if (filesChanged === 0) filesChanged = files.size;
  return { filesChanged, additions, deletions, files: [...files].slice(0, MAX_DIFF_FILES) };
}

function collectPr(events: readonly NormEvent[]): MergeData | null {
  let opened: NormEvent | null = null;
  let merged: NormEvent | null = null;
  for (const e of events) {
    if (PR_MERGE_KINDS.has(e.kind) && merged === null) merged = e;
    if (PR_OPEN_KINDS.has(e.kind) && opened === null) opened = e;
  }
  const source = merged ?? opened;
  if (source === null) return null;
  return {
    pr: firstNum(source.payload, ['pr', 'number', 'prNumber', 'pr_number']),
    branch: firstStr(source.payload, ['branch', 'base', 'into']) ?? 'main',
    reviewers: firstNum(source.payload, ['reviewers', 'reviewedBy', 'approvals']),
    merged: merged !== null,
  };
}

function collectTermLines(events: readonly NormEvent[], pr: MergeData | null): TermLine[] {
  const lines: TermLine[] = [];
  const push = (text: string, cls: 'ok' | '' = '') => {
    if (lines.length < MAX_TERM_LINES) lines.push({ text, cls });
  };
  for (const e of events) {
    if (lines.length >= MAX_TERM_LINES) break;
    if (e.kind === 'tests-pass') {
      const passed = firstNum(e.payload, ['passed', 'count', 'tests']);
      push('$ npm test');
      push(passed !== null ? `✓ ${passed} passed` : '✓ tests passed', 'ok');
    } else if (e.kind === 'tests-fail') {
      const failed = firstNum(e.payload, ['failed', 'count']);
      push('$ npm test');
      push(failed !== null ? `✗ ${failed} failing` : '✗ tests failing');
    } else if (e.kind === 'error') {
      const msg = firstStr(e.payload, ['message', 'error', 'label']) ?? 'something broke';
      push(`✗ ${msg}`);
    }
  }
  if (pr !== null && lines.length <= MAX_TERM_LINES - 2) {
    push('$ git push');
    push(`→ pushed to origin/${pr.branch}`, 'ok');
  }
  if (lines.length === 0 && events.length > 0) {
    push('$ vibemovie render');
    push(`✓ ${plural(events.length, 'event')} recapped`, 'ok');
  }
  return lines;
}

/** Caption tone per template. */
function captions(template: Template, stats: {
  totalMinutes: number;
  tasks: number;
  diff: DiffData;
  pr: MergeData | null;
  hasTests: boolean;
}): Record<SceneKind, string> {
  const { totalMinutes, tasks, diff, pr } = stats;
  const dur = formatMinutes(totalMinutes);
  const prWord = pr !== null ? (pr.merged ? 'merged' : 'opened') : '';
  const prNum = pr?.pr !== null && pr?.pr !== undefined ? `#${pr.pr} ` : '';
  if (template === 'speedrun') {
    return {
      title: totalMinutes > 0 ? `${dur}. go.` : 'a session. go.',
      tasks: `${plural(tasks, 'task')}. done.`,
      diff: `+${diff.additions} −${diff.deletions} across ${plural(diff.filesChanged, 'file')}.`,
      terminal: 'green. ship.',
      merge: `${prNum}${prWord}. next.`,
      end: 'gg.',
    };
  }
  if (template === 'meme') {
    return {
      title: 'touch grass? never heard of it.',
      tasks: `${plural(tasks, 'task')} speedrun any%`,
      diff: 'number go up',
      terminal: 'it compiles. ship it.',
      merge: pr !== null && pr.merged ? 'LGTM said the reviewer' : 'CI roulette champion',
      end: 'same time tomorrow?',
    };
  }
  return {
    title: totalMinutes > 0 ? `${dur} in the flow.` : 'A session worth replaying.',
    tasks: `${plural(tasks, 'task')} landed, clean.`,
    diff:
      diff.additions >= diff.deletions
        ? `${plural(diff.filesChanged, 'file')} touched — more added than removed.`
        : `${plural(diff.filesChanged, 'file')} touched — more removed than added.`,
    terminal: stats.hasTests ? 'Tests green. Shipped.' : 'The commands tell the story.',
    merge: pr !== null ? `Pull request ${prNum}${prWord}.` : '',
    end: "That's the session. Run it back.",
  };
}

function scene<K extends Scene['kind']>(
  kind: K,
  template: Template,
  caption: string,
  data: Extract<Scene, { kind: K }>['data'],
): Extract<Scene, { kind: K }> {
  return {
    id: `scene-${kind}`,
    kind,
    transition: TRANSITIONS[kind],
    duration: PACING[template][kind],
    caption,
    data,
  } as Extract<Scene, { kind: K }>;
}

/**
 * Compile events into an ordered scene list.
 *
 * Always emits a title card and an end card; the middle scenes appear only when
 * the events carry the data for them (tasks → task ticks, file/diff stats →
 * animated diff, notable command events → terminal moment, PR event → merge
 * celebration). Empty input yields `[title, end]`.
 *
 * PURE: no IO, no clock, no randomness.
 */
export function buildScenes(events: readonly (VibeEvent | RawEvent)[], opts: BuildOptions = {}): Scene[] {
  const template: Template = opts.template ?? 'documentary';
  const norm = normalize(events);

  const first = norm[0];
  const last = norm[norm.length - 1];
  const totalMinutes =
    first !== undefined && last !== undefined && last.ts > first.ts
      ? Math.round((last.ts - first.ts) / 60000)
      : 0;

  const sessionName = opts.title ?? (first?.cwd != null ? basename(first.cwd) : 'vibe session');
  const agent = first?.agent ?? 'agentic';

  const tasks = collectTasks(norm);
  const diff = collectDiff(norm);
  const pr = collectPr(norm);
  const termLines = collectTermLines(norm, pr);
  const hasTests = norm.some((e) => e.kind === 'tests-pass');
  const caps = captions(template, { totalMinutes, tasks: tasks.length, diff, pr, hasTests });

  const scenes: Scene[] = [
    scene('title', template, caps.title, {
      sessionName,
      totalMinutes,
      subtitle: `${agent} coding session · recapped on-device`,
    }),
  ];

  if (tasks.length > 0) {
    scenes.push(
      scene('tasks', template, caps.tasks, { total: tasks.length, tasks: tasks.slice(0, MAX_TASK_ROWS) }),
    );
  }

  if (diff.filesChanged > 0 || diff.additions + diff.deletions > 0) {
    scenes.push(scene('diff', template, caps.diff, diff));
  }

  if (termLines.length > 0) {
    scenes.push(scene('terminal', template, caps.terminal, { lines: termLines }));
  }

  if (pr !== null) {
    scenes.push(scene('merge', template, caps.merge, pr));
  }

  scenes.push(scene('end', template, caps.end, { tagline: 'generated on-device · hyperframes' }));

  return scenes;
}
