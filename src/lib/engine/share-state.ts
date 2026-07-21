/**
 * Shareable tool state via URL query params.
 * Tools declare keys on ToolDefinition.share; this module reads/writes them.
 */

export type ShareParamsOptions = {
	/** Max total query-string byte length before skipping oversized values. Default 3500. */
	maxParamBytes?: number;
	/** Keys whose serialized value equals its default are omitted, keeping plain URLs clean. */
	defaults?: Record<string, string>;
};

const DEFAULT_MAX_BYTES = 3500;

export function readShareParams(
	searchParams: URLSearchParams,
	keys: string[]
): Record<string, string> {
	const out: Record<string, string> = {};
	for (const key of keys) {
		const value = searchParams.get(key);
		if (value != null && value !== '') out[key] = value;
	}
	return out;
}

export function readShareParam(searchParams: URLSearchParams, key: string): string | null {
	const value = searchParams.get(key);
	return value != null && value !== '' ? value : null;
}

export function readShareBool(
	searchParams: URLSearchParams,
	key: string,
	fallback: boolean
): boolean {
	const value = searchParams.get(key);
	if (value == null) return fallback;
	return value === '1' || value === 'true';
}

export function readShareNumber(
	searchParams: URLSearchParams,
	key: string,
	fallback: number
): number {
	const value = searchParams.get(key);
	if (value == null || value === '') return fallback;
	const n = Number(value);
	return Number.isFinite(n) ? n : fallback;
}

/** Build a query string for the given keys; drops empty values. */
export function buildShareQuery(
	params: Record<string, string | number | boolean | null | undefined>,
	keys: string[],
	options: ShareParamsOptions = {}
): string {
	const max = options.maxParamBytes ?? DEFAULT_MAX_BYTES;
	const sp = new URLSearchParams();

	for (const key of keys) {
		const raw = params[key];
		if (raw == null || raw === '') continue;
		const value = typeof raw === 'boolean' ? (raw ? 'true' : 'false') : String(raw);
		if (options.defaults?.[key] === value) continue;
		sp.set(key, value);
	}

	const query = sp.toString();
	if (byteLength(query) > max) {
		// Prefer keeping short option keys; drop the longest value first.
		return trimQueryToBudget(sp, max);
	}
	return query;
}

export function applyShareQuery(url: URL, query: string): URL {
	const next = new URL(url);
	next.search = query ? `?${query}` : '';
	return next;
}

export function buildShareUrl(
	pathname: string,
	params: Record<string, string | number | boolean | null | undefined>,
	keys: string[],
	options?: ShareParamsOptions
): string {
	const query = buildShareQuery(params, keys, options);
	return query ? `${pathname}?${query}` : pathname;
}

function byteLength(text: string): number {
	return new TextEncoder().encode(text).length;
}

function trimQueryToBudget(sp: URLSearchParams, max: number): string {
	const entries = [...sp.entries()].sort((a, b) => b[1].length - a[1].length);
	const working = new URLSearchParams(sp);
	for (const [key] of entries) {
		if (byteLength(working.toString()) <= max) break;
		working.delete(key);
	}
	return working.toString();
}

export function downloadText(
	filename: string,
	content: string,
	mime = 'text/plain;charset=utf-8'
): void {
	if (typeof document === 'undefined') return;
	if (content.startsWith('data:') || content.startsWith('blob:')) {
		const a = document.createElement('a');
		a.href = content;
		a.download = filename;
		a.click();
		if (content.startsWith('blob:')) {
			setTimeout(() => URL.revokeObjectURL(content), 1000);
		}
		return;
	}
	const blob = new Blob([content], { type: mime });
	const href = URL.createObjectURL(blob);
	const a = document.createElement('a');
	a.href = href;
	a.download = filename;
	a.click();
	URL.revokeObjectURL(href);
}

export async function copyText(value: string): Promise<boolean> {
	try {
		await navigator.clipboard.writeText(value);
		return true;
	} catch {
		return false;
	}
}
