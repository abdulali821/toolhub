import { replaceState } from '$app/navigation';
import { buildShareQuery, type ShareParamsOptions } from './share-state';

/**
 * Sync declared share keys into the current URL via history.replaceState.
 * Empty values and defaults remove the param.
 *
 * Reads window.location (not reactive page.url) so effects calling this
 * only re-run when the tool's local state changes — never in response to
 * the URL update itself, which would create a write/read feedback loop.
 */
export function syncShareParams(
	params: Record<string, string | number | boolean | null | undefined>,
	keys: string[],
	options?: ShareParamsOptions
): void {
	if (typeof window === 'undefined') return;
	const query = buildShareQuery(params, keys, options);
	const current = window.location.pathname + window.location.search;
	const candidate = window.location.pathname + (query ? `?${query}` : '');
	if (current === candidate) return;

	// Query-only update on the current tool page — resolve() cannot type dynamic search strings.
	// eslint-disable-next-line svelte/no-navigation-without-resolve -- shareable tool state sync
	replaceState(candidate, {});
}
