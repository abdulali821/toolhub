import type { PageServerLoad } from './$types';
import { listTools } from '$tools';
import { categories, type CategoryId } from '$lib/config/site';
import { buildSeo } from '$seo';
import { getPublicEnv } from '$server/env';

export const load: PageServerLoad = async ({ url }) => {
	const q = url.searchParams.get('q') ?? '';
	const category = url.searchParams.get('category') ?? '';
	const tools = listTools({
		q: q || undefined,
		category: (category || undefined) as CategoryId | undefined
	});

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

	return { q, category, tools, categories, seo };
};
