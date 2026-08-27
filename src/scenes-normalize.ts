import type { VibeEvent } from '@pooriaarab/vibe-core';

import type { RawEvent } from './scenes.js';
import { isRecord, num, str } from './scenes-utils.js';

interface NormEvent {
  kind: string;
  ts: number;
  agent: string | null;
  cwd: string | null;
  payload: Record<string, unknown>;
}

function extractTs(e: Record<string, unknown>): number {
  const direct = num(e['ts']);
  if (direct !== null) return direct;
  const ts = e['timestamp'];
  if (typeof ts === 'number' && Number.isFinite(ts)) return ts;
  if (typeof ts === 'string') {
    const parsed = Date.parse(ts);
    if (!Number.isNaN(parsed)) return parsed;
  }
  return 0;
}

function toNormEvent(e: Record<string, unknown>): NormEvent | null {
  if (!isRecord(e)) return null;
  const kind = str(e['kind']) ?? str((e as RawEvent).type) ?? 'event';
  return {
    kind,
    ts: extractTs(e),
    agent: str(e['agent']),
    cwd: str(e['cwd']),
    payload: isRecord(e['payload']) ? (e['payload'] as Record<string, unknown>) : {},
  };
}

export function normalize(events: readonly (VibeEvent | RawEvent)[]): NormEvent[] {
  const out: NormEvent[] = [];
  for (const e of events) {
    const norm = toNormEvent(e as Record<string, unknown>);
    if (norm !== null) out.push(norm);
  }
  return out.sort((a, b) => a.ts - b.ts);
}

export type { NormEvent };
