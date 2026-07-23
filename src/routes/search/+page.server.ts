import type { PageServerLoad } from './$types';
import { categories } from '$lib/config/site';
import { buildSeo } from '$seo';
import { getPublicEnv } from '$server/env';

/** Same featured set as homepage — used for “popular” empty state. */
const SEARCH_POPULAR_IDS = [
	'json-formatter',
	'password-generator',
	'word-counter',
	'base64-codec',
	'color-converter',
	'regex-tester'
] as const;

export const load: PageServerLoad = async ({ url }) => {
	const q = url.searchParams.get('q') ?? '';
	const category = url.searchParams.get('category') ?? '';
	const sort = url.searchParams.get('sort') ?? 'relevance';

	const siteUrl = getPublicEnv().PUBLIC_SITE_URL ?? url.origin;
	const seo = buildSeo(
		{
			title: q ? `Search: ${q}` : 'Search tools',
			description: 'Search ToolHub’s catalog of free online tools by name, tag, or task.',
			canonicalPath: '/search',
			robots: 'noindex,follow'
		},
		siteUrl
	);

	return {
		q,
		category,
		sort,
		categories,
		popularIds: [...SEARCH_POPULAR_IDS],
		seo
	};
};
