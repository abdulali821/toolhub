import { isSlug } from '$lib/utils/string';

/** Matches kebab-case tool / category slugs for dynamic routes. */
export function match(param: string): boolean {
	return isSlug(param);
}
