import { firstNum, firstStr, plural, strArr } from './scenes-utils.js';
import type { NormEvent } from './scenes-normalize.js';
import type { DiffData, MergeData, TaskRow, TermLine } from './scenes.js';

const MAX_TASK_ROWS = 5;
const MAX_DIFF_FILES = 4;
const MAX_TERM_LINES = 5;

const TASK_KINDS = new Set(['task-done', 'task', 'todo-done', 'commit', 'milestone']);
const PR_OPEN_KINDS = new Set(['pr-opened', 'pull-request', 'pull-request-opened']);
const PR_MERGE_KINDS = new Set(['pr-merged', 'pull-request-merged', 'merge']);

export function collectTasks(events: readonly NormEvent[]): TaskRow[] {
  const rows: TaskRow[] = [];
  for (const e of events) {
    if (!TASK_KINDS.has(e.kind)) continue;
    const label = firstStr(e.payload, ['label', 'task', 'title', 'summary', 'message']) ?? `Task ${rows.length + 1}`;
    const durationMin = firstNum(e.payload, ['durationMin', 'duration_min', 'minutes']);
    rows.push(durationMin !== null ? { label, durationMin } : { label });
  }
  return rows;
}

export function collectDiff(events: readonly NormEvent[]): DiffData {
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

export function collectPr(events: readonly NormEvent[]): MergeData | null {
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

type TermHandler = (e: NormEvent, lines: TermLine[], push: (text: string, cls?: 'ok' | '') => void) => void;

const termHandlers: Record<string, TermHandler> = {
  'tests-pass': (e, _lines, push) => {
    const passed = firstNum(e.payload, ['passed', 'count', 'tests']);
    push('$ npm test');
    push(passed !== null ? `✓ ${passed} passed` : '✓ tests passed', 'ok');
  },
  'tests-fail': (e, _lines, push) => {
    const failed = firstNum(e.payload, ['failed', 'count']);
    push('$ npm test');
    push(failed !== null ? `✗ ${failed} failing` : '✗ tests failing');
  },
  error: (e, _lines, push) => {
    const msg = firstStr(e.payload, ['message', 'error', 'label']) ?? 'something broke';
    push(`✗ ${msg}`);
  },
};

function handleTermEvent(e: NormEvent, lines: TermLine[], push: (text: string, cls?: 'ok' | '') => void): void {
  const handler = termHandlers[e.kind];
  if (handler !== undefined) handler(e, lines, push);
}

function pushPrLines(pr: MergeData | null, lines: TermLine[], push: (text: string, cls?: 'ok' | '') => void): void {
  if (pr !== null && lines.length <= MAX_TERM_LINES - 2) {
    push('$ git push');
    push(`→ pushed to origin/${pr.branch}`, 'ok');
  }
}

function pushFallbackLines(events: readonly NormEvent[], lines: TermLine[], push: (text: string, cls?: 'ok' | '') => void): void {
  if (lines.length === 0 && events.length > 0) {
    push('$ vibemovie render');
    push(`✓ ${plural(events.length, 'event')} recapped`, 'ok');
  }
}

export function collectTermLines(events: readonly NormEvent[], pr: MergeData | null): TermLine[] {
  const lines: TermLine[] = [];
  const push = (text: string, cls: 'ok' | '' = '') => {
    if (lines.length < MAX_TERM_LINES) lines.push({ text, cls });
  };
  for (const e of events) {
    if (lines.length >= MAX_TERM_LINES) break;
    handleTermEvent(e, lines, push);
  }
  pushPrLines(pr, lines, push);
  pushFallbackLines(events, lines, push);
  return lines;
}

export { MAX_DIFF_FILES, MAX_TASK_ROWS, MAX_TERM_LINES };
