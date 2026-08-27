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

import { captions } from './scenes-captions.js';
import { collectDiff, collectPr, collectTasks, collectTermLines } from './scenes-collect.js';
import { MAX_TASK_ROWS } from './scenes-collect.js';
import { normalize } from './scenes-normalize.js';
import type { NormEvent } from './scenes-normalize.js';
import { basename, isNonNullish } from './scenes-utils.js';

export type Ratio = '16:9' | '9:16' | '1:1';
export type Template = 'documentary' | 'speedrun' | 'meme';
export type Transition = 'fade' | 'slide' | 'scale' | 'rise';
export type SceneKind = 'title' | 'tasks' | 'diff' | 'terminal' | 'merge' | 'end';

export const RATIOS: readonly Ratio[] = ['16:9', '9:16', '1:1'];
export const TEMPLATES: readonly Template[] = ['documentary', 'speedrun', 'meme'];

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
  ratio?: Ratio;
  template?: Template;
  title?: string;
}

export interface TitleData {
  sessionName: string;
  totalMinutes: number;
  subtitle: string;
}

export interface TaskRow {
  label: string;
  durationMin?: number;
}

export interface TasksData {
  total: number;
  tasks: TaskRow[];
}

export interface DiffData {
  filesChanged: number;
  additions: number;
  deletions: number;
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
  id: string;
  transition: Transition;
  duration: number;
  caption: string;
}

export type Scene =
  | (SceneBase & { kind: 'title'; data: TitleData })
  | (SceneBase & { kind: 'tasks'; data: TasksData })
  | (SceneBase & { kind: 'diff'; data: DiffData })
  | (SceneBase & { kind: 'terminal'; data: TerminalData })
  | (SceneBase & { kind: 'merge'; data: MergeData })
  | (SceneBase & { kind: 'end'; data: EndData });

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

export { formatMinutes } from './scenes-utils.js';

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

function computeTotalMinutes(first: NormEvent | undefined, last: NormEvent | undefined): number {
  if (first !== undefined && last !== undefined && last.ts > first.ts) {
    return Math.round((last.ts - first.ts) / 60000);
  }
  return 0;
}

function resolveSessionName(first: NormEvent | undefined, title: string | undefined): string {
  if (title !== undefined) return title;
  if (isNonNullish(first?.cwd)) return basename(first.cwd);
  return 'vibe session';
}

function buildTitleScene(opts: {
  template: Template;
  caption: string;
  sessionName: string;
  totalMinutes: number;
  agent: string;
}): Scene {
  return scene('title', opts.template, opts.caption, {
    sessionName: opts.sessionName,
    totalMinutes: opts.totalMinutes,
    subtitle: `${opts.agent} coding session · recapped on-device`,
  });
}

function maybePushTasks(
  scenes: Scene[],
  template: Template,
  caption: string,
  tasks: TaskRow[],
): void {
  if (tasks.length > 0) {
    scenes.push(scene('tasks', template, caption, { total: tasks.length, tasks: tasks.slice(0, MAX_TASK_ROWS) }));
  }
}

function maybePushDiff(
  scenes: Scene[],
  template: Template,
  caption: string,
  diff: DiffData,
): void {
  if (diff.filesChanged > 0 || diff.additions + diff.deletions > 0) {
    scenes.push(scene('diff', template, caption, diff));
  }
}

function maybePushTerminal(
  scenes: Scene[],
  template: Template,
  caption: string,
  termLines: TermLine[],
): void {
  if (termLines.length > 0) {
    scenes.push(scene('terminal', template, caption, { lines: termLines }));
  }
}

function maybePushMerge(
  scenes: Scene[],
  template: Template,
  caption: string,
  pr: MergeData | null,
): void {
  if (pr !== null) {
    scenes.push(scene('merge', template, caption, pr));
  }
}

export function buildScenes(events: readonly (VibeEvent | RawEvent)[], opts: BuildOptions = {}): Scene[] {
  const template: Template = opts.template ?? 'documentary';
  const norm = normalize(events);
  const first = norm[0];
  const last = norm[norm.length - 1];
  const totalMinutes = computeTotalMinutes(first, last);
  const sessionName = resolveSessionName(first, opts.title);
  const agent = first?.agent ?? 'agentic';
  const tasks = collectTasks(norm);
  const diff = collectDiff(norm);
  const pr = collectPr(norm);
  const termLines = collectTermLines(norm, pr);
  const hasTests = norm.some((e) => e.kind === 'tests-pass');
  const caps = captions(template, { totalMinutes, tasks: tasks.length, diff, pr, hasTests });
  const scenes: Scene[] = [buildTitleScene({ template, caption: caps.title, sessionName, totalMinutes, agent })];
  maybePushTasks(scenes, template, caps.tasks, tasks);
  maybePushDiff(scenes, template, caps.diff, diff);
  maybePushTerminal(scenes, template, caps.terminal, termLines);
  maybePushMerge(scenes, template, caps.merge, pr);
  scenes.push(scene('end', template, caps.end, { tagline: 'generated on-device · hyperframes' }));
  return scenes;
}
