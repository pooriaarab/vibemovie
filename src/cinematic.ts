/**
 * cinematic.ts — the BYO-key gen-video engine: session scenes → a real mp4.
 *
 * Re-exports the beat derivation and pipeline implementation from sibling
 * modules. See cinematic-beats.ts and cinematic-pipeline.ts for details.
 */

import { execFileSync } from 'node:child_process';

export type Engine = 'hyperframes' | 'cinematic';
export const ENGINES: readonly Engine[] = ['hyperframes', 'cinematic'];

export type { Beat } from './cinematic-beats.js';
export { deriveBeats, deriveReferencePrompts } from './cinematic-beats.js';
export type { CinematicDeps, CinematicOptions, CinematicResult } from './cinematic-pipeline.js';
export { renderCinematic } from './cinematic-pipeline.js';

type ExecFn = (file: string, args: readonly string[]) => void;

const defaultExec: ExecFn = (file, args) => {
  execFileSync(file, [...args], { stdio: 'ignore' });
};

export function cinematicAvailable(env: NodeJS.ProcessEnv = process.env): boolean {
  const key = env['WAVESPEED_API_KEY'];
  return typeof key === 'string' && key.trim().length > 0;
}

export function ffmpegAvailable(execFn: ExecFn = defaultExec): boolean {
  try {
    execFn('ffmpeg', ['-version']);
    return true;
  } catch {
    return false;
  }
}
