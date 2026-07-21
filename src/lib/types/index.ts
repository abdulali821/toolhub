/** Shared TypeScript types that are not route- or feature-specific. */
export type Result<T, E = string> = { ok: true; value: T } | { ok: false; error: E };
