/**
 * vibemovie MCP server (stdio) — lets an agent render a session recap.
 */

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { CallToolRequestSchema, ListToolsRequestSchema } from '@modelcontextprotocol/sdk/types.js';
import { pathToFileURL } from 'node:url';

import { renderMovie } from './index.js';
import type { RawEvent, Ratio, Template } from './index.js';
import { ENGINES } from './cinematic.js';
import type { Engine } from './cinematic.js';
import { RATIOS, TEMPLATES } from './scenes.js';
import { VERSION } from './version.js';

const RENDER_TOOL = {
  name: 'render',
  description:
    'Render an agent coding session as a recap "movie". Default engine is hyperframes — a ' +
    'self-contained animated HTML page (offline, zero keys, no data out). Set engine to ' +
    '"cinematic" for a real gen-video mp4 via wavespeed.ai (BYO key: needs WAVESPEED_API_KEY ' +
    'in the server env and ffmpeg on PATH; falls back to hyperframes when unavailable). ' +
    'Returns the HTML, or the output path when `out` is set.',
  inputSchema: {
    type: 'object',
    properties: {
      events: {
        type: 'array',
        items: { type: 'object' },
        description:
          'Session events: [{ "kind": "task-done", "ts": 1720000000000, "payload": { "label": "..." } }, ...]. ' +
          'Known kinds: task-done, tests-pass, tests-fail, error, pr-opened, pr-merged, session-end. ' +
          'Payload fields used: label, durationMin, files, additions, deletions, filesChanged, pr, branch, reviewers, passed.',
      },
      ratio: { type: 'string', enum: [...RATIOS], description: 'Player aspect ratio (default 16:9).' },
      template: { type: 'string', enum: [...TEMPLATES], description: 'Caption tone + pacing (default documentary).' },
      engine: { type: 'string', enum: [...ENGINES], description: 'Render engine (default hyperframes).' },
      title: { type: 'string', description: 'Session name on the title card.' },
      out: { type: 'string', description: 'Optional path to write the HTML (or mp4 for cinematic) to.' },
    },
    required: ['events'],
  },
} as const;

function enumArg(value: unknown, name: string, allowed: readonly string[]): string | undefined {
  if (value === undefined) return undefined;
  if (typeof value !== 'string' || !allowed.includes(value)) {
    throw new Error(`render: "${name}" must be one of ${allowed.join(', ')}`);
  }
  return value;
}

function validateStringArg(value: unknown, name: string): string | undefined {
  if (value === undefined) return undefined;
  if (typeof value !== 'string') throw new Error(`render: "${name}" must be a string`);
  return value;
}

interface ParsedRenderArgs {
  events: RawEvent[];
  ratio?: Ratio;
  template?: Template;
  engine?: Engine;
  title?: string;
  out?: string;
}

function parseRenderArgs(raw: Record<string, unknown>): ParsedRenderArgs {
  if (!Array.isArray(raw['events'])) {
    throw new Error('render: "events" must be an array of event objects');
  }
  const ratio = enumArg(raw['ratio'], 'ratio', RATIOS) as Ratio | undefined;
  const template = enumArg(raw['template'], 'template', TEMPLATES) as Template | undefined;
  const engine = enumArg(raw['engine'], 'engine', ENGINES) as Engine | undefined;
  const title = validateStringArg(raw['title'], 'title');
  const out = validateStringArg(raw['out'], 'out');
  return { events: raw['events'] as RawEvent[], ...(ratio !== undefined ? { ratio } : {}), ...(template !== undefined ? { template } : {}), ...(engine !== undefined ? { engine } : {}), ...(title !== undefined ? { title } : {}), ...(out !== undefined ? { out } : {}) };
}

async function handleRender(raw: Record<string, unknown>): Promise<{ content: { type: 'text'; text: string }[] }> {
  const parsed = parseRenderArgs(raw);
  const result = await renderMovie(parsed.events, {
    ...(parsed.ratio !== undefined ? { ratio: parsed.ratio } : {}),
    ...(parsed.template !== undefined ? { template: parsed.template } : {}),
    ...(parsed.engine !== undefined ? { engine: parsed.engine } : {}),
    ...(parsed.title !== undefined ? { title: parsed.title } : {}),
    ...(parsed.out !== undefined ? { out: parsed.out } : {}),
    log: (msg) => process.stderr.write(`${msg}\n`),
  });
  const tier =
    result.engine === 'cinematic'
      ? 'cinematic · wavespeed gen-video + eleven-v3 narration · BYO key'
      : 'hyperframes · offline · zero keys';
  const text =
    result.path !== undefined ? `vibemovie recap written to ${result.path} (${tier})` : (result.html ?? '');
  return { content: [{ type: 'text', text }] };
}

export async function startMcpServer(): Promise<void> {
  const server = new Server({ name: 'vibemovie', version: VERSION }, { capabilities: { tools: {} } });

  server.setRequestHandler(ListToolsRequestSchema, () => Promise.resolve({ tools: [RENDER_TOOL] }));

  server.setRequestHandler(CallToolRequestSchema, async (req) => {
    if (req.params.name !== 'render') {
      throw new Error(`unknown tool: ${req.params.name}`);
    }
    const args = (req.params.arguments ?? {}) as Record<string, unknown>;
    return handleRender(args);
  });

  await server.connect(new StdioServerTransport());
}

const invokedAsScript =
  typeof process.argv[1] === 'string' && import.meta.url === pathToFileURL(process.argv[1]).href;

if (invokedAsScript) {
  startMcpServer().catch((err: unknown) => {
    const msg = err instanceof Error ? err.message : String(err);
    process.stderr.write(`vibemovie mcp: ${msg}\n`);
    process.exitCode = 1;
  });
}
