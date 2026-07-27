import { describe, expect, it } from 'vitest';

import { CliError, parseArgs, VERSION } from './cli.js';

describe('parseArgs', () => {
  it('bare invocation shows help', () => {
    expect(parseArgs([]).command).toBe('help');
  });

  it('render with defaults', () => {
    const args = parseArgs(['render']);
    expect(args.command).toBe('render');
    expect(args.ratio).toBe('16:9');
    expect(args.template).toBe('documentary');
    expect(args.engine).toBe('hyperframes');
    expect(args.out).toBe('./vibe-recap.html');
    expect(args.file).toBeUndefined();
  });

  it('render with a file and all flags', () => {
    const args = parseArgs([
      'render',
      'session.json',
      '--ratio',
      '9:16',
      '--template',
      'meme',
      '--out',
      'recap.html',
      '--title',
      'my session',
    ]);
    expect(args.file).toBe('session.json');
    expect(args.ratio).toBe('9:16');
    expect(args.template).toBe('meme');
    expect(args.out).toBe('recap.html');
    expect(args.title).toBe('my session');
  });

  it('supports --flag=value form', () => {
    const args = parseArgs(['render', 's.json', '--ratio=1:1', '--template=speedrun', '--out=o.html']);
    expect(args.ratio).toBe('1:1');
    expect(args.template).toBe('speedrun');
    expect(args.out).toBe('o.html');
  });

  it('accepts flags before the command', () => {
    const args = parseArgs(['--ratio', '9:16', 'render', 's.json']);
    expect(args.command).toBe('render');
    expect(args.ratio).toBe('9:16');
    expect(args.file).toBe('s.json');
  });

  it('mcp command', () => {
    expect(parseArgs(['mcp']).command).toBe('mcp');
  });

  it('--version / -V', () => {
    expect(parseArgs(['--version']).command).toBe('version');
    expect(parseArgs(['-V']).command).toBe('version');
  });

  it('--help / -h / help', () => {
    expect(parseArgs(['--help']).command).toBe('help');
    expect(parseArgs(['-h']).command).toBe('help');
    expect(parseArgs(['help']).command).toBe('help');
  });

  it('rejects an unknown command', () => {
    expect(() => parseArgs(['frobnicate'])).toThrow(CliError);
    expect(() => parseArgs(['frobnicate'])).toThrow(/unknown command/);
  });

  it('rejects unknown flags', () => {
    expect(() => parseArgs(['render', '--wat'])).toThrow(/unknown flag: --wat/);
    expect(() => parseArgs(['render', '-x'])).toThrow(/unknown flag: -x/);
  });

  it('rejects invalid enum values with a helpful message', () => {
    expect(() => parseArgs(['render', '--ratio', '4:3'])).toThrow(/invalid --ratio "4:3"/);
    expect(() => parseArgs(['render', '--template', 'noir'])).toThrow(/invalid --template "noir"/);
    expect(() => parseArgs(['render', '--engine', 'imax'])).toThrow(/invalid --engine "imax"/);
  });

  it('--engine cinematic switches the default output to mp4', () => {
    const args = parseArgs(['render', '--engine', 'cinematic']);
    expect(args.engine).toBe('cinematic');
    expect(args.out).toBe('./vibe-recap.mp4');
  });

  it('--engine accepts the = form and keeps an explicit --out', () => {
    const a = parseArgs(['render', '--engine=cinematic', '--out', 'film.mov']);
    expect(a.engine).toBe('cinematic');
    expect(a.out).toBe('film.mov');
    const b = parseArgs(['render', '--out', 'film.mov', '--engine', 'cinematic']);
    expect(b.out).toBe('film.mov');
    const c = parseArgs(['render', '--engine', 'hyperframes']);
    expect(c.out).toBe('./vibe-recap.html');
  });

  it('rejects missing flag values', () => {
    expect(() => parseArgs(['render', '--ratio'])).toThrow(/--ratio needs a value/);
    expect(() => parseArgs(['render', '--out'])).toThrow(/--out needs a value/);
    expect(() => parseArgs(['render', '--ratio='])).toThrow(/--ratio needs a value/);
  });

  it('rejects extra positionals and files for mcp', () => {
    expect(() => parseArgs(['render', 'a.json', 'b.json'])).toThrow(/unexpected argument/);
    expect(() => parseArgs(['mcp', 'x.json'])).toThrow(/mcp takes no input file/);
  });
});

describe('VERSION', () => {
  it('is a semver string', () => {
    expect(VERSION).toMatch(/^\d+\.\d+\.\d+$/);
  });
});
