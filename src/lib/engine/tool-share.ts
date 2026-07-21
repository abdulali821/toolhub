/**
 * Helpers for wiring shareable tool URL state without sync loops.
 *
 * Pattern in tool UI:
 *   $effect(() => pullShareState(fromUrl, apply));
 *   $effect(() => pushShareState(params, keys, { defaults }));
 */
import { untrack } from 'svelte';
import { page } from '$app/state';
import {
	readShareBool,
	readShareNumber,
	readShareParam,
	type ShareParamsOptions
} from './share-state';
import { syncShareParams } from './sync-share';

export { readShareBool, readShareNumber, readShareParam };

/** Reactive URLSearchParams — call inside $effect / $derived so page.url is tracked. */
export function urlSearchParams(): URLSearchParams {
	return page.url.searchParams;
}

/**
 * URL → local state. Tracks page.url only; apply() runs untracked so typing
 * never re-triggers this effect.
 */
export function pullShareState<T>(fromUrl: () => T, apply: (next: T) => void): void {
	const next = fromUrl();
	untrack(() => apply(next));
}

/** Local state → URL. Does not subscribe to page.url. */
export function pushShareState(
	params: Record<string, string | number | boolean | null | undefined>,
	keys: string[],
	options?: ShareParamsOptions
): void {
	syncShareParams(params, keys, options);
}
