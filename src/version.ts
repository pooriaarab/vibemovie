/**
 * Package version, kept in sync with package.json (dist ships without it).
 * Lives in its own module so the CLI entry's is-main guard is never
 * code-split into a shared chunk.
 */
export const VERSION = '0.2.3';
