/**
 * vibemovie MCP server (stdio) — lets an agent render a session recap.
 *
 * Exposes one tool, `render`: { events, ratio?, template?, out? } → the recap
 * HTML (or the output path when `out` is given). Rendering is the local
 * Hyperframes tier, so the tool works offline with zero keys.
 *
 * Uses the SDK's low-level Server with a plain JSON Schema for input — no
 * schema-library dependency beyond the SDK itself.
 */

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { CallToolRequestSchema, ListToolsRequestSchema } from '@modelcontextprotocol/sdk/types.js';
import { pathToFileURL } from 'node:url';

import { renderMovie } from './index.js';
import type { RawEvent, Ratio, Template } from './index.js';
import { RATIOS, TEMPLATES } from './scenes.js';
import { VERSION } from './version.js';

const RENDER_TOOL = {
  name: 'render',
  description:
    'Render an agent coding session as a recap "movie" — a self-contained animated HTML page ' +
    '(Hyperframes tier: offline, zero keys, no data out). Returns the HTML, or the output path when `out` is set.',
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
      title: { type: 'string', description: 'Session name on the title card.' },
      out: { type: 'string', description: 'Optional path to write the HTML to.' },
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

export async function startMcpServer(): Promise<void> {
  const server = new Server({ name: 'vibemovie', version: VERSION }, { capabilities: { tools: {} } });

  server.setRequestHandler(ListToolsRequestSchema, () => Promise.resolve({ tools: [RENDER_TOOL] }));

  server.setRequestHandler(CallToolRequestSchema, async (req) => {
    if (req.params.name !== 'render') {
      throw new Error(`unknown tool: ${req.params.name}`);
    }
    const args = (req.params.arguments ?? {}) as Record<string, unknown>;
    if (!Array.isArray(args['events'])) {
      throw new Error('render: "events" must be an array of event objects');
    }
    const ratio = enumArg(args['ratio'], 'ratio', RATIOS) as Ratio | undefined;
    const template = enumArg(args['template'], 'template', TEMPLATES) as Template | undefined;
    const title = args['title'];
    const out = args['out'];
    if (title !== undefined && typeof title !== 'string') throw new Error('render: "title" must be a string');
    if (out !== undefined && typeof out !== 'string') throw new Error('render: "out" must be a string');

    const result = await renderMovie(args['events'] as RawEvent[], {
      ...(ratio !== undefined ? { ratio } : {}),
      ...(template !== undefined ? { template } : {}),
      ...(title !== undefined ? { title } : {}),
      ...(out !== undefined ? { out } : {}),
    });

    const text =
      result.path !== undefined
        ? `vibemovie recap written to ${result.path} (hyperframes · offline · zero keys)`
        : result.html;
    return { content: [{ type: 'text', text }] };
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
