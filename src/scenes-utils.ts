export function isRecord(v: unknown): v is Record<string, unknown> {
  return typeof v === 'object' && v !== null && !Array.isArray(v);
}

export function num(v: unknown): number | null {
  return typeof v === 'number' && Number.isFinite(v) ? v : null;
}

export function str(v: unknown): string | null {
  return typeof v === 'string' && v.trim().length > 0 ? v : null;
}

export function strArr(v: unknown): string[] {
  return Array.isArray(v) ? v.filter((x): x is string => typeof x === 'string' && x.length > 0) : [];
}

export function firstStr(payload: Record<string, unknown>, keys: readonly string[]): string | null {
  for (const k of keys) {
    const v = str(payload[k]);
    if (v !== null) return v;
  }
  return null;
}

export function firstNum(payload: Record<string, unknown>, keys: readonly string[]): number | null {
  for (const k of keys) {
    const v = num(payload[k]);
    if (v !== null) return v;
  }
  return null;
}

export function basename(p: string): string {
  const parts = p.split(/[\\/]/).filter((s) => s.length > 0);
  return parts.length > 0 ? (parts[parts.length - 1] as string) : p;
}

export function isNonNullish<T>(v: T | null | undefined): v is T {
  return v !== null && v !== undefined;
}

export function formatMinutes(totalMinutes: number): string {
  const h = Math.floor(totalMinutes / 60);
  const m = totalMinutes % 60;
  return h > 0 ? `${h}h ${m}m` : `${m}m`;
}

export function plural(n: number, word: string): string {
  return `${n} ${word}${n === 1 ? '' : 's'}`;
}
