#!/usr/bin/env node
/**
 * vibemovie CLI — render a session recap from JSON events, or serve MCP.
 */

import { readFile } from 'node:fs/promises';

import { renderMovie } from './index.js';
import type { RawEvent, Ratio, Template } from './index.js';
import { ENGINES } from './cinematic.js';
import type { Engine } from './cinematic.js';
import { RATIOS, TEMPLATES } from './scenes.js';
import { VERSION } from './version.js';

export { VERSION };

export class CliError extends Error {}

export interface CliArgs {
  command: 'render' | 'mcp' | 'help' | 'version';
  file?: string;
  ratio: Ratio;
  template: Template;
  engine: Engine;
  out: string;
  title?: string;
}

const HELP = `vibemovie — your agent coding session as a short recap video

Usage:
  vibemovie render [file.json] [options]   render a recap (file or stdin)
  vibemovie mcp                            start the MCP server (stdio)
  vibemovie --version                      print version
  vibemovie --help                         show this help

Options:
  --ratio 16:9|9:16|1:1                    player aspect ratio (default 16:9)
  --template documentary|speedrun|meme     caption tone + pacing (default documentary)
  --engine hyperframes|cinematic           render engine (default hyperframes)
  --out <path>                             output file (default ./vibe-recap.html,
                                           or ./vibe-recap.mp4 for cinematic)
  --title <name>                           session name on the title card

Input: a JSON array of events (or { "events": [...] }). Each event:
  { "kind": "task-done", "ts": 1720000000000, "payload": { "label": "..." } }

Engines:
  hyperframes  renders on-device: offline, zero keys, no data out.
  cinematic    real gen-video mp4 via wavespeed.ai (BYO key) + ElevenLabs VO.
               Needs WAVESPEED_API_KEY in the env and ffmpeg on PATH; falls
               back to hyperframes when either is missing.
`;

function takeValue(argv: readonly string[], i: number, flag: string, inline: string | undefined): { value: string; next: number } {
  if (inline !== undefined) {
    if (inline.length === 0) throw new CliError(`${flag} needs a value`);
    return { value: inline, next: i };
  }
  const v = argv[i + 1];
  if (v === undefined || v.startsWith('--')) throw new CliError(`${flag} needs a value`);
  return { value: v, next: i + 1 };
}

function applyRatio(value: string, args: CliArgs): void {
  if (!(RATIOS as readonly string[]).includes(value)) {
    throw new CliError(`invalid --ratio "${value}" (expected ${RATIOS.join('|')})`);
  }
  args.ratio = value as Ratio;
}

function applyTemplate(value: string, args: CliArgs): void {
  if (!(TEMPLATES as readonly string[]).includes(value)) {
    throw new CliError(`invalid --template "${value}" (expected ${TEMPLATES.join('|')})`);
  }
  args.template = value as Template;
}

function applyEngine(value: string, args: CliArgs): void {
  if (!(ENGINES as readonly string[]).includes(value)) {
    throw new CliError(`invalid --engine "${value}" (expected ${ENGINES.join('|')})`);
  }
  args.engine = value as Engine;
}

function applyFlag(flag: string, value: string, args: CliArgs, state: { sawOut: boolean }): void {
  if (flag === '--ratio') applyRatio(value, args);
  else if (flag === '--template') applyTemplate(value, args);
  else if (flag === '--engine') applyEngine(value, args);
  else if (flag === '--out') {
    args.out = value;
    state.sawOut = true;
  } else if (flag === '--title') {
    args.title = value;
  }
}

function handleLongFlag(
  tok: string,
  argv: readonly string[],
  i: number,
  ctx: { args: CliArgs; state: { sawOut: boolean } },
): number | null {
  if (!tok.startsWith('--')) return null;
  const eq = tok.indexOf('=');
  const flag = eq === -1 ? tok : tok.slice(0, eq);
  const allowed = new Set(['--ratio', '--template', '--engine', '--out', '--title']);
  if (!allowed.has(flag)) throw new CliError(`unknown flag: ${flag}`);
  const inline = eq === -1 ? undefined : tok.slice(eq + 1);
  const { value, next } = takeValue(argv, i, flag, inline);
  applyFlag(flag, value, ctx.args, ctx.state);
  return next;
}

function handleHelpVersion(tok: string, args: CliArgs): boolean {
  if (tok === '--help' || tok === '-h') {
    args.command = 'help';
    return true;
  }
  if (tok === '--version' || tok === '-V' || tok === '-v') {
    args.command = 'version';
    return true;
  }
  return false;
}

function handleCommand(tok: string, args: CliArgs, state: { sawCommand: boolean }): boolean {
  if (state.sawCommand || tok.startsWith('-')) return false;
  if (tok === 'render' || tok === 'mcp') {
    args.command = tok;
    state.sawCommand = true;
    return true;
  }
  if (tok === 'help') {
    args.command = 'help';
    state.sawCommand = true;
    return true;
  }
  throw new CliError(`unknown command: ${tok}`);
}

function handlePositional(tok: string, args: CliArgs, state: { sawFile: boolean }): void {
  if (tok.startsWith('-') && tok !== '-') throw new CliError(`unknown flag: ${tok}`);
  if (!state.sawFile) {
    args.file = tok;
    state.sawFile = true;
  } else {
    throw new CliError(`unexpected argument: ${tok}`);
  }
}

function finalizeArgs(args: CliArgs, state: { sawFile: boolean; sawOut: boolean }): void {
  if (args.command === 'mcp' && (args.file !== undefined || state.sawFile)) {
    throw new CliError('mcp takes no input file');
  }
  if (args.engine === 'cinematic' && !state.sawOut) {
    args.out = './vibe-recap.mp4';
  }
}

export function parseArgs(argv: readonly string[]): CliArgs {
  if (argv.length === 0) {
    return { command: 'help', ratio: '16:9', template: 'documentary', engine: 'hyperframes', out: './vibe-recap.html' };
  }
  const args: CliArgs = { command: 'render', ratio: '16:9', template: 'documentary', engine: 'hyperframes', out: './vibe-recap.html' };
  const state = { sawCommand: false, sawFile: false, sawOut: false };
  for (let i = 0; i < argv.length; i++) {
    const tok = argv[i] as string;
    if (handleHelpVersion(tok, args)) continue;
    if (handleCommand(tok, args, state)) continue;
    const next = handleLongFlag(tok, argv, i, { args, state });
    if (next !== null) {
      i = next;
      continue;
    }
    handlePositional(tok, args, state);
  }
  finalizeArgs(args, state);
  return args;
}

async function readStdin(): Promise<string> {
  const chunks: Buffer[] = [];
  for await (const chunk of process.stdin) {
    chunks.push(chunk as Buffer);
  }
  return Buffer.concat(chunks).toString('utf8');
}

async function readInput(file: string | undefined): Promise<string> {
  if (file !== undefined && file !== '-') {
    try {
      return await readFile(file, 'utf8');
    } catch {
      throw new CliError(`cannot read ${file}`);
    }
  }
  if (process.stdin.isTTY) {
    throw new CliError('no input — pass a JSON file or pipe events on stdin (try --help)');
  }
  return readStdin();
}

function parseEvents(json: string): RawEvent[] {
  let data: unknown;
  try {
    data = JSON.parse(json);
  } catch {
    throw new CliError('input is not valid JSON');
  }
  const events = Array.isArray(data)
    ? data
    : typeof data === 'object' && data !== null && Array.isArray((data as { events?: unknown }).events)
      ? ((data as { events: unknown[] }).events as unknown[])
      : null;
  if (events === null) {
    throw new CliError('expected a JSON array of events (or { "events": [...] })');
  }
  return events as RawEvent[];
}

export async function main(argv: readonly string[]): Promise<void> {
  const args = parseArgs(argv);

  if (args.command === 'help') {
    process.stdout.write(HELP);
    return;
  }
  if (args.command === 'version') {
    process.stdout.write(`${VERSION}\n`);
    return;
  }
  if (args.command === 'mcp') {
    const { startMcpServer } = await import('./mcp.js');
    await startMcpServer();
    return;
  }

  const input = await readInput(args.file);
  const events = parseEvents(input);
  const result = await renderMovie(events, {
    ratio: args.ratio,
    template: args.template,
    engine: args.engine,
    out: args.out,
    log: (msg) => process.stderr.write(`${msg}\n`),
    ...(args.title !== undefined ? { title: args.title } : {}),
  });
  process.stdout.write(`✓ recap rendered → ${result.path as string}\n`);
  process.stdout.write(
    result.engine === 'cinematic'
      ? '  cinematic · wavespeed gen-video + eleven-v3 narration · BYO key\n'
      : '  hyperframes · offline · zero keys\n',
  );
}

const invokedAsScript =
  typeof process.argv[1] === 'string';

if (invokedAsScript) {
  main(process.argv.slice(2)).catch((err: unknown) => {
    const msg = err instanceof Error ? err.message : String(err);
    process.stderr.write(`vibemovie: ${msg}\n`);
    process.exitCode = 1;
  });
}
